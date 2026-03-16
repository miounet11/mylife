import { trackServerEvent } from '@/lib/analytics';
import { emailSubscriptionOperations, fortuneOperations, reportUpgradeJobOperations, userOperations } from '@/lib/database';
import { isEmailDeliveryConfigured, sendReportUpgradeReadyEmail } from '@/lib/email';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { assessScopeProviderHealth, hasRunnableModelsForSnapshots } from '@/lib/llm-provider-health';
import { REPORT_EXPERT_TARGET_SCORE } from '@/lib/report-quality';
import { CURRENT_REPORT_VERSION, regenerateReportFromRecord } from '@/lib/report-pipeline';
import { withReportVersionLineage } from '@/lib/report-version-lineage';
import type { FortuneRecord, ReportUpgradeJobRecord } from '@/lib/user-types';

const DEFAULT_MAX_ATTEMPTS = Math.max(2, Number(process.env.REPORT_UPGRADE_MAX_ATTEMPTS || 6));
const INITIAL_DELAY_MS = Math.max(15_000, Number(process.env.REPORT_UPGRADE_INITIAL_DELAY_MS || 45_000));
const RETRY_BASE_DELAY_MS = Math.max(30_000, Number(process.env.REPORT_UPGRADE_RETRY_DELAY_MS || 1000 * 60 * 10));
const DEFAULT_BATCH_SIZE = Math.max(1, Number(process.env.REPORT_UPGRADE_BATCH_SIZE || 2));
const PROVIDER_DEFER_MS = Math.max(10 * 60 * 1000, Number(process.env.REPORT_UPGRADE_PROVIDER_DEFER_MS || 1000 * 60 * 20));

export function enqueueReportUpgrade(params: {
  report: FortuneRecord;
  reason?: string;
  force?: boolean;
  nextRunAt?: string;
  meta?: Record<string, unknown>;
}) {
  const qualityAudit = params.report.analysis?.qualityAudit;
  if (!params.force && qualityAudit?.targetAchieved) {
    return {
      queued: false,
      reason: 'already_expert',
      job: reportUpgradeJobOperations.getByReportId(params.report.id),
    };
  }

  const existing = reportUpgradeJobOperations.getByReportId(params.report.id);
  if (
    existing &&
    !params.force &&
    ['pending', 'running', 'retry'].includes(existing.status)
  ) {
    return {
      queued: false,
      reason: 'already_queued',
      job: existing,
    };
  }

  const now = new Date();
  const providerHealth = assessReportProviderHealth();
  const deferredForProvider = providerHealth.shouldDefer;
  const nextRunAt = params.nextRunAt || new Date(
    now.getTime() + (deferredForProvider
      ? PROVIDER_DEFER_MS
      : computeInitialDelayMs(qualityAudit?.overallScore || 0))
  ).toISOString();
  const bestScore = Math.max(
    qualityAudit?.overallScore || 0,
    existing?.bestScore || 0
  );

  const job: ReportUpgradeJobRecord = {
    id: existing?.id || `upgrade_${generateId()}`,
    reportId: params.report.id,
    userId: params.report.userId,
    status: deferredForProvider ? 'retry' : 'pending',
    targetScore: REPORT_EXPERT_TARGET_SCORE,
    attempts: existing?.attempts || 0,
    maxAttempts: existing?.maxAttempts || DEFAULT_MAX_ATTEMPTS,
    lastScore: qualityAudit?.overallScore || 0,
    bestScore,
    bestGrade: qualityAudit?.grade || existing?.bestGrade,
    nextRunAt,
    lastError: deferredForProvider ? 'PROVIDER_UNHEALTHY' : null,
    meta: {
      reason: params.reason || (deferredForProvider ? 'provider_unhealthy' : 'quality_gate'),
      reportVersion: params.report.reportVersion || 'v1',
      deliveryTier: qualityAudit?.deliveryTier || 'basic',
      targetAchieved: !!qualityAudit?.targetAchieved,
      deferredForProvider,
      providerHealth: deferredForProvider ? providerHealth.summary : undefined,
      ...(params.meta || {}),
    },
  };

  reportUpgradeJobOperations.enqueue(job);

  return {
    queued: true,
    reason: deferredForProvider ? 'provider_unhealthy' : 'queued',
    job: reportUpgradeJobOperations.getByReportId(params.report.id),
  };
}

