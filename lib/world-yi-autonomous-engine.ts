import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import {
  getApiBaseUrl,
  getAutonomousGrowthIntervalMinutes,
  getDefaultModel,
  getKnowledgeAcquisitionLockTtlMs,
  getOpenAgentRuntimeModel,
  isAutonomousGrowthEmailRetryEnabled,
  isAutonomousGrowthUserLifecycleEmailEnabled,
  isAutonomousGrowthMonthlyDigestEnabled,
  isOpenAgentRuntimeEnabled,
} from '@/lib/env';
import { buildSiteQualityGovernorSnapshot } from '@/lib/site-quality-governor';
import { runContentSchedulerCycle, getContentOpsSnapshot } from '@/lib/content-ops';
import { runEmailDeliveryRetryCycle } from '@/lib/email-delivery-jobs';
import { runUserLifecycleEmailCycle } from '@/lib/user-lifecycle-email';
import { runKnowledgeAcquisitionCycle } from '@/lib/knowledge-acquisition';
import {
  isOpenAgentReady,
  runWorldYiOpenAgentAutonomyReview,
  runWorldYiOpenAgentContentAnalysis,
  runWorldYiOpenAgentOpsTriage,
  runWorldYiOpenAgentReportReliabilityReview,
  runWorldYiOpenAgentSiteGovernorReview,
} from '@/lib/open-agent-runtime';
import {
  acquireKnowledgeAcquisitionLockWithRecovery,
  createKnowledgeRunId,
  readKnowledgeAcquisitionLockStatus,
  readKnowledgeAcquisitionSnapshot,
  releaseKnowledgeAcquisitionLock,
  writeKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';
import { runReportMonthlyDigestCycle } from '@/lib/report-monthly-digest';
import { processReportUpgradeBatch } from '@/lib/report-upgrade-jobs';
import {
  createWorldYiAutonomousCycleRunId,
  readOpenAgentAutonomyBacklog,
  readOpenAgentContentAnalysisSnapshot,
  readOpenAgentOpsTriageSnapshot,
  readOpenAgentReportReliabilitySnapshot,
  readOpenAgentAutonomyReviewSnapshot,
  readWorldYiContentDecisionLedger,
  resolveWorldYiAutonomyRuntimePolicy,
  readWorldYiAutonomousCycleLedger,
  summarizeWorldYiContentDecisionLedger,
  summarizeOpenAgentAutonomyBacklogFocus,
  writeWorldYiAutonomousCycleLedgerEntry,
} from '@/lib/world-yi-autonomous-state';
import { buildWorldYiPublicationMechanismSnapshot } from '@/lib/world-yi-publication-mechanism';

type AutonomousTrigger = 'cron' | 'manual';
type AutonomousMode = 'full' | 'validation';

type AutonomousPhaseResult = {
  key: string;
  title: string;
  enabled: boolean;
  success: boolean;
  skipped?: boolean;
  reason?: string;
  durationMs?: number;
  details?: Record<string, unknown>;
};

type QualitySummary = {
  prioritizedContentFixCount: number;
  prioritizedToolFixCount: number;
  prioritizedToolJourneyGapCount: number;
  prioritizedBouncePageCount: number;
  topContentActions: string[];
  topToolActions: string[];
};

function buildQualitySummary(): QualitySummary {
  const workboard = getAdminQualityWorkboard();

  return {
    prioritizedContentFixCount: workboard.prioritizedContentFixes.length,
    prioritizedToolFixCount: workboard.prioritizedToolFixes.length,
    prioritizedToolJourneyGapCount: workboard.prioritizedToolJourneyGaps.length,
    prioritizedBouncePageCount: workboard.prioritizedBouncePages.length,
    topContentActions: workboard.prioritizedContentFixes.slice(0, 3).map((item) => item.action),
    topToolActions: workboard.prioritizedToolFixes.slice(0, 3).map((item) => item.action),
  };
}

function getKnowledgeRuntimeSummary() {
  const ttlMs = getKnowledgeAcquisitionLockTtlMs();
  return {
    snapshot: readKnowledgeAcquisitionSnapshot(),
    lock: readKnowledgeAcquisitionLockStatus(ttlMs),
    lockTtlMs: ttlMs,
  };
}

function buildCycleDecisionLog(phases: AutonomousPhaseResult[]) {
  return phases.map((phase) => {
    if (!phase.enabled) {
      return {
        key: phase.key,
        decision: 'disabled',
        reason: phase.reason || 'disabled_by_env',
      };
    }

    if (phase.skipped) {
      return {
        key: phase.key,
        decision: 'skipped',
        reason: phase.reason || 'skipped',
      };
    }

    if (!phase.success) {
      return {
        key: phase.key,
        decision: 'failed',
        reason: phase.reason || 'failed',
      };
    }

    return {
      key: phase.key,
      decision: 'completed',
      reason: phase.reason || 'completed',
    };
  });
}

function buildSkippedPhase(key: string, title: string, reason: string): AutonomousPhaseResult {
  return {
    key,
    title,
    enabled: false,
    success: true,
    skipped: true,
    reason,
  };
}

function logAutonomousCycleEvent(
  runId: string,
  event: string,
  details?: Record<string, unknown>
) {
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[autonomous-cycle] runId=${runId} event=${event}${payload}`);
}

async function runAutonomousPhase(
  runId: string,
  phase: {
    key: string;
    title: string;
    enabled?: boolean;
  },
  execute: () => Promise<Omit<AutonomousPhaseResult, 'key' | 'title' | 'enabled' | 'durationMs'>>
): Promise<AutonomousPhaseResult> {
  const startedAt = Date.now();
  logAutonomousCycleEvent(runId, 'phase_start', {
    key: phase.key,
    title: phase.title,
  });

  try {
    const result = await execute();
    const durationMs = Date.now() - startedAt;
    const normalized: AutonomousPhaseResult = {
      key: phase.key,
      title: phase.title,
      enabled: phase.enabled ?? true,
      durationMs,
      ...result,
    };
    logAutonomousCycleEvent(runId, 'phase_finish', {
      key: normalized.key,
      success: normalized.success,
      skipped: !!normalized.skipped,
      reason: normalized.reason || null,
      durationMs,
    });
    return normalized;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const reason = error instanceof Error ? error.message : `${error}`;
    logAutonomousCycleEvent(runId, 'phase_error', {
      key: phase.key,
      reason,
      durationMs,
    });
    return {
      key: phase.key,
      title: phase.title,
      enabled: phase.enabled ?? true,
      success: false,
      reason,
      durationMs,
    };
  }
}

export function buildWorldYiAutonomousSnapshot() {
  const backlog = readOpenAgentAutonomyBacklog(8);
  const backlogFocus = summarizeOpenAgentAutonomyBacklogFocus(backlog);
  const latestContentAnalysis = readOpenAgentContentAnalysisSnapshot();
  const policyResolution = resolveWorldYiAutonomyRuntimePolicy({
    fallbackFocus: backlogFocus,
    analysisPlan: latestContentAnalysis?.status === 'success' ? latestContentAnalysis.plan : null,
  });
  const contentDecisionLedger = summarizeWorldYiContentDecisionLedger();
  const siteQualityGovernor = buildSiteQualityGovernorSnapshot();

  return {
    checkedAt: new Date().toISOString(),
    deploymentMode: 'single-cron-entry' as const,
    controlRoute: '/api/admin/system/autonomous/cron',
    recommendedIntervalMinutes: getAutonomousGrowthIntervalMinutes(),
    openAgent: {
      sdk: 'open-agent-sdk-typescript',
      referenceUrl: 'https://github.com/codeany-ai/open-agent-sdk-typescript',
      enabledByEnv: isOpenAgentRuntimeEnabled(),
      runtimeReady: isOpenAgentReady(),
      llmBaseUrl: getApiBaseUrl(),
      llmModel: getOpenAgentRuntimeModel() || getDefaultModel(),
      responsibility: [
        '话题监控与队列扩展',
        '内容生成与补稿编排',
        '测算可靠性复审与升级建议',
        '质量复审与失败重试',
        '发布后监控与优先级重排',
      ],
      latestReview: readOpenAgentAutonomyReviewSnapshot(),
      latestContentAnalysis,
      latestOpsTriage: readOpenAgentOpsTriageSnapshot(),
      latestReportReliability: readOpenAgentReportReliabilitySnapshot(),
      backlog,
      backlogFocus,
      policy: policyResolution.effectivePolicy,
      basePolicy: policyResolution.basePolicy,
      policySignalApplications: policyResolution.appliedSignals,
      ignoredPolicySignals: policyResolution.ignoredSignals,
    },
    runtime: {
      knowledgeAcquisition: getKnowledgeRuntimeSummary(),
      monthlyDigestEnabled: isAutonomousGrowthMonthlyDigestEnabled(),
      emailRetryEnabled: isAutonomousGrowthEmailRetryEnabled(),
      recentCycles: readWorldYiAutonomousCycleLedger(8),
      contentDecisionLedger,
    },
    publication: buildWorldYiPublicationMechanismSnapshot(),
    contentOps: getContentOpsSnapshot(),
    quality: buildQualitySummary(),
    siteQualityGovernor,
  };
}

async function runKnowledgeAcquisitionCycleWithLock(): Promise<AutonomousPhaseResult> {
  const startedAt = Date.now();
  const runtime = getKnowledgeRuntimeSummary();
  const runId = createKnowledgeRunId();
  const lock = acquireKnowledgeAcquisitionLockWithRecovery({
    runId,
    pid: process.pid,
    startedAt: new Date().toISOString(),
  }, runtime.lockTtlMs);

  if (!lock.acquired) {
    return {
      key: 'knowledge_acquisition',
      title: '知识采集与知识库扩展',
      enabled: true,
      success: true,
      skipped: true,
      reason: 'knowledge_cycle_already_running',
      durationMs: Date.now() - startedAt,
      details: {
        runtime,
        snapshot: readKnowledgeAcquisitionSnapshot(),
      },
    };
  }

  writeKnowledgeAcquisitionSnapshot({
    status: 'running',
    runId,
    pid: process.pid,
    startedAt: new Date().toISOString(),
  });

  try {
    const result = await runKnowledgeAcquisitionCycle();
    writeKnowledgeAcquisitionSnapshot({
      status: 'success',
      runId,
      pid: process.pid,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cycle: result as unknown as Record<string, unknown>,
    });
    releaseKnowledgeAcquisitionLock(runId);

    return {
      key: 'knowledge_acquisition',
      title: '知识采集与知识库扩展',
      enabled: true,
      success: true,
      durationMs: Date.now() - startedAt,
      details: result as unknown as Record<string, unknown>,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'knowledge_cycle_failed';
    writeKnowledgeAcquisitionSnapshot({
      status: 'error',
      runId,
      pid: process.pid,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      error: message,
    });
    releaseKnowledgeAcquisitionLock(runId);

    return {
      key: 'knowledge_acquisition',
      title: '知识采集与知识库扩展',
      enabled: true,
      success: false,
      reason: message,
      durationMs: Date.now() - startedAt,
    };
  }
}

export async function runWorldYiAutonomousCycle(params?: {
  trigger?: AutonomousTrigger;
  mode?: AutonomousMode;
}) {
  const trigger = params?.trigger || 'cron';
  const mode = params?.mode || 'full';
  const startedAt = Date.now();
  const cycleRunId = createWorldYiAutonomousCycleRunId();
  const phases: AutonomousPhaseResult[] = [];

  logAutonomousCycleEvent(cycleRunId, 'cycle_start', { trigger, mode });

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('knowledge_acquisition', '知识采集与知识库扩展', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'knowledge_acquisition',
      title: '知识采集与知识库扩展',
    }, async () => {
      const result = await runKnowledgeAcquisitionCycleWithLock();
      return {
        success: result.success,
        skipped: result.skipped,
        reason: result.reason,
        details: result.details,
      };
    }));
  }

  if (isOpenAgentRuntimeEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'open_agent_content_analysis',
      title: 'OpenAgent 内容分析与补稿规划',
    }, async () => {
      const result = await runWorldYiOpenAgentContentAnalysis();
      return {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'open_agent_content_analysis',
      title: 'OpenAgent 内容分析与补稿规划',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  phases.push(await runAutonomousPhase(cycleRunId, {
    key: 'content_scheduler',
    title: '内容生成与自动发布',
  }, async () => {
    const result = await runContentSchedulerCycle({
      trigger,
      mode: mode === 'validation' ? 'validate' : 'live',
      cycleRunId,
    });
    return {
      success: true,
      reason: result.reason,
      details: {
        generatedCount: result.generatedCount,
        publishedCount: result.publishedCount,
        publishedTitle: result.publishedEntry?.title || null,
        radarRefreshed: result.radarRefreshed,
        weakLaneKeys: result.opsSnapshot?.publicationReserve?.weakLaneKeys || [],
        autonomyFocusKeys: result.opsSnapshot?.autonomyFocus?.focusKeys || [],
        nextGenerationKeys: (result.opsSnapshot?.generationQueue || []).slice(0, 3).map((item) => item.key),
        decisionLedgerSummary: result.decisionLedgerSummary || null,
        executionMode: mode,
        preview: result.preview || null,
      },
    };
  }));

  if (isOpenAgentRuntimeEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'open_agent_report_reliability',
      title: 'OpenAgent 测算可靠性复审',
    }, async () => {
      const result = await runWorldYiOpenAgentReportReliabilityReview({
        autoExecute: mode !== 'validation',
      });
      return {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'open_agent_report_reliability',
      title: 'OpenAgent 测算可靠性复审',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('report_upgrade', '测算结果升级补强', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'report_upgrade',
      title: '测算结果升级补强',
    }, async () => {
      const result = await processReportUpgradeBatch();
      return {
        success: true,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  }

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('user_lifecycle_email', '注册与留存召回邮件', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else if (isAutonomousGrowthUserLifecycleEmailEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'user_lifecycle_email',
      title: '注册与留存召回邮件',
    }, async () => {
      const result = await runUserLifecycleEmailCycle({ trigger });
      return {
        success: !!result.success,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'user_lifecycle_email',
      title: '注册与留存召回邮件',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('monthly_digest', '月度报告触达', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else if (isAutonomousGrowthMonthlyDigestEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'monthly_digest',
      title: '月度报告触达',
    }, async () => {
      const result = await runReportMonthlyDigestCycle({ trigger });
      return {
        success: !!result.success,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'monthly_digest',
      title: '月度报告触达',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('email_retry', '邮件失败重试', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else if (isAutonomousGrowthEmailRetryEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'email_retry',
      title: '邮件失败重试',
    }, async () => {
      const result = await runEmailDeliveryRetryCycle();
      return {
        success: true,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'email_retry',
      title: '邮件失败重试',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (mode === 'validation') {
    const skipped = buildSkippedPhase('open_agent_review', 'OpenAgent 自治复审', 'validation_mode');
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  } else if (isOpenAgentRuntimeEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'open_agent_review',
      title: 'OpenAgent 自治复审',
    }, async () => {
      const result = await runWorldYiOpenAgentAutonomyReview();
      return {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'open_agent_review',
      title: 'OpenAgent 自治复审',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (isOpenAgentRuntimeEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'open_agent_site_governor',
      title: 'OpenAgent 站点质量复审',
    }, async () => {
      const result = await runWorldYiOpenAgentSiteGovernorReview();
      return {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'open_agent_site_governor',
      title: 'OpenAgent 站点质量复审',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  if (isOpenAgentRuntimeEnabled()) {
    phases.push(await runAutonomousPhase(cycleRunId, {
      key: 'open_agent_ops_triage',
      title: 'OpenAgent 异常分诊与处置建议',
    }, async () => {
      const result = await runWorldYiOpenAgentOpsTriage();
      return {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason,
        details: result as unknown as Record<string, unknown>,
      };
    }));
  } else {
    const skipped = {
      key: 'open_agent_ops_triage',
      title: 'OpenAgent 异常分诊与处置建议',
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    } satisfies AutonomousPhaseResult;
    logAutonomousCycleEvent(cycleRunId, 'phase_finish', {
      key: skipped.key,
      success: skipped.success,
      skipped: true,
      reason: skipped.reason,
      durationMs: 0,
    });
    phases.push(skipped);
  }

  const finishedAt = new Date().toISOString();
  const backlog = readOpenAgentAutonomyBacklog(6);
  const backlogFocus = summarizeOpenAgentAutonomyBacklogFocus(backlog);
  const contentDecisionLedgerEntries = readWorldYiContentDecisionLedger(6);
  const contentDecisionLedgerSummary = summarizeWorldYiContentDecisionLedger(contentDecisionLedgerEntries);
  const failedPhaseKeys = phases.filter((item) => !item.success).map((item) => item.key);
  const skippedPhaseKeys = phases.filter((item) => item.skipped).map((item) => item.key);
  const summary = failedPhaseKeys.length > 0
    ? `本轮自治完成但存在失败阶段：${failedPhaseKeys.join(', ')}`
    : mode === 'validation'
      ? '本轮自治以 validation 模式完成，已跳过重型阶段并返回调度预览'
      : backlog.length > 0
        ? `本轮自治完成，OpenAgent backlog 当前优先项：${backlog.slice(0, 3).map((item) => item.title).join(' / ')}`
        : '本轮自治完成，当前未形成新的 OpenAgent backlog 重点项';

  const cycleDurationMs = Date.now() - startedAt;

  writeWorldYiAutonomousCycleLedgerEntry({
    id: cycleRunId,
    trigger,
    mode,
    success: phases.every((item) => item.success),
    startedAt: new Date(startedAt).toISOString(),
    finishedAt,
    durationMs: cycleDurationMs,
    phaseKeys: phases.map((item) => item.key),
    failedPhaseKeys,
    skippedPhaseKeys,
    summary,
    openAgentBacklogTargets: backlog.slice(0, 5).map((item) => item.title),
    openAgentFocusKeys: backlogFocus.focusKeys,
    phaseSummaries: phases.map((phase) => ({
      key: phase.key,
      title: phase.title,
      success: phase.success,
      skipped: phase.skipped,
      reason: phase.reason,
      durationMs: phase.durationMs,
      details: phase.details,
    })),
    decisionLog: buildCycleDecisionLog(phases),
  });

  logAutonomousCycleEvent(cycleRunId, 'cycle_finish', {
    success: phases.every((item) => item.success),
    mode,
    durationMs: cycleDurationMs,
    failedPhaseKeys,
    skippedPhaseKeys,
  });

  return {
    success: phases.every((item) => item.success),
    runId: cycleRunId,
    trigger,
    mode,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt,
    durationMs: cycleDurationMs,
    phases,
    contentDecisionLedger: contentDecisionLedgerSummary,
    snapshot: buildWorldYiAutonomousSnapshot(),
  };
}
