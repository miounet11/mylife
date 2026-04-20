'use client';

import { useEffect, useState } from 'react';

type Snapshot = {
  metrics: {
    publishedEntries: number;
    draftEntries: number;
    pageViews30d: number;
    clicks30d: number;
    quickStarts30d: number;
    quickStartRate: number;
  };
  topSurfaces: Array<{
    key: string;
    label: string;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
  }>;
  clusterCoverage: Array<{
    key: string;
    title: string;
    priorityScore: number;
    demandScore: number;
    publishedCount: number;
    draftCount: number;
    missingTypes: string[];
    sampleTitles: string[];
    keywords: string[];
  }>;
  generationQueue: Array<{
    key: string;
    title: string;
    topic: string;
    angle: string;
    contentType: string;
    reason: string;
    priorityScore: number;
    sourceType?: string;
  }>;
  autoPublishCandidates: Array<{
    id: string;
    title: string;
    slug: string;
    source: string;
    score: number;
  }>;
  contentPerformance: Array<{
    id: string;
    title: string;
    slug: string;
    contentType: string;
    status: string;
    source: string;
    origin: string;
    radarSourceLabel?: string;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
  }>;
  radarSourcePerformance: Array<{
    sourceId: string;
    sourceLabel: string;
    platform: string;
    entryCount: number;
    publishedCount: number;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
    bestTitle?: string;
  }>;
};

type PolicyView = {
  source: string;
  focusKeys: string[];
  updatedAt: string;
  publishGate: {
    minScore: number;
    requireLlmSource: boolean;
    requireGrowthPublicationReady: boolean;
    blockLowPerformanceTypes: boolean;
    blockLowPerformanceRadarSources: boolean;
    laneGapBoost: number;
    weakLaneBoost: number;
    backlogLaneReserveBoost: number;
  };
  queueWeights: {
    laneGapBaseBoost: number;
    weakLaneBoost: number;
    backlogLaneReserveBoost: number;
    perLaneQuota: number;
    radarQuota: number;
    clusterQuota: number;
  };
};

type AutonomousSnapshot = {
  checkedAt: string;
  controlRoute: string;
  recommendedIntervalMinutes: number;
  openAgent: {
    enabledByEnv: boolean;
    runtimeReady: boolean;
    llmBaseUrl?: string;
    llmModel?: string;
    responsibility: string[];
    latestReview?: {
      status: 'idle' | 'success' | 'error';
      updatedAt: string;
      items: Array<{
        id: string;
        title: string;
        priority: string;
        status: string;
        whyNow: string;
      }>;
    } | null;
    latestContentAnalysis?: {
      status: 'idle' | 'success' | 'error';
      updatedAt: string;
      error?: string;
      plan: {
        summary: string;
        laneContracts: Array<{
          lane: string;
          targetKeys: string[];
          reason: string;
        }>;
        queueOverrides: Array<{
          key: string;
          priority: string;
          reason: string;
        }>;
        blockedPatterns: string[];
        policySignals: string[];
      };
    } | null;
    latestOpsTriage?: {
      status: 'idle' | 'success' | 'error';
      updatedAt: string;
      error?: string;
      plan: {
        summary: string;
        alerts: Array<{
          severity: AlertSeverity;
          title: string;
          detail: string;
          source: string;
        }>;
        recommendedActions: Array<{
          kind: 'observe' | 'run_validation' | 'run_full_cycle' | 'tighten_block_patterns' | 'focus_lane' | 'keep_policy' | 'investigate';
          title: string;
          reason: string;
          autoExecutable: boolean;
        }>;
        policyDiffs: Array<{
          path: string;
          before: string;
          after: string;
          reason: string;
        }>;
      };
    } | null;
    latestReportReliability?: {
      status: 'idle' | 'success' | 'error';
      updatedAt: string;
      error?: string;
      plan: {
        summary: string;
        alerts: Array<{
          severity: AlertSeverity;
          title: string;
          detail: string;
          source: string;
        }>;
        priorityReports: Array<{
          reportId: string;
          name: string;
          action: 'upgrade' | 'observe' | 'feedback_sync' | 'recompute';
          reason: string;
          qualityScore?: number;
          deliveryTier?: 'basic' | 'enhanced' | 'expert';
        }>;
        recommendedActions: Array<{
          kind: 'sync_feedback' | 'upgrade_reports' | 'tighten_guard' | 'observe' | 'investigate' | 'recompute' | 'keep_delivery';
          title: string;
          reason: string;
          autoExecutable: boolean;
        }>;
      };
      application?: {
        autoExecuted: boolean;
        appliedAt?: string;
        queuedJobs: Array<{
          reportId: string;
          action: 'upgrade' | 'recompute';
          status: 'queued' | 'skipped';
          reason: string;
          jobStatus?: string;
        }>;
        syncedReportIds: string[];
        skipped: Array<{
          reportId?: string;
          action?: string;
          reason: string;
        }>;
        notes: string[];
      };
    } | null;
    backlog: Array<{
      id: string;
      title: string;
      priority: string;
      status: string;
      lastSeenAt: string;
    }>;
    backlogFocus: {
      focusKeys: string[];
      qualityGate: boolean;
      laneReserve: boolean;
      decisionLedger: boolean;
      topTargets: string[];
    };
    policy: PolicyView;
    basePolicy?: PolicyView | null;
    policySignalApplications: Array<{
      signal: string;
      path: string;
      previousValue: number | boolean;
      nextValue: number | boolean;
    }>;
    ignoredPolicySignals: string[];
  };
  runtime: {
    monthlyDigestEnabled: boolean;
    emailRetryEnabled: boolean;
    recentCycles: Array<{
      id: string;
      success: boolean;
      startedAt: string;
      finishedAt: string;
      summary: string;
      failedPhaseKeys: string[];
      skippedPhaseKeys: string[];
      openAgentBacklogTargets: string[];
      openAgentFocusKeys?: string[];
    }>;
    contentDecisionLedger: {
      updatedAt?: string;
      latestReason?: string;
      latestMode?: string;
      latestDecisionMix: {
        publishCount: number;
        holdCount: number;
        reviseCount: number;
        blockedCount: number;
        totalCandidates: number;
        readyCount: number;
      };
      topBlockedReasons: Array<{
        reason: string;
        count: number;
      }>;
      lastPublishRationale: string[];
    };
  };
  quality: {
    prioritizedContentFixCount: number;
    prioritizedToolFixCount: number;
    prioritizedToolJourneyGapCount: number;
    prioritizedBouncePageCount: number;
    topContentActions: string[];
    topToolActions: string[];
  };
};

