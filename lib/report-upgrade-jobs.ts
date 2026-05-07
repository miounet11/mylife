import { trackServerEvent } from '@/lib/analytics';
import { emailSubscriptionOperations, fortuneOperations, reportUpgradeJobOperations, userOperations } from '@/lib/database';
import {
  getReportUpgradeBatchSize,
  getReportUpgradeInitialDelayMs,
  getReportUpgradeMaxAttempts,
  getReportUpgradeProviderDeferMs,
  getReportUpgradeRetryDelayMs,
} from '@/lib/env';
import { isEmailDeliveryConfigured, sendReportUpgradeReadyEmail } from '@/lib/email';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  assessScopeProviderHealth,
  hasRunnableModelsForSnapshots,
  type ModelHealthSnapshot,
  shouldConservativelyDeferForSnapshots,
} from '@/lib/llm-provider-health';
import { REPORT_EXPERT_TARGET_SCORE } from '@/lib/report-quality';
import { CURRENT_REPORT_VERSION, regenerateReportFromRecord, repairStoredReportNarrative } from '@/lib/report-pipeline';
import { isLikelyTestReportName } from '@/lib/report-sample-classifier';
import { withReportVersionLineage } from '@/lib/report-version-lineage';
import type { FortuneAdvice, FortuneAnalysisResult, FortuneRecord, ReportUpgradeJobRecord } from '@/lib/user-types';

const DEFAULT_MAX_ATTEMPTS = getReportUpgradeMaxAttempts();
const INITIAL_DELAY_MS = getReportUpgradeInitialDelayMs();
const RETRY_BASE_DELAY_MS = getReportUpgradeRetryDelayMs();
const DEFAULT_BATCH_SIZE = getReportUpgradeBatchSize();
const PROVIDER_DEFER_MS = getReportUpgradeProviderDeferMs();
const PROVIDER_DEFER_MAX_MS = Math.max(PROVIDER_DEFER_MS, 1000 * 60 * 60 * 2);