export async function processNextReportUpgradeJob() {
  const job = reportUpgradeJobOperations.claimNextRunnable();
  if (!job) {
    return {
      processed: false,
      reason: 'empty',
    };
  }

  const report = fortuneOperations.getById(job.reportId);
  if (!report) {
    reportUpgradeJobOperations.markFailed(job.id, {
      lastError: 'REPORT_NOT_FOUND',
      lastScore: job.lastScore,
      bestScore: job.bestScore,
      bestGrade: job.bestGrade,
      meta: {
        ...(job.meta || {}),
        failure: 'report_missing',
      },
    });
    return {
      processed: true,
      status: 'failed',
      reportId: job.reportId,
      reason: 'report_missing',
    };
  }

  const previousAudit = report.analysis?.qualityAudit;
  const previousScore = previousAudit?.overallScore || 0;
  const previousBestScore = Math.max(previousScore, job.bestScore || 0);
  const providerHealth = assessReportProviderHealth();

  if (providerHealth.shouldDefer) {
    reportUpgradeJobOperations.markDeferred(job.id, {
      nextRunAt: new Date(Date.now() + PROVIDER_DEFER_MS).toISOString(),
      lastError: 'PROVIDER_UNHEALTHY',
      meta: {
        ...(job.meta || {}),
        deferredForProvider: true,
        providerHealth: providerHealth.summary,
      },
    });

    return {
      processed: true,
      status: 'retry',
      reportId: report.id,
      reason: 'provider_unhealthy',
    };
  }

  try {
    const { result, llmUsed, llmUnavailable, deferredByProviderHealth } = await regenerateReportFromRecord(report);
    result.analysis = withReportVersionLineage({
      previousAnalysis: report.analysis,
      previousReportVersion: report.reportVersion || 'v1',
      nextAnalysis: result.analysis,
      nextReportVersion: CURRENT_REPORT_VERSION,
    });
    const newAudit = result.analysis?.qualityAudit;
    const newScore = newAudit?.overallScore || 0;
    const bestScore = Math.max(previousBestScore, newScore);
    const bestGrade = gradeByHigherScore({
      previousScore: previousBestScore,
      previousGrade: job.bestGrade || previousAudit?.grade,
      nextScore: newScore,
      nextGrade: newAudit?.grade,
    });
    const improved = newScore >= previousScore;

    if (improved) {
      fortuneOperations.update(report.id, {
        name: report.name,
        bazi: result.basic,
        fiveElements: result.fiveElements,
        tenGods: result.tenGods || {},
        pattern: result.pattern,
        fortune: result.fortune,
        advice: result.advice,
        evidence: result.evidence,
        analysis: result.analysis,
        klineData: result.klineData,
        dayun: result.dayun,
        shenSha: result.shenSha,
        reportVersion: CURRENT_REPORT_VERSION,
      });
    }

    if (llmUnavailable && !newAudit?.targetAchieved) {
      reportUpgradeJobOperations.markDeferred(job.id, {
        lastScore: newScore,
        bestScore,
        bestGrade,
        nextRunAt: new Date(Date.now() + PROVIDER_DEFER_MS).toISOString(),
        lastError: deferredByProviderHealth ? 'PROVIDER_UNHEALTHY' : 'LLM_UNAVAILABLE',
        meta: {
          ...(job.meta || {}),
          lastDeliveryTier: newAudit?.deliveryTier || previousAudit?.deliveryTier || 'basic',
          llmUsed,
          llmUnavailable,
          improved,
          deferredByProviderHealth,
        },
      });

      return {
        processed: true,
        status: 'retry',
        reportId: report.id,
        reason: deferredByProviderHealth ? 'provider_unhealthy' : 'llm_unavailable',
      };
    }

    if (newAudit?.targetAchieved) {
      reportUpgradeJobOperations.markCompleted(job.id, {
        lastScore: newScore,
        bestScore,
        bestGrade,
        meta: {
          ...(job.meta || {}),
          lastDeliveryTier: newAudit.deliveryTier,
          llmUsed,
          improved,
        },
      });

      trackServerEvent({
        userId: report.userId,
        sessionId: report.userId,
        eventName: 'report_generated',
        page: `/result/${report.id}`,
        meta: {
          reportId: report.id,
          llmUsed,
          reportVersion: CURRENT_REPORT_VERSION,
          reasoningMode: result.analysis?.reasoningMode || 'engine',
          qualityScore: newScore,
          qualityGrade: newAudit.grade || 'C',
          deliveryTier: newAudit.deliveryTier || 'expert',
          expertTargetAchieved: true,
          source: 'upgrade-job',
        },
      });

      await notifyUpgradeCompleted({
        userId: report.userId,
        reportId: report.id,
        reportName: report.name,
        score: newScore,
        grade: newAudit.grade,
        deliveryTier: newAudit.deliveryTier || 'expert',
      });

      return {
        processed: true,
        status: 'completed',
        reportId: report.id,
        score: newScore,
      };
    }

    if ((job.attempts || 0) >= (job.maxAttempts || DEFAULT_MAX_ATTEMPTS)) {
      reportUpgradeJobOperations.markFailed(job.id, {
        lastScore: newScore,
        bestScore,
        bestGrade,
        lastError: 'TARGET_NOT_REACHED',
        meta: {
          ...(job.meta || {}),
          lastDeliveryTier: newAudit?.deliveryTier || previousAudit?.deliveryTier || 'basic',
          llmUsed,
          improved,
        },
      });

      return {
        processed: true,
        status: 'failed',
        reportId: report.id,
        score: newScore,
      };
    }

    reportUpgradeJobOperations.markRetry(job.id, {
      lastScore: newScore,
      bestScore,
      bestGrade,
      nextRunAt: new Date(Date.now() + computeRetryDelayMs({
        attempts: job.attempts || 1,
        previousScore,
        nextScore: newScore,
      })).toISOString(),
      lastError: newAudit?.blockingIssues?.join(' | ') || 'TARGET_NOT_REACHED',
      meta: {
        ...(job.meta || {}),
        lastDeliveryTier: newAudit?.deliveryTier || previousAudit?.deliveryTier || 'basic',
        llmUsed,
        improved,
      },
    });

    return {
      processed: true,
      status: 'retry',
      reportId: report.id,
      score: newScore,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((job.attempts || 0) >= (job.maxAttempts || DEFAULT_MAX_ATTEMPTS)) {
      reportUpgradeJobOperations.markFailed(job.id, {
        lastScore: previousScore,
        bestScore: previousBestScore,
        bestGrade: job.bestGrade || previousAudit?.grade,
        lastError: message,
        meta: {
          ...(job.meta || {}),
          failure: 'exception',
        },
      });
      return {
        processed: true,
        status: 'failed',
        reportId: report.id,
        reason: message,
      };
    }

    reportUpgradeJobOperations.markRetry(job.id, {
      lastScore: previousScore,
      bestScore: previousBestScore,
      bestGrade: job.bestGrade || previousAudit?.grade,
      nextRunAt: new Date(Date.now() + computeRetryDelayMs({
        attempts: job.attempts || 1,
        previousScore,
        nextScore: previousScore,
      })).toISOString(),
      lastError: message,
      meta: {
        ...(job.meta || {}),
        failure: 'exception',
      },
    });
    return {
      processed: true,
      status: 'retry',
      reportId: report.id,
      reason: message,
    };
  }
}

async function notifyUpgradeCompleted(params: {
  userId: string;
  reportId: string;
  reportName: string;
  score: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier: 'basic' | 'enhanced' | 'expert';
}) {
  if (!isEmailDeliveryConfigured()) {
    return;
  }

  const user = userOperations.getById(params.userId) as { email?: string | null; name?: string | null } | undefined;
  const email = `${user?.email || ''}`.trim().toLowerCase();
  if (!email) {
    return;
  }

  const subscription = emailSubscriptionOperations.getByEmail(email);
  if (!subscription || subscription.status !== 'active') {
    return;
  }

  const tags = Array.isArray(subscription.tags) ? subscription.tags : [];
  const canNotify = tags.length === 0 || tags.some((tag) => [
    'report_upgrade',
    'monthly_report',
    'updates',
    'welcome',
  ].includes(tag));

  if (!canNotify) {
    return;
  }

  try {
    const deliveryResult = await sendReportUpgradeReadyEmail({
      email,
      name: params.reportName || user?.name || '用户',
      reportId: params.reportId,
      score: params.score,
      grade: params.grade,
      deliveryTier: params.deliveryTier,
    });

    if (deliveryResult?.success) {
      trackServerEvent({
        userId: params.userId,
        sessionId: params.userId,
        eventName: 'email_delivery_succeeded',
        page: `/result/${params.reportId}`,
        meta: {
          channel: 'report_upgrade_ready',
          reportId: params.reportId,
          emailDomain: email.split('@')[1] || '',
          deliveryTier: params.deliveryTier,
        },
      });
      return;
    }

    trackServerEvent({
      userId: params.userId,
      sessionId: params.userId,
      eventName: 'email_delivery_failed',
      page: `/result/${params.reportId}`,
      meta: {
        channel: 'report_upgrade_ready',
        reportId: params.reportId,
        emailDomain: email.split('@')[1] || '',
        deliveryTier: params.deliveryTier,
        reason: deliveryResult?.message || 'unknown',
      },
    });
  } catch (error) {
    console.error('[Report Upgrade] failed to send upgrade completion email:', error);
    trackServerEvent({
      userId: params.userId,
      sessionId: params.userId,
      eventName: 'email_delivery_failed',
      page: `/result/${params.reportId}`,
      meta: {
        channel: 'report_upgrade_ready',
        reportId: params.reportId,
        emailDomain: email.split('@')[1] || '',
        deliveryTier: params.deliveryTier,
        reason: error instanceof Error ? error.message : 'unknown',
      },
    });
  }
}

export async function processReportUpgradeBatch(limit: number = DEFAULT_BATCH_SIZE) {
  const providerHealth = assessReportProviderHealth();
  if (providerHealth.shouldDefer) {
    const deferredJobs = reportUpgradeJobOperations.listRunnablePending(limit);
    for (const job of deferredJobs) {
      reportUpgradeJobOperations.markDeferred(job.id, {
        lastScore: job.lastScore,
        bestScore: job.bestScore,
        bestGrade: job.bestGrade,
        nextRunAt: new Date(Date.now() + PROVIDER_DEFER_MS).toISOString(),
        lastError: 'PROVIDER_UNHEALTHY',
        meta: {
          ...(job.meta || {}),
          deferredForProvider: true,
          providerHealth: providerHealth.summary,
        },
      });
    }

    return {
      processed: deferredJobs.length > 0,
      processedCount: deferredJobs.length,
      reason: 'provider_unhealthy',
      jobs: deferredJobs.map((job) => ({
        processed: true,
        status: 'retry',
        reportId: job.reportId,
        reason: 'provider_unhealthy',
      })),
    };
  }

  const jobs: Array<{
    processed: boolean;
    status?: string;
    reportId?: string;
    score?: number;
    reason?: string;
  }> = [];

  for (let index = 0; index < limit; index += 1) {
    const result = await processNextReportUpgradeJob();
    if (!result.processed) {
      if (index === 0) {
        return {
          processed: false,
          processedCount: 0,
          reason: result.reason || 'empty',
          jobs,
        };
      }
      break;
    }
    jobs.push(result);
    if (result.reason === 'provider_unhealthy') {
      break;
    }
  }

  return {
    processed: jobs.length > 0,
    processedCount: jobs.length,
    jobs,
  };
}

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function computeInitialDelayMs(score: number) {
  if (score <= 78) return Math.max(20_000, Math.floor(INITIAL_DELAY_MS * 0.5));
  if (score <= 88) return INITIAL_DELAY_MS;
  return Math.max(INITIAL_DELAY_MS, Math.floor(INITIAL_DELAY_MS * 2));
}

function computeRetryDelayMs(params: {
  attempts: number;
  previousScore: number;
  nextScore: number;
}) {
  const attemptFactor = Math.max(1, params.attempts);
  const improved = params.nextScore > params.previousScore;
  const base = improved
    ? Math.floor(RETRY_BASE_DELAY_MS * 0.7)
    : RETRY_BASE_DELAY_MS;

  if (params.nextScore <= 78) {
    return Math.max(60_000, Math.floor(base * attemptFactor * 0.75));
  }

  if (params.nextScore >= 90) {
    return Math.max(90_000, Math.floor(base * attemptFactor * 1.4));
  }

  return Math.max(60_000, Math.floor(base * attemptFactor));
}

function assessReportProviderHealth() {
  const baseChain = getModelFallbackChain(process.env.DEFAULT_MODEL || 'auto');
  const reportAssessment = assessScopeProviderHealth(baseChain, 'report');
  const agentAssessment = assessScopeProviderHealth(baseChain, 'agent');
  const reportSnapshots = reportAssessment.snapshots || [];
  const agentSnapshots = agentAssessment.snapshots || [];
  const shouldDefer = reportAssessment.shouldDefer
    && !hasRunnableModelsForSnapshots(reportSnapshots);

  return {
    shouldDefer,
    summary: {
      report: summarizeHealthSnapshots(reportSnapshots),
      agent: summarizeHealthSnapshots(agentSnapshots),
    },
  };
}

function summarizeHealthSnapshots(snapshots: ModelHealthSnapshot[]) {
  return snapshots.map((item) => ({
    model: item.model,
    state: item.state,
    successRate: item.successRate,
    failureRate: item.failureRate,
    attempts: item.attempts,
    avgLatencyMs: item.avgLatencyMs,
  }));
}

function gradeByHigherScore(params: {
  previousScore: number;
  previousGrade?: 'S' | 'A' | 'B' | 'C';
  nextScore: number;
  nextGrade?: 'S' | 'A' | 'B' | 'C';
}) {
  return params.nextScore >= params.previousScore
    ? params.nextGrade
    : params.previousGrade;
}