function formatDateTime(value?: string) {
  if (!value) return '暂无';
  const normalized = value.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  return normalized;
}

function formatBooleanLabel(value: boolean) {
  return value ? '是' : '否';
}

type AlertSeverity = 'critical' | 'warning' | 'info';

type PanelAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  source?: string;
};

type PolicyDiffRow = {
  key: string;
  label: string;
  previous: string;
  next: string;
  reason?: string;
};

function severityTone(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-rose-50 text-rose-700';
    case 'warning':
      return 'bg-amber-50 text-amber-700';
    case 'info':
      return 'bg-sky-50 text-sky-700';
    default:
      return 'bg-white text-[color:var(--ink)]';
  }
}

function formatPolicyValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) {
    return value.join(' / ') || '无';
  }
  if (typeof value === 'boolean') {
    return formatBooleanLabel(value);
  }
  return `${value}`;
}

function buildAutonomousAlerts(params: {
  autonomous: AutonomousSnapshot;
  snapshot: Snapshot;
  scheduler: SchedulerState | null;
}) {
  const alerts: PanelAlert[] = [];
  const latestCycle = params.autonomous.runtime.recentCycles[0];
  const latestAnalysis = params.autonomous.openAgent.latestContentAnalysis;
  const decisionMix = params.autonomous.runtime.contentDecisionLedger.latestDecisionMix;
  const topQueueHasGrowthCandidate = params.snapshot.generationQueue.some((item) => (
    `${item.sourceType || ''}`.startsWith('public-growth')
  ));

  if (params.autonomous.openAgent.enabledByEnv && !params.autonomous.openAgent.runtimeReady) {
    alerts.push({
      id: 'openagent-not-ready',
      severity: 'critical',
      title: 'OpenAgent 已开启但当前未就绪',
      detail: `当前模型：${params.autonomous.openAgent.llmModel || '未配置'}。需要保证模型、Base URL 和 API Key 可用，否则自治只会退化为读取旧快照。`,
    });
  }

  if (latestAnalysis?.status === 'error') {
    alerts.push({
      id: 'analysis-error',
      severity: 'critical',
      title: '最新内容分析执行失败',
      detail: latestAnalysis.error || 'OpenAgent 内容分析未生成有效结果。',
    });
  }

  if (latestCycle && !latestCycle.success) {
    alerts.push({
      id: 'latest-cycle-failed',
      severity: 'critical',
      title: '最近一次自治周期失败',
      detail: latestCycle.failedPhaseKeys.length > 0
        ? `失败阶段：${latestCycle.failedPhaseKeys.join(' / ')}`
        : latestCycle.summary,
    });
  }

  if (decisionMix.totalCandidates >= 20 && decisionMix.readyCount === 0) {
    alerts.push({
      id: 'no-ready-candidates',
      severity: 'warning',
      title: '当前没有可发布候选',
      detail: `最新账本共评估 ${decisionMix.totalCandidates} 个候选，但 ready 为 0。当前自动化主要在补稿和阻断，尚未恢复发布面。`,
    });
  }

  if (
    decisionMix.totalCandidates >= 20
    && decisionMix.blockedCount / Math.max(1, decisionMix.totalCandidates) >= 0.8
  ) {
    alerts.push({
      id: 'blocked-rate-high',
      severity: 'warning',
      title: '候选阻断率过高',
      detail: `blocked ${decisionMix.blockedCount} / total ${decisionMix.totalCandidates}。优先处理重复题材、来源疲劳和质量门槛冲突。`,
    });
  }

  if (params.autonomous.openAgent.backlogFocus.laneReserve && !topQueueHasGrowthCandidate) {
    alerts.push({
      id: 'lane-reserve-drift',
      severity: 'warning',
      title: '当前补稿队列偏离公开流量位补位主线',
      detail: 'OpenAgent backlog 正在强调 lane reserve，但当前前排队列没有 public-growth 补位项，需要检查分析结果与调度排序是否脱钩。',
    });
  }

  if (params.autonomous.openAgent.ignoredPolicySignals.length > 0) {
    alerts.push({
      id: 'ignored-policy-signals',
      severity: 'info',
      title: '存在未执行的策略信号',
      detail: `共有 ${params.autonomous.openAgent.ignoredPolicySignals.length} 条 signal 未被解析，建议收紧 OpenAgent 输出格式。`,
    });
  }

  if (params.scheduler?.needsDraftReplenishment) {
    alerts.push({
      id: 'draft-reserve-low',
      severity: 'info',
      title: '草稿库存低于阈值',
      detail: `当前草稿 ${params.scheduler.draftReserveCount} / 阈值 ${params.scheduler.draftReserveTarget}，系统会优先补稿。`,
    });
  }

  return alerts;
}

