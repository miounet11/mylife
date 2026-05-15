import { getContentOpsSnapshot, getContentSchedulerOverview } from '@/lib/content-ops';
import { analyticsOperations } from '@/lib/database';
import {
  getContentSchedulerGenerateCooldownMinutes,
  getKnowledgeAcquisitionIntervalMs,
  getKnowledgeAcquisitionLockTtlMs,
} from '@/lib/env';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';
import {
  readKnowledgeAcquisitionLockStatus,
  readKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';

export type SystemHealthSeverity = 'healthy' | 'warning' | 'critical';

export interface SystemOpsSnapshot {
  severity: SystemHealthSeverity;
  title: string;
  summary: string;
  checkedAt: string;
  blockers: string[];
  healthySignals: string[];
  services: {
    analytics: {
      severity: SystemHealthSeverity;
      title: string;
      summary: string;
      updatedAt?: string | null;
      blockers: string[];
      healthySignals: string[];
      metrics: {
        totalAnalyses: number;
        publicReports: number;
        validAnalyses: number;
        validPublicReports: number;
        validAnalysesLast7d: number;
        totalEvents: number;
        validationPending: number;
      };
    };
    content: {
      severity: SystemHealthSeverity;
      summary: string;
      blockers: string[];
      healthySignals: string[];
      metrics: {
        publishedEntries: number;
        draftEntries: number;
        generationQueueLength: number;
        autoPublishCandidateCount: number;
        quickStartRate: number;
      };
      scheduler: {
        draftReserveCount: number;
        draftReserveTarget: number;
        needsDraftReplenishment: boolean;
        canPublishNow: boolean;
        publishWindowOpen: boolean;
        nextPublishSlotLabel: string;
        lastPublishedAt?: string;
        lastGeneratedAt?: string;
        minutesSinceLastPublish?: number;
        minutesSinceLastGenerate?: number;
      };
    };
    knowledge: {
      severity: SystemHealthSeverity;
      summary: string;
      blockers: string[];
      healthySignals: string[];
      metrics: ReturnType<typeof getKnowledgeOpsSnapshot>['metrics'] & {
        featuredTopicCount: number;
        publishQueueLength: number;
      };
      acquisition: ReturnType<typeof getKnowledgeOpsSnapshot>['acquisition'];
    };
  };
}

function severityRank(severity: SystemHealthSeverity) {
  switch (severity) {
    case 'critical':
      return 3;
    case 'warning':
      return 2;
    default:
      return 1;
  }
}

function maxSeverity(items: SystemHealthSeverity[]) {
  return items.reduce<SystemHealthSeverity>((current, next) => (
    severityRank(next) > severityRank(current) ? next : current
  ), 'healthy');
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function mapAnalyticsSeverity(value?: string | null): SystemHealthSeverity {
  if (value === 'critical') return 'critical';
  if (value === 'warning') return 'warning';
  return 'healthy';
}

function safeAgeMs(iso?: string) {
  if (!iso) {
    return null;
  }
  const ageMs = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ageMs) && ageMs >= 0 ? ageMs : null;
}

export function getSystemOpsSnapshot(params?: {
  mode?: 'full' | 'summary';
  knowledgeRunStaleMs?: number;
  contentGenerateStaleMinutes?: number;
  contentPublishStaleMinutes?: number;
  modelWindowMinutes?: number;
}) : SystemOpsSnapshot {
  const mode = params?.mode || 'full';
  const summaryMode = mode === 'summary';
  const overview = summaryMode
    ? analyticsOperations.getSystemHealthSummary({ modelWindowMinutes: params?.modelWindowMinutes })
    : analyticsOperations.getOverview();
  const scheduler = getContentSchedulerOverview();
  const knowledgeSnapshot = summaryMode ? readKnowledgeAcquisitionSnapshot() : null;
  const knowledgeLockTtlMs = summaryMode ? getKnowledgeAcquisitionLockTtlMs() : null;
  const knowledgeLockStatus = knowledgeLockTtlMs ? readKnowledgeAcquisitionLockStatus(knowledgeLockTtlMs) : null;
  const contentOps = summaryMode
    ? {
        metrics: {
          publishedEntries: 0,
          draftEntries: scheduler.draftReserveCount,
          quickStartRate: 0,
        },
        generationQueue: [],
        autoPublishCandidates: [],
      }
    : getContentOpsSnapshot();
  const knowledgeOps = summaryMode
    ? {
        metrics: {
          publishedKnowledgeEntries: 0,
          draftKnowledgeEntries: 0,
          publishedSynthesisEntries: 0,
          draftSynthesisEntries: 0,
          publishCandidateCount: 0,
          topicHubCount: 0,
          flagshipCount: 0,
          homepageEligibleCount: 0,
        },
        acquisition: {
          status: knowledgeSnapshot?.status || 'idle',
          lastRunAt: knowledgeSnapshot?.finishedAt || knowledgeSnapshot?.updatedAt,
          durationMs: knowledgeSnapshot?.durationMs,
          error: knowledgeSnapshot?.error,
          lock: {
            present: !!knowledgeLockStatus?.lock,
            stale: !!knowledgeLockStatus?.stale,
            ageMs: knowledgeLockStatus?.ageMs || 0,
            ttlMs: knowledgeLockTtlMs || 0,
          },
        },
        featuredTopics: [],
        publishQueue: [],
      }
    : getKnowledgeOpsSnapshot();

  const analyticsSeverity = mapAnalyticsSeverity(overview.systemHealth?.severity);
  const analyticsBlockers = (overview.systemHealth?.blockers || []).slice(0, 4);
  const analyticsSignals = (overview.systemHealth?.healthySignals || []).slice(0, 4);

  const contentBlockers: string[] = [];
  const contentHealthySignals: string[] = [];
  let contentSeverity: SystemHealthSeverity = 'healthy';
  const contentGenerateStaleMinutes = params?.contentGenerateStaleMinutes
    ?? Math.max(
      getContentSchedulerGenerateCooldownMinutes() * 2,
      360
    );
  const contentPublishStaleMinutes = params?.contentPublishStaleMinutes
    ?? 36 * 60;

  if (scheduler.draftReserveCount <= 0 && scheduler.needsDraftReplenishment) {
    contentSeverity = 'critical';
    contentBlockers.push('内容草稿储备已经为 0，自动发布会很快失去补给。');
  } else if (scheduler.draftReserveCount < scheduler.draftReserveTarget) {
    contentSeverity = 'warning';
    contentBlockers.push(`内容草稿储备仅 ${scheduler.draftReserveCount}，低于目标 ${scheduler.draftReserveTarget}。`);
  }

  if (scheduler.needsDraftReplenishment && (scheduler.minutesSinceLastGenerate || 0) >= contentGenerateStaleMinutes) {
    contentSeverity = maxSeverity([contentSeverity, scheduler.draftReserveCount <= 0 ? 'critical' : 'warning']);
    contentBlockers.push(`内容补稿已超过 ${scheduler.minutesSinceLastGenerate} 分钟未恢复。`);
  }

  if (
    scheduler.draftReserveCount > 0
    && (scheduler.minutesSinceLastPublish || 0) >= contentPublishStaleMinutes
  ) {
    contentSeverity = maxSeverity([contentSeverity, 'critical']);
    contentBlockers.push(`内容发布已超过 ${scheduler.minutesSinceLastPublish} 分钟没有推进，请检查 PM2 后台 worker 或 cron 调度。`);
  }

  if (!summaryMode && contentOps.generationQueue.length === 0) {
    contentSeverity = maxSeverity([contentSeverity, 'warning']);
    contentBlockers.push('内容生成队列为空，后续自动补稿缺少明确候选。');
  }

  if (!summaryMode && contentOps.metrics.publishedEntries > 0) {
    contentHealthySignals.push(`内容库已有 ${contentOps.metrics.publishedEntries} 篇已发布条目。`);
  }
  if (!summaryMode && contentOps.autoPublishCandidates.length > 0) {
    contentHealthySignals.push(`当前还有 ${contentOps.autoPublishCandidates.length} 个内容自动发布候选。`);
  }
  if (!scheduler.needsDraftReplenishment) {
    contentHealthySignals.push('内容草稿储备目前仍在安全范围内。');
  }
  if (!summaryMode && contentOps.metrics.quickStartRate > 0) {
    contentHealthySignals.push(`内容页近 30 天快速开始转化率 ${contentOps.metrics.quickStartRate}%。`);
  }

  const knowledgeBlockers: string[] = [];
  const knowledgeHealthySignals: string[] = [];
  let knowledgeSeverity: SystemHealthSeverity = 'healthy';
  const knowledgeIntervalMs = getKnowledgeAcquisitionIntervalMs();
  const knowledgeRunStaleMs = params?.knowledgeRunStaleMs ?? Math.max(knowledgeIntervalMs * 2, 1000 * 60 * 90);
  const knowledgeRunAgeMs = safeAgeMs(knowledgeOps.acquisition.lastRunAt);

  if (knowledgeOps.acquisition.lock.stale) {
    knowledgeSeverity = 'critical';
    knowledgeBlockers.push('知识采集锁已陈旧，说明上一次运行可能异常退出。');
  }

  if (knowledgeOps.acquisition.status === 'error') {
    knowledgeSeverity = 'critical';
    knowledgeBlockers.push(`知识采集最近一次运行失败${knowledgeOps.acquisition.error ? `：${knowledgeOps.acquisition.error}` : '。'}`);
  } else if (!summaryMode && !knowledgeOps.acquisition.lastRunAt) {
    knowledgeSeverity = maxSeverity([knowledgeSeverity, 'warning']);
    knowledgeBlockers.push('知识采集还没有成功运行记录。');
  } else if ((knowledgeRunAgeMs || 0) > knowledgeRunStaleMs) {
    knowledgeSeverity = maxSeverity([knowledgeSeverity, 'warning']);
    knowledgeBlockers.push(`知识采集快照距今已超过 ${Math.round((knowledgeRunAgeMs || 0) / 60_000)} 分钟。`);
  }

  if (!summaryMode && knowledgeOps.metrics.topicHubCount <= 0) {
    knowledgeSeverity = maxSeverity([knowledgeSeverity, 'warning']);
    knowledgeBlockers.push('知识专题枢纽仍为空，知识网络还不够可用。');
  }
  if (!summaryMode && knowledgeOps.metrics.publishedKnowledgeEntries <= 0) {
    knowledgeSeverity = maxSeverity([knowledgeSeverity, 'warning']);
    knowledgeBlockers.push('当前还没有已发布知识条目。');
  }

  if (!summaryMode && knowledgeOps.metrics.publishedKnowledgeEntries > 0) {
    knowledgeHealthySignals.push(`知识库已有 ${knowledgeOps.metrics.publishedKnowledgeEntries} 篇已发布条目。`);
  }
  if (!summaryMode && knowledgeOps.metrics.topicHubCount > 0) {
    knowledgeHealthySignals.push(`已形成 ${knowledgeOps.metrics.topicHubCount} 个专题枢纽。`);
  }
  if (!summaryMode && knowledgeOps.metrics.publishCandidateCount > 0) {
    knowledgeHealthySignals.push(`当前还有 ${knowledgeOps.metrics.publishCandidateCount} 个知识发布候选待处理。`);
  }
  if (knowledgeOps.acquisition.status === 'success' && (knowledgeRunAgeMs || 0) <= knowledgeRunStaleMs) {
    knowledgeHealthySignals.push('知识采集最近一次运行成功，快照仍然新鲜。');
  }

  const severity = maxSeverity([analyticsSeverity, contentSeverity, knowledgeSeverity]);
  const blockers = uniqueStrings([
    ...analyticsBlockers,
    ...contentBlockers,
    ...knowledgeBlockers,
  ]).slice(0, 8);
  const healthySignals = uniqueStrings([
    ...analyticsSignals,
    ...contentHealthySignals,
    ...knowledgeHealthySignals,
  ]).slice(0, 8);

  return {
    severity,
    title: severity === 'critical'
      ? '当前系统存在明确阻塞，需要优先修复自动采集或内容补给'
      : severity === 'warning'
        ? '当前系统可以继续运行，但已有明显薄弱环节'
        : '当前系统整体稳定，适合继续放量发布和观察转化',
    summary: severity === 'critical'
      ? '优先恢复知识采集、草稿补给和关键运行快照，避免发布链路出现断粮。'
      : severity === 'warning'
        ? '主站仍可持续运行，但知识或内容链路的储备、刷新频率、候选池已经出现偏弱信号。'
        : '主站经营健康、内容补给和知识采集当前都没有明显硬阻塞，可以继续观察真实用户反馈。',
    checkedAt: new Date().toISOString(),
    blockers,
    healthySignals,
    services: {
      analytics: {
        severity: analyticsSeverity,
        title: overview.systemHealth?.title || '经营健康数据暂不可用',
        summary: overview.systemHealth?.summary || '经营健康数据仍在积累。',
        updatedAt: overview.systemHealth?.updatedAt,
        blockers: analyticsBlockers,
        healthySignals: analyticsSignals,
        metrics: {
          totalAnalyses: overview.totals.total_analyses,
          publicReports: overview.totals.public_reports,
          // v5-A8 (2026-05-10): 去 bot 后真实数据，与 totalAnalyses 并行展示
          validAnalyses: overview.totals.valid_analyses,
          validPublicReports: overview.totals.valid_public_reports,
          validAnalysesLast7d: overview.totals.valid_analyses_last_7d,
          totalEvents: overview.totals.total_events,
          validationPending: overview.totals.validation_pending,
        },
      },
      content: {
        severity: contentSeverity,
        summary: contentSeverity === 'critical'
          ? '内容草稿储备或补稿频率已经不足，持续发布能力存在明显风险。'
          : contentSeverity === 'warning'
            ? '内容系统仍可运行，但草稿储备、生成队列或补稿节奏偏弱。'
            : '内容系统储备、候选和发布节奏整体可控。',
        blockers: uniqueStrings(contentBlockers),
        healthySignals: uniqueStrings(contentHealthySignals),
        metrics: {
          publishedEntries: contentOps.metrics.publishedEntries,
          draftEntries: contentOps.metrics.draftEntries,
          generationQueueLength: contentOps.generationQueue.length,
          autoPublishCandidateCount: contentOps.autoPublishCandidates.length,
          quickStartRate: contentOps.metrics.quickStartRate,
        },
        scheduler: {
          draftReserveCount: scheduler.draftReserveCount,
          draftReserveTarget: scheduler.draftReserveTarget,
          needsDraftReplenishment: scheduler.needsDraftReplenishment,
          canPublishNow: scheduler.canPublishNow,
          publishWindowOpen: scheduler.publishWindowOpen,
          nextPublishSlotLabel: scheduler.nextPublishSlotLabel,
          lastPublishedAt: scheduler.lastPublishedAt,
          lastGeneratedAt: scheduler.lastGeneratedAt,
          minutesSinceLastPublish: scheduler.minutesSinceLastPublish,
          minutesSinceLastGenerate: scheduler.minutesSinceLastGenerate,
        },
      },
      knowledge: {
        severity: knowledgeSeverity,
        summary: knowledgeSeverity === 'critical'
          ? '知识采集或运行锁状态异常，需要先恢复采集链路。'
          : knowledgeSeverity === 'warning'
            ? '知识系统仍在工作，但采集新鲜度、已发布量或专题枢纽偏弱。'
            : '知识采集、发布候选和专题枢纽当前都处于可用状态。',
        blockers: uniqueStrings(knowledgeBlockers),
        healthySignals: uniqueStrings(knowledgeHealthySignals),
        metrics: {
          ...knowledgeOps.metrics,
          featuredTopicCount: knowledgeOps.featuredTopics.length,
          publishQueueLength: knowledgeOps.publishQueue.length,
        },
        acquisition: knowledgeOps.acquisition,
      },
    },
  };
}