export function enqueueReportUpgrade(params: {
  report: FortuneRecord;
  reason?: string;
  force?: boolean;
  nextRunAt?: string;
  meta?: Record<string, unknown>;
}) {
  const qualityAudit = params.report.analysis?.qualityAudit;
  if (!params.force && isLikelyTestReportName(params.report.name)) {
    return {
      queued: false,
      reason: 'likely_test_sample',
      job: reportUpgradeJobOperations.getByReportId(params.report.id),
    };
  }

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
    lastError: deferredForProvider ? 'PROVIDER_UNHEALTHY' : undefined,
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

  if (isLikelyTestReportName(report.name)) {
    reportUpgradeJobOperations.markCancelled(job.id, {
      lastScore: previousScore,
      bestScore: previousBestScore,
      bestGrade: job.bestGrade || previousAudit?.grade,
      lastError: 'LIKELY_TEST_SAMPLE',
      meta: {
        ...(job.meta || {}),
        skippedAsLikelyTest: true,
      },
    });

    return {
      processed: true,
      status: 'cancelled',
      reportId: report.id,
      reason: 'likely_test_sample',
    };
  }

  const providerHealth = assessReportProviderHealth();

  if (providerHealth.shouldDefer) {
    const repaired = repairStoredReportNarrative(report);
    const repairedAudit = repaired.analysis?.qualityAudit;
    const repairedApplied = shouldApplyProviderRepair({
      current: report,
      repaired,
    });

    if (repairedApplied) {
      fortuneOperations.update(report.id, {
        name: report.name,
        bazi: repaired.basic,
        fiveElements: repaired.fiveElements,
        tenGods: repaired.tenGods || {},
        pattern: repaired.pattern,
        fortune: repaired.fortune,
        advice: toStoredFortuneAdvice(repaired.advice),
        evidence: repaired.evidence,
        analysis: repaired.analysis,
        klineData: repaired.klineData,
        dayun: repaired.dayun,
        shenSha: repaired.shenSha,
        reportVersion: report.reportVersion || CURRENT_REPORT_VERSION,
      });
    }

    const providerDefer = buildProviderDefer(job.meta);
    reportUpgradeJobOperations.markDeferred(job.id, {
      lastScore: repairedApplied ? repairedAudit?.overallScore || previousScore : previousScore,
      bestScore: repairedApplied
        ? Math.max(previousBestScore, repairedAudit?.overallScore || 0)
        : previousBestScore,
      bestGrade: repairedApplied
        ? gradeByHigherScore({
            previousScore: previousBestScore,
            previousGrade: job.bestGrade || previousAudit?.grade,
            nextScore: repairedAudit?.overallScore || 0,
            nextGrade: repairedAudit?.grade,
          })
        : (job.bestGrade || previousAudit?.grade),
      nextRunAt: new Date(Date.now() + providerDefer.delayMs).toISOString(),
      lastError: 'PROVIDER_UNHEALTHY',
      meta: {
        ...(job.meta || {}),
        deferredForProvider: true,
        providerDeferralCount: providerDefer.count,
        providerDeferMs: providerDefer.delayMs,
        repairOnlyApplied: repairedApplied,
        repairOnlyQualityScore: repairedAudit?.overallScore,
        providerHealth: providerHealth.summary,
      },
    });

    return {
      processed: true,
      status: 'retry',
      reportId: report.id,
      reason: repairedApplied ? 'provider_unhealthy_repaired' : 'provider_unhealthy',
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
        advice: toStoredFortuneAdvice(result.advice),
        evidence: result.evidence,
        analysis: result.analysis,
        klineData: result.klineData,
        dayun: result.dayun,
        shenSha: result.shenSha,
        reportVersion: CURRENT_REPORT_VERSION,
      });
    }

    if (llmUnavailable && !newAudit?.targetAchieved) {
      const providerDefer = buildProviderDefer(job.meta);
      reportUpgradeJobOperations.markDeferred(job.id, {
        lastScore: newScore,
        bestScore,
        bestGrade,
        nextRunAt: new Date(Date.now() + providerDefer.delayMs).toISOString(),
        lastError: deferredByProviderHealth ? 'PROVIDER_UNHEALTHY' : 'LLM_UNAVAILABLE',
        meta: {
          ...(job.meta || {}),
          lastDeliveryTier: newAudit?.deliveryTier || previousAudit?.deliveryTier || 'basic',
          llmUsed,
          llmUnavailable,
          improved,
          deferredByProviderHealth,
          providerDeferralCount: providerDefer.count,
          providerDeferMs: providerDefer.delayMs,
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
  const canNotify = tags.length === 0 || tags.some((tag: unknown) => [
    'report_upgrade',
    'monthly_report',
    'updates',
    'welcome',
  ].includes(`${tag}`));

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
  const { enqueueRealUserReportUpgradeCandidates } = await import('@/lib/real-user-report-upgrades');
  const realUserQueue = enqueueRealUserReportUpgradeCandidates({
    windowDays: 7,
    limit,
  });
  const providerHealth = assessReportProviderHealth();
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
          reason: providerHealth.shouldDefer ? 'provider_unhealthy' : (result.reason || 'empty'),
          realUserQueue,
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
    realUserQueue,
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

function buildProviderDefer(meta?: Record<string, unknown>) {
  const previousCount = Number(meta?.providerDeferralCount || 0);
  const count = Number.isFinite(previousCount) ? previousCount + 1 : 1;
  const delayMs = Math.min(
    PROVIDER_DEFER_MAX_MS,
    Math.max(PROVIDER_DEFER_MS, PROVIDER_DEFER_MS * Math.min(count, 6))
  );

  return {
    count,
    delayMs,
  };
}

function assessReportProviderHealth() {
  const baseChain = getModelFallbackChain(undefined, 'report');
  const reportAssessment = assessScopeProviderHealth(baseChain, 'report');
  const agentAssessment = assessScopeProviderHealth(
    getModelFallbackChain(undefined, 'agent'),
    'agent'
  );
  const reportSnapshots = reportAssessment.snapshots || [];
  const agentSnapshots = agentAssessment.snapshots || [];
  const conservativeReportDefer = shouldConservativelyDeferForSnapshots(reportSnapshots);
  const shouldDefer = reportAssessment.shouldDefer
    || conservativeReportDefer
    || !hasRunnableModelsForSnapshots(reportSnapshots);

  return {
    shouldDefer,
    summary: {
      report: summarizeHealthSnapshots(reportSnapshots),
      agent: summarizeHealthSnapshots(agentSnapshots),
      backgroundStrictDefer: conservativeReportDefer,
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

function toStoredFortuneAdvice(advice?: Partial<FortuneAdvice> | FortuneAnalysisResult['advice']): FortuneAdvice {
  const safeAdvice = advice || {};

  return {
    career: safeAdvice.career || {} as FortuneAdvice['career'],
    wealth: safeAdvice.wealth || {} as FortuneAdvice['wealth'],
    marriage: safeAdvice.marriage || {} as FortuneAdvice['marriage'],
    health: safeAdvice.health || {} as FortuneAdvice['health'],
    colors: Array.isArray(safeAdvice.colors) ? safeAdvice.colors : [],
    directions: Array.isArray(safeAdvice.directions) ? safeAdvice.directions : [],
    timing: Array.isArray(safeAdvice.timing) ? safeAdvice.timing : [],
    numbers: Array.isArray((safeAdvice as Partial<FortuneAdvice>).numbers) ? (safeAdvice as Partial<FortuneAdvice>).numbers! : [],
    yongShen: Array.isArray((safeAdvice as Partial<FortuneAdvice>).yongShen) ? (safeAdvice as Partial<FortuneAdvice>).yongShen! : [],
    jiShen: Array.isArray((safeAdvice as Partial<FortuneAdvice>).jiShen) ? (safeAdvice as Partial<FortuneAdvice>).jiShen! : [],
    xiShen: Array.isArray((safeAdvice as Partial<FortuneAdvice>).xiShen) ? (safeAdvice as Partial<FortuneAdvice>).xiShen! : [],
  };
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

function shouldApplyProviderRepair(params: {
  current: FortuneRecord;
  repaired: FortuneRecord | FortuneAnalysisResult;
}) {
  const currentAnalysis = (params.current.analysis || {}) as Partial<FortuneAnalysisResult['analysis']>;
  const repairedAnalysis = (params.repaired.analysis || {}) as Partial<FortuneAnalysisResult['analysis']>;
  const currentSummary = `${currentAnalysis.summary || ''}`.trim();
  const repairedSummary = `${repairedAnalysis.summary || ''}`.trim();
  const currentExplanation = `${currentAnalysis.explanation || ''}`.trim();
  const repairedExplanation = `${repairedAnalysis.explanation || ''}`.trim();
  const currentOpening = `${currentAnalysis.opening || ''}`.trim();
  const repairedOpening = `${repairedAnalysis.opening || ''}`.trim();
  const currentScore = currentAnalysis.qualityAudit?.overallScore || 0;
  const repairedScore = repairedAnalysis.qualityAudit?.overallScore || 0;
  const currentHasTemplateResidue = hasTemplateResidue([currentOpening, currentSummary, currentExplanation]);
  const repairedHasTemplateResidue = hasTemplateResidue([repairedOpening, repairedSummary, repairedExplanation]);

  return (
    (currentSummary.length < 8 && repairedSummary.length >= 8)
    || (!hasStructuredNarrative(currentExplanation) && hasStructuredNarrative(repairedExplanation))
    || (currentHasTemplateResidue && !repairedHasTemplateResidue)
    || (currentOpening !== repairedOpening && repairedOpening.length > 0)
    || repairedScore > currentScore
  );
}

function hasStructuredNarrative(value: string) {
  return ['主判断：', '判断依据：', '现在先做：', '风险提醒：']
    .every((label) => value.includes(label));
}

function hasTemplateResidue(parts: string[]) {
  return /(命局主轴围绕|生时环境落在|四柱落点为|外部参照|解释增强即可|当前最优策略不是同时做很多事|显著放大或压制|格局清正|乃富贵之命也|macro_cycle|solar_terms|geography|settlement|relationship|family_role)/i
    .test(parts.join('\n'));
}