function buildPolicyDiffRows(basePolicy: PolicyView | null | undefined, policy: PolicyView) {
  if (!basePolicy) {
    return [] as PolicyDiffRow[];
  }

  const rows: Array<{
    key: string;
    label: string;
    previous: string | number | boolean | string[];
    next: string | number | boolean | string[];
  }> = [
    { key: 'focusKeys', label: 'focusKeys', previous: basePolicy.focusKeys, next: policy.focusKeys },
    { key: 'minScore', label: 'publishGate.minScore', previous: basePolicy.publishGate.minScore, next: policy.publishGate.minScore },
    { key: 'requireLlmSource', label: 'publishGate.requireLlmSource', previous: basePolicy.publishGate.requireLlmSource, next: policy.publishGate.requireLlmSource },
    { key: 'growthReady', label: 'publishGate.requireGrowthPublicationReady', previous: basePolicy.publishGate.requireGrowthPublicationReady, next: policy.publishGate.requireGrowthPublicationReady },
    { key: 'blockLowPerformanceTypes', label: 'publishGate.blockLowPerformanceTypes', previous: basePolicy.publishGate.blockLowPerformanceTypes, next: policy.publishGate.blockLowPerformanceTypes },
    { key: 'blockLowPerformanceRadarSources', label: 'publishGate.blockLowPerformanceRadarSources', previous: basePolicy.publishGate.blockLowPerformanceRadarSources, next: policy.publishGate.blockLowPerformanceRadarSources },
    { key: 'laneGapBoost', label: 'publishGate.laneGapBoost', previous: basePolicy.publishGate.laneGapBoost, next: policy.publishGate.laneGapBoost },
    { key: 'weakLaneBoost', label: 'publishGate.weakLaneBoost', previous: basePolicy.publishGate.weakLaneBoost, next: policy.publishGate.weakLaneBoost },
    { key: 'backlogLaneReserveBoost', label: 'publishGate.backlogLaneReserveBoost', previous: basePolicy.publishGate.backlogLaneReserveBoost, next: policy.publishGate.backlogLaneReserveBoost },
    { key: 'laneGapBaseBoost', label: 'queueWeights.laneGapBaseBoost', previous: basePolicy.queueWeights.laneGapBaseBoost, next: policy.queueWeights.laneGapBaseBoost },
    { key: 'queueWeakLaneBoost', label: 'queueWeights.weakLaneBoost', previous: basePolicy.queueWeights.weakLaneBoost, next: policy.queueWeights.weakLaneBoost },
    { key: 'queueBacklogBoost', label: 'queueWeights.backlogLaneReserveBoost', previous: basePolicy.queueWeights.backlogLaneReserveBoost, next: policy.queueWeights.backlogLaneReserveBoost },
    { key: 'perLaneQuota', label: 'queueWeights.perLaneQuota', previous: basePolicy.queueWeights.perLaneQuota, next: policy.queueWeights.perLaneQuota },
    { key: 'radarQuota', label: 'queueWeights.radarQuota', previous: basePolicy.queueWeights.radarQuota, next: policy.queueWeights.radarQuota },
    { key: 'clusterQuota', label: 'queueWeights.clusterQuota', previous: basePolicy.queueWeights.clusterQuota, next: policy.queueWeights.clusterQuota },
  ];

  return rows
    .filter((item) => JSON.stringify(item.previous) !== JSON.stringify(item.next))
    .map((item) => ({
      key: item.key,
      label: item.label,
      previous: formatPolicyValue(item.previous),
      next: formatPolicyValue(item.next),
    }));
}

function formatOpsActionKind(kind: NonNullable<AutonomousSnapshot['openAgent']['latestOpsTriage']>['plan']['recommendedActions'][number]['kind']) {
  switch (kind) {
    case 'run_validation':
      return '运行校验';
    case 'run_full_cycle':
      return '运行全量';
    case 'tighten_block_patterns':
      return '收紧阻断';
    case 'focus_lane':
      return '聚焦 lane';
    case 'keep_policy':
      return '保持策略';
    case 'investigate':
      return '深入排查';
    case 'observe':
    default:
      return '继续观察';
  }
}

type SchedulerState = {
  localNow: string;
  publishHours: number[];
  dailyPublishLimit: number;
  publishedToday: number;
  draftReserveTarget: number;
  draftReserveCount: number;
  needsDraftReplenishment: boolean;
  publishWindowOpen: boolean;
  canPublishNow: boolean;
  nextPublishSlotLabel: string;
  recentRuns: Array<{
    id: string;
    trigger: 'cron' | 'manual';
    status: 'success' | 'skipped' | 'error';
    reason?: string;
    generatedCount?: number;
    publishedCount?: number;
    createdAt?: string;
  }>;
};

export default function ContentAutomationPanel({
  onCompleted,
}: {
  onCompleted?: (summary: string) => void | Promise<void>;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerState | null>(null);
  const [autonomous, setAutonomous] = useState<AutonomousSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<'draft' | 'publish' | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [autonomousRunning, setAutonomousRunning] = useState<'validation' | 'full' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recentTitles, setRecentTitles] = useState<string[]>([]);
  const openAgentOpsTriage = autonomous?.openAgent.latestOpsTriage || null;
  const fallbackAutonomousAlerts: PanelAlert[] = autonomous && snapshot
    ? buildAutonomousAlerts({
        autonomous,
        snapshot,
        scheduler,
      })
    : [];
  const autonomousAlerts: PanelAlert[] = openAgentOpsTriage?.plan.alerts.length
    ? openAgentOpsTriage.plan.alerts.map((item, index) => ({
        id: `${item.source}-${item.title}-${index}`,
        severity: item.severity,
        title: item.title,
        detail: item.detail,
        source: item.source,
      }))
    : fallbackAutonomousAlerts;
  const fallbackPolicyDiffRows: PolicyDiffRow[] = autonomous
    ? buildPolicyDiffRows(autonomous.openAgent.basePolicy, autonomous.openAgent.policy)
    : [];
  const policyDiffRows: PolicyDiffRow[] = openAgentOpsTriage?.plan.policyDiffs.length
    ? openAgentOpsTriage.plan.policyDiffs.map((item, index) => ({
        key: `${item.path}-${index}`,
        label: item.path,
        previous: item.before,
        next: item.after,
        reason: item.reason,
      }))
    : fallbackPolicyDiffRows;
  const recommendedActions = openAgentOpsTriage?.plan.recommendedActions || [];
  const reportReliabilityReview = autonomous?.openAgent.latestReportReliability || null;
  const reportPriorityReports = reportReliabilityReview?.plan.priorityReports || [];
  const reportReliabilityQueuedCount = reportReliabilityReview?.application?.queuedJobs.filter((item) => item.status === 'queued').length || 0;
  const reportReliabilitySyncedCount = reportReliabilityReview?.application?.syncedReportIds.length || 0;

  const loadSnapshot = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError('');
    try {
      const [contentResponse, autonomousResponse] = await Promise.all([
        fetch('/api/admin/content/automation', { cache: 'no-store' }),
        fetch('/api/admin/system/autonomous', { cache: 'no-store' }),
      ]);
      const [contentData, autonomousData] = await Promise.all([
        contentResponse.json(),
        autonomousResponse.json(),
      ]);

      const errors: string[] = [];

      if (!contentResponse.ok || !contentData.success) {
        errors.push(contentData.error || '加载内容自动化概览失败');
      } else {
        setSnapshot(contentData.snapshot || null);
        setScheduler(contentData.scheduler || null);
      }

      if (!autonomousResponse.ok || !autonomousData.success) {
        errors.push(autonomousData.error || '加载自治总控概览失败');
      } else {
        setAutonomous(autonomousData.snapshot || null);
      }

      if (errors.length > 0) {
        setError(errors.join('；'));
      }
    } catch {
      setError('网络异常，无法加载内容自动化或自治总控概览');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const runCycle = async (autoPublish: boolean) => {
    setRunning(autoPublish ? 'publish' : 'draft');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/content/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 3,
          autoPublish,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '执行失败');
        return;
      }

      setSnapshot(data.snapshot || null);
      setScheduler(data.scheduler || null);
      setRecentTitles((data.savedEntries || []).map((item: { title: string }) => item.title).slice(0, 6));
      const summary = autoPublish
        ? `自动化已执行，生成 ${data.generatedCount || 0} 条内容，其中发布 ${data.publishedCount || 0} 条`
        : `自动化已执行，生成 ${data.generatedCount || 0} 条草稿`;
      setMessage(summary);
      await loadSnapshot({ silent: true });
      await onCompleted?.(summary);
    } catch {
      setError('网络异常，执行失败');
    } finally {
      setRunning(null);
    }
  };

  const runScheduler = async () => {
    setScheduling(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/content/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useScheduler: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '计划任务执行失败');
        return;
      }

      setSnapshot(data.snapshot || null);
      setScheduler(data.scheduler || null);
      const summary = `计划任务已执行，补稿 ${data.generatedCount || 0} 条，发布 ${data.publishedCount || 0} 条`;
      setMessage(summary);
      await loadSnapshot({ silent: true });
      await onCompleted?.(summary);
    } catch {
      setError('网络异常，计划任务执行失败');
    } finally {
      setScheduling(false);
    }
  };

  const runAutonomous = async (mode: 'validation' | 'full') => {
    setAutonomousRunning(mode);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/system/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '自治总控执行失败');
        return;
      }

      const summary = mode === 'validation'
        ? '自治 validation 已执行，已刷新内容分析、调度预览和策略状态'
        : '自治总控已执行，已刷新采集、补稿、发布和复审状态';
      setMessage(summary);
      setAutonomous(data.snapshot || null);
      await loadSnapshot({ silent: true });
      await onCompleted?.(summary);
    } catch {
      setError('网络异常，自治总控执行失败');
    } finally {
      setAutonomousRunning(null);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-[color:var(--muted)]">内容自动化</div>
          <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">自动化概览</div>
        </div>

        <div className="space-y-2">
          <div className="action-guide">主动作</div>
          <div className="action-strip flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void runCycle(false)}
              disabled={running !== null || scheduling}
              className="action-secondary disabled:opacity-60"
            >
              {running === 'draft' ? '生成中...' : '自动生成草稿'}
            </button>
            <button
              type="button"
              onClick={() => void runCycle(true)}
              disabled={running !== null || scheduling}
              className="action-primary disabled:opacity-60"
            >
              {running === 'publish' ? '发布中...' : '自动生成并发布'}
            </button>
            <button
              type="button"
              onClick={() => void runScheduler()}
              disabled={running !== null || scheduling}
              className="action-secondary disabled:opacity-60"
            >
              {scheduling ? '执行中...' : '执行计划任务'}
            </button>
          </div>
          <div className="pt-1 text-xs font-semibold tracking-[0.18em] text-[color:var(--muted)]">自治总控</div>
          <div className="action-strip flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void runAutonomous('validation')}
              disabled={running !== null || scheduling || autonomousRunning !== null}
              className="action-secondary disabled:opacity-60"
            >
              {autonomousRunning === 'validation' ? '校验中...' : '运行自治校验'}
            </button>
            <button
              type="button"
              onClick={() => void runAutonomous('full')}
              disabled={running !== null || scheduling || autonomousRunning !== null}
              className="action-primary disabled:opacity-60"
            >
              {autonomousRunning === 'full' ? '运行中...' : '运行自治总控'}
            </button>
          </div>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      {loading || !snapshot ? (
        <div className="mt-6 rounded-[1.5rem] bg-white/70 p-5 text-sm text-[color:var(--muted)]">加载中...</div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            {[
              { label: '已发布内容', value: snapshot.metrics.publishedEntries },
              { label: '草稿库存', value: snapshot.metrics.draftEntries },
              { label: '近 30 日访问', value: snapshot.metrics.pageViews30d },
              { label: '快速分析率', value: `${snapshot.metrics.quickStartRate}%` },
              ...(autonomous ? [
                { label: '自治节奏', value: `${autonomous.recommendedIntervalMinutes} 分钟` },
                { label: 'OpenAgent', value: autonomous.openAgent.runtimeReady ? '已就绪' : autonomous.openAgent.enabledByEnv ? '待配置' : '未开启' },
                { label: '策略来源', value: autonomous.openAgent.policy.source },
                { label: '最近自治', value: autonomous.runtime.recentCycles[0]?.success ? '成功' : autonomous.runtime.recentCycles[0] ? '异常' : '暂无' },
              ] : []),
              ...(scheduler ? [
                { label: '今日已发布', value: `${scheduler.publishedToday}/${scheduler.dailyPublishLimit}` },
                { label: '下个发布点', value: scheduler.nextPublishSlotLabel },
                { label: '草稿阈值', value: `${scheduler.draftReserveCount}/${scheduler.draftReserveTarget}` },
                { label: '自动发布', value: scheduler.canPublishNow ? '可执行' : '未满足' },
              ] : []),
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>

          {autonomous && (
            <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">异常告警</div>
                <div className="grid gap-3">
                  {autonomousAlerts.length > 0 ? autonomousAlerts.map((item) => (
                    <div key={item.id} className={`rounded-[1.4rem] px-4 py-4 ${severityTone(item.severity)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em]">{item.severity}</div>
                      </div>
                      {item.source ? (
                        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-75">{item.source}</div>
                      ) : null}
                      <div className={`${item.source ? 'mt-1' : 'mt-2'} text-xs leading-6`}>{item.detail}</div>
                    </div>
                  )) : (
                    <div className="rounded-[1.4rem] bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                      当前没有显著异常，自治链路、内容分析与调度主线基本一致。
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">策略变更 Diff</div>
                <div className="grid gap-3">
                  {policyDiffRows.length > 0 ? policyDiffRows.map((item) => (
                    <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                      <div className="mt-2 grid gap-2 text-xs text-[color:var(--muted)]">
                        <div>base：{item.previous}</div>
                        <div>effective：{item.next}</div>
                        {item.reason ? <div>原因：{item.reason}</div> : null}
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm text-[color:var(--muted)]">
                      当前 effective policy 与 base policy 一致，没有新的运行态覆盖差异。
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {autonomous && (
            <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">自治总控状态</div>
                <div className="grid gap-3">
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">统一控制入口</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {autonomous.controlRoute} · 推荐每 {autonomous.recommendedIntervalMinutes} 分钟执行一次
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">
                          {autonomous.openAgent.runtimeReady ? 'READY' : autonomous.openAgent.enabledByEnv ? 'WAIT' : 'OFF'}
                        </div>
                        <div className="text-xs text-[color:var(--muted)]">{autonomous.openAgent.llmModel || '未配置模型'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {autonomous.openAgent.responsibility.map((item) => (
                        <span key={item} className="rounded-full bg-[color:var(--sand)] px-3 py-1 text-xs text-[color:var(--ink)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">最新内容分析</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {autonomous.openAgent.latestContentAnalysis?.status || 'idle'} · {formatDateTime(autonomous.openAgent.latestContentAnalysis?.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {autonomous.openAgent.latestContentAnalysis?.plan.summary || autonomous.openAgent.latestContentAnalysis?.error || '暂无内容分析摘要'}
                    </div>
                    {autonomous.openAgent.latestContentAnalysis?.plan.laneContracts.length ? (
                      <div className="mt-3 grid gap-2">
                        {autonomous.openAgent.latestContentAnalysis.plan.laneContracts.slice(0, 2).map((item) => (
                          <div key={`${item.lane}-${item.targetKeys.join('-')}`} className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3 text-xs text-[color:var(--ink)]">
                            <div className="font-semibold">{item.lane} lane 补位合同</div>
                            <div className="mt-1 text-[color:var(--muted)]">{item.targetKeys.join(' / ')}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {autonomous.openAgent.latestContentAnalysis?.plan.blockedPatterns.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {autonomous.openAgent.latestContentAnalysis.plan.blockedPatterns.slice(0, 6).map((item) => (
                          <span key={item} className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">最新运行分诊</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {openAgentOpsTriage?.status || 'idle'} · {formatDateTime(openAgentOpsTriage?.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {openAgentOpsTriage?.plan.summary || openAgentOpsTriage?.error || '暂无运行分诊摘要'}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        { label: '告警', value: openAgentOpsTriage?.plan.alerts.length || 0 },
                        { label: '建议', value: openAgentOpsTriage?.plan.recommendedActions.length || 0 },
                        { label: '策略差异', value: openAgentOpsTriage?.plan.policyDiffs.length || 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3">
                          <div className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--muted)]">{item.label}</div>
                          <div className="mt-1 text-lg font-black text-[color:var(--ink)]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">最新测算可靠性复审</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {reportReliabilityReview?.status || 'idle'} · {formatDateTime(reportReliabilityReview?.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {reportReliabilityReview?.plan.summary || reportReliabilityReview?.error || '暂无测算可靠性复审摘要'}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        { label: '告警', value: reportReliabilityReview?.plan.alerts.length || 0 },
                        { label: '优先报告', value: reportReliabilityReview?.plan.priorityReports.length || 0 },
                        { label: '建议', value: reportReliabilityReview?.plan.recommendedActions.length || 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3">
                          <div className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--muted)]">{item.label}</div>
                          <div className="mt-1 text-lg font-black text-[color:var(--ink)]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {reportReliabilityReview?.application?.autoExecuted ? (
                      <div className="mt-3 rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3 text-xs text-[color:var(--ink)]">
                        已自动处理：排队升级 {reportReliabilityQueuedCount} 份，反馈同步 {reportReliabilitySyncedCount} 份。
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">Effective Policy</div>
                <div className="grid gap-3">
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">当前策略覆盖</div>
                      <div className="text-xs text-[color:var(--muted)]">{autonomous.openAgent.policy.source}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[color:var(--ink)]">
                      <div>focusKeys：{autonomous.openAgent.policy.focusKeys.join(' / ') || '无'}</div>
                      <div>minScore：{autonomous.openAgent.policy.publishGate.minScore}</div>
                      <div>requireLlmSource：{formatBooleanLabel(autonomous.openAgent.policy.publishGate.requireLlmSource)}</div>
                      <div>growthReady：{formatBooleanLabel(autonomous.openAgent.policy.publishGate.requireGrowthPublicationReady)}</div>
                      <div>perLaneQuota / radarQuota / clusterQuota：{autonomous.openAgent.policy.queueWeights.perLaneQuota} / {autonomous.openAgent.policy.queueWeights.radarQuota} / {autonomous.openAgent.policy.queueWeights.clusterQuota}</div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">策略信号应用</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {autonomous.openAgent.policySignalApplications.length} 条生效
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {autonomous.openAgent.policySignalApplications.length > 0 ? autonomous.openAgent.policySignalApplications.map((item) => (
                        <div key={`${item.path}-${item.signal}`} className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3 text-xs text-[color:var(--ink)]">
                          <div className="font-semibold">{item.path}</div>
                          <div className="mt-1 text-[color:var(--muted)]">{String(item.previousValue)} → {String(item.nextValue)}</div>
                        </div>
                      )) : (
                        <div className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3 text-xs text-[color:var(--muted)]">
                          最新 content analysis 没有改写策略值，当前 effective policy 与持久化策略一致。
                        </div>
                      )}
                    </div>
                    {autonomous.openAgent.ignoredPolicySignals.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {autonomous.openAgent.ignoredPolicySignals.map((item) => (
                          <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {autonomous && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">OpenAgent 处置建议</div>
              <div className="grid gap-3 xl:grid-cols-2">
                {recommendedActions.length > 0 ? recommendedActions.map((item, index) => (
                  <div key={`${item.kind}-${item.title}-${index}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[color:var(--accent-strong)]">{formatOpsActionKind(item.kind)}</div>
                        <div className="text-[10px] text-[color:var(--muted)]">{item.autoExecutable ? '可自动执行' : '人工确认'}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm text-[color:var(--muted)]">
                    当前没有新增处置建议，继续按既有自治节奏运行即可。
                  </div>
                )}
              </div>
            </div>
          )}

          {autonomous && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">测算可靠性优先报告</div>
              <div className="grid gap-3 xl:grid-cols-2">
                {reportPriorityReports.length > 0 ? reportPriorityReports.map((item) => (
                  <div key={item.reportId} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.name}</div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[color:var(--accent-strong)]">{item.action}</div>
                        <div className="text-[10px] text-[color:var(--muted)]">{item.reportId}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      质量分 {item.qualityScore ?? '--'} · 交付层 {item.deliveryTier || 'unknown'}
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm text-[color:var(--muted)]">
                    当前没有新增的优先复核报告，继续按既有升级队列和反馈节奏运行即可。
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">高转化内容入口</div>
              <div className="grid gap-3">
                {snapshot.topSurfaces.length > 0 ? snapshot.topSurfaces.map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          浏览 {item.views} / 点击 {item.clicks} / 快速分析 {item.quickStarts}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.conversionRate}%</div>
                        <div className="text-xs text-[color:var(--muted)]">转化率</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无高转化入口</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">下一轮优先扩张主题</div>
              <div className="grid gap-3">
                {snapshot.generationQueue.map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[color:var(--accent-strong)]">{item.contentType}</div>
                        <div className="text-xs text-[color:var(--muted)]">{item.sourceType === 'radar' ? '热点驱动' : '结构补位'}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{item.reason}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">选题：{item.topic}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">内容覆盖缺口</div>
              <div className="grid gap-3">
                {snapshot.clusterCoverage.slice(0, 6).map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-xs text-[color:var(--muted)]">优先级 {item.priorityScore}</div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      已发布 {item.publishedCount} / 草稿 {item.draftCount} / 待补 {item.missingTypes.join('、') || '无'}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">关键词：{item.keywords.join('、')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">自动发布候选</div>
              <div className="grid gap-3">
                {snapshot.autoPublishCandidates.length > 0 ? snapshot.autoPublishCandidates.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {item.slug} · {item.source} · 质量分 {item.score}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无自动发布候选</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {scheduler && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">计划任务状态</div>
                <div className="grid gap-3">
                  {[
                    scheduler.publishWindowOpen ? '当前处于发布窗口' : '当前不在发布窗口',
                    scheduler.canPublishNow ? '满足自动发布条件' : '当前不会自动发布',
                    scheduler.needsDraftReplenishment ? '草稿库存低于阈值，需要补稿' : '草稿库存充足',
                    '发布排序会优先参考历史高转化内容类型与热点来源反馈',
                    `固定发布时间：${scheduler.publishHours.map((hour) => `${String(hour).padStart(2, '0')}:00`).join(' / ')}`,
                  ].map((item) => (
                    <div key={item} className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近计划任务记录</div>
                <div className="grid gap-3">
                  {scheduler.recentRuns.length > 0 ? scheduler.recentRuns.map((item) => (
                    <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.reason || '计划任务记录'}</div>
                        <div className="text-xs text-[color:var(--muted)]">{item.createdAt || ''}</div>
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        {item.trigger} · {item.status} · 生成 {item.generatedCount || 0} / 发布 {item.publishedCount || 0}
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">暂无计划任务记录</div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">执行一次计划任务后，这里会显示补稿和发布结果。</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {autonomous && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近自治周期</div>
                <div className="grid gap-3">
                  {autonomous.runtime.recentCycles.length > 0 ? autonomous.runtime.recentCycles.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{item.summary}</div>
                          <div className="mt-1 text-xs text-[color:var(--muted)]">
                            开始 {formatDateTime(item.startedAt)} · 结束 {formatDateTime(item.finishedAt)}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${item.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.success ? 'success' : 'failed'}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        focusKeys：{item.openAgentFocusKeys?.join(' / ') || '无'}
                      </div>
                      {item.failedPhaseKeys.length > 0 ? (
                        <div className="mt-2 text-xs text-rose-700">失败阶段：{item.failedPhaseKeys.join(' / ')}</div>
                      ) : null}
                    </div>
                  )) : (
                    <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm text-[color:var(--muted)]">
                      暂无自治周期记录。
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">阻断账本与复审焦点</div>
                <div className="grid gap-3">
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">最新决策账本</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {autonomous.runtime.contentDecisionLedger.latestMode || '未知'} · {formatDateTime(autonomous.runtime.contentDecisionLedger.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[color:var(--ink)]">
                      <div className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3">publish {autonomous.runtime.contentDecisionLedger.latestDecisionMix.publishCount}</div>
                      <div className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3">ready {autonomous.runtime.contentDecisionLedger.latestDecisionMix.readyCount}</div>
                      <div className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3">blocked {autonomous.runtime.contentDecisionLedger.latestDecisionMix.blockedCount}</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {autonomous.runtime.contentDecisionLedger.topBlockedReasons.slice(0, 4).map((item) => (
                        <div key={item.reason} className="rounded-2xl bg-rose-50 px-3 py-3 text-xs text-rose-700">
                          {item.reason} · {item.count}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">OpenAgent backlog</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {autonomous.openAgent.backlogFocus.focusKeys.join(' / ') || '无 focus key'}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {autonomous.openAgent.backlog.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-[color:var(--sand)]/70 px-3 py-3 text-xs text-[color:var(--ink)]">
                          <div className="font-semibold">{item.priority} · {item.title}</div>
                          <div className="mt-1 text-[color:var(--muted)]">{item.status} · {formatDateTime(item.lastSeenAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">高转化内容归因</div>
              <div className="grid gap-3">
                {snapshot.contentPerformance.length > 0 ? snapshot.contentPerformance.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.contentType} · {item.origin} · {item.status === 'published' ? '已发布' : '草稿'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.quickStarts}</div>
                        <div className="text-xs text-[color:var(--muted)]">分析发起</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      浏览 {item.views} / 点击 {item.clicks} / 转化率 {item.conversionRate}%
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无内容归因数据</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">等用户从内容页进入分析和工具后，这里再看真实承接表现。</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">热点源真实表现</div>
              <div className="grid gap-3">
                {snapshot.radarSourcePerformance.length > 0 ? snapshot.radarSourcePerformance.map((item) => (
                  <div key={item.sourceId} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.sourceLabel}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.platform} · 内容 {item.entryCount} / 已发布 {item.publishedCount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.quickStarts}</div>
                        <div className="text-xs text-[color:var(--muted)]">分析发起</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      浏览 {item.views} / 点击 {item.clicks} / 转化率 {item.conversionRate}%
                    </div>
                    {item.bestTitle && (
                      <div className="mt-2 text-xs text-[color:var(--muted)]">{item.bestTitle}</div>
                    )}
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无热点转化表现</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {recentTitles.length > 0 && (
            <div className="rounded-[1.5rem] bg-white/70 p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">本轮已执行内容</div>
              <div className="mt-3 grid gap-2">
                {recentTitles.map((title) => (
                  <div key={title} className="text-sm text-[color:var(--ink)]">{title}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
