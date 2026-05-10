jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    getOverview: jest.fn(),
    getSystemHealthSummary: jest.fn(),
  },
}));

jest.mock('@/lib/content-ops', () => ({
  getContentOpsSnapshot: jest.fn(),
  getContentSchedulerOverview: jest.fn(),
}));

jest.mock('@/lib/knowledge-ops', () => ({
  getKnowledgeOpsSnapshot: jest.fn(),
}));

jest.mock('@/lib/knowledge-runtime-state', () => ({
  readKnowledgeAcquisitionLockStatus: jest.fn(() => ({
    lock: null,
    stale: false,
    ageMs: 0,
  })),
  readKnowledgeAcquisitionSnapshot: jest.fn(() => ({
    status: 'success',
    finishedAt: new Date().toISOString(),
    durationMs: 1200,
    updatedAt: new Date().toISOString(),
  })),
}));

import { analyticsOperations } from '@/lib/database';
import { getContentOpsSnapshot, getContentSchedulerOverview } from '@/lib/content-ops';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';
import { getSystemOpsSnapshot } from '@/lib/system-ops';

const mockedGetOverview = analyticsOperations.getOverview as jest.MockedFunction<typeof analyticsOperations.getOverview>;
const mockedGetSystemHealthSummary = analyticsOperations.getSystemHealthSummary as jest.MockedFunction<typeof analyticsOperations.getSystemHealthSummary>;
const mockedGetContentOpsSnapshot = getContentOpsSnapshot as jest.MockedFunction<typeof getContentOpsSnapshot>;
const mockedGetContentSchedulerOverview = getContentSchedulerOverview as jest.MockedFunction<typeof getContentSchedulerOverview>;
const mockedGetKnowledgeOpsSnapshot = getKnowledgeOpsSnapshot as jest.MockedFunction<typeof getKnowledgeOpsSnapshot>;

describe('system ops snapshot', () => {
  const baseOverview = {
    totals: {
      total_analyses: 20,
      analyses_last_7d: 5,
      public_reports: 8,
      valid_analyses: 18,
      valid_public_reports: 7,
      valid_analyses_last_7d: 4,
      chat_messages: 18,
      active_subscribers: 4,
      total_events: 12,
      result_report_linked_events: 4,
      chat_sourced_events: 2,
      validation_accurate: 3,
      validation_drift: 1,
      validation_pending: 2,
      total_tracked_events: 60,
      tracked_events_last_7d: 16,
    },
    pendingValidationBuckets: {
      overdue: 0,
      upcoming: 2,
      driftNeedsNotes: 0,
      driftReadyForCorrection: 0,
    },
    driftReasonBreakdown: [],
    reportVersionBreakdown: [],
    journeyFunnel: [],
    reasoningModeBreakdown: [],
    chatActionBreakdown: [],
    systemHealth: {
      severity: 'healthy',
      title: '当前系统整体健康，主要链路可闭环运行',
      summary: '模型、邮件、反馈和转化链路目前都没有明显硬阻塞。',
      updatedAt: '2026-03-15T05:00:00.000Z',
      blockers: [],
      healthySignals: ['验证闭环队列当前可控。'],
      cards: [],
    },
  };
  const baseContentSnapshot = {
    metrics: {
      publishedEntries: 10,
      draftEntries: 12,
      pageViews30d: 100,
      clicks30d: 18,
      quickStarts30d: 9,
      quickStartRate: 9,
    },
    topSurfaces: [],
    clusterCoverage: [],
    generationQueue: [
      { key: 'career', title: '职业', topic: '职业', angle: '职业', contentType: 'knowledge', keywords: [], reason: 'a', priorityScore: 90, audience: 'user', sourceType: 'cluster' },
    ],
    autoPublishCandidates: [
      { id: 'draft_1', title: 'draft', slug: 'draft', source: 'agent-llm:auto-ops', score: 190 },
    ],
    contentPerformance: [],
    radarSourcePerformance: [],
  };
  const baseScheduler = {
    localNow: '2026-03-15 13:00',
    publishHours: [10, 15, 20],
    dailyPublishLimit: 3,
    publishedToday: 1,
    draftReserveTarget: 8,
    draftReserveCount: 12,
    needsDraftReplenishment: false,
    publishWindowOpen: true,
    canPublishNow: true,
    nextPublishSlotLabel: '15:00',
    lastPublishedAt: '2026-03-15T04:00:00.000Z',
    lastGeneratedAt: '2026-03-15T03:00:00.000Z',
    minutesSinceLastPublish: 60,
    minutesSinceLastGenerate: 120,
    recentRuns: [],
  };
  const baseKnowledgeSnapshot = {
    metrics: {
      publishedKnowledgeEntries: 24,
      draftKnowledgeEntries: 8,
      publishedSynthesisEntries: 16,
      draftSynthesisEntries: 5,
      publishCandidateCount: 3,
      topicHubCount: 6,
      flagshipCount: 2,
      homepageEligibleCount: 5,
    },
    acquisition: {
      status: 'success',
      lastRunAt: new Date().toISOString(),
      durationMs: 2200,
      lock: {
        present: false,
        stale: false,
        ageMs: 0,
        ttlMs: 2_700_000,
      },
    },
    featuredTopics: [],
    publishQueue: [
      { slug: 'topic-a', title: '主题 A', synthesisType: 'topic-overview', qualityScore: 92 },
    ],
  };

  beforeEach(() => {
    mockedGetOverview.mockReturnValue(baseOverview);
    mockedGetSystemHealthSummary.mockReturnValue({
      totals: baseOverview.totals,
      systemHealth: baseOverview.systemHealth,
    });
    mockedGetContentOpsSnapshot.mockReturnValue(baseContentSnapshot);
    mockedGetContentSchedulerOverview.mockReturnValue(baseScheduler);
    mockedGetKnowledgeOpsSnapshot.mockReturnValue(baseKnowledgeSnapshot);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds a healthy aggregate snapshot when all systems are in range', () => {
    const snapshot = getSystemOpsSnapshot();

    expect(snapshot.severity).toBe('healthy');
    expect(snapshot.services.analytics.severity).toBe('healthy');
    expect(snapshot.services.content.metrics.generationQueueLength).toBe(1);
    expect(snapshot.services.knowledge.metrics.publishQueueLength).toBe(1);
    expect(snapshot.healthySignals.length).toBeGreaterThan(0);
  });

  it('escalates to critical when content reserves collapse and knowledge runtime is stale', () => {
    mockedGetOverview.mockReturnValueOnce({
      ...baseOverview,
      systemHealth: {
        severity: 'warning',
        title: '当前系统可运行，但有若干卡点正在拖慢体验与转化',
        summary: '系统可继续跑，但已经出现局部故障或明显流失。',
        updatedAt: '2026-03-15T05:00:00.000Z',
        blockers: ['还有 2 条验证/纠偏待处理，真实反馈闭环还不够快。'],
        healthySignals: [],
        cards: [],
      },
    });
    mockedGetContentOpsSnapshot.mockReturnValueOnce({
      ...baseContentSnapshot,
      generationQueue: [],
      autoPublishCandidates: [],
    });
    mockedGetContentSchedulerOverview.mockReturnValueOnce({
      ...baseScheduler,
      draftReserveCount: 0,
      needsDraftReplenishment: true,
      minutesSinceLastGenerate: 600,
    });
    mockedGetKnowledgeOpsSnapshot.mockReturnValueOnce({
      ...baseKnowledgeSnapshot,
      metrics: {
        ...baseKnowledgeSnapshot.metrics,
        publishedKnowledgeEntries: 0,
        topicHubCount: 0,
      },
      acquisition: {
        status: 'error',
        lastRunAt: '2026-03-14T00:00:00.000Z',
        error: 'upstream timeout',
        lock: {
          present: true,
          stale: true,
          ageMs: 3_600_000,
          ttlMs: 2_700_000,
        },
      },
    });

    const snapshot = getSystemOpsSnapshot({
      knowledgeRunStaleMs: 30 * 60 * 1000,
      contentGenerateStaleMinutes: 300,
    });

    expect(snapshot.severity).toBe('critical');
    expect(snapshot.services.content.severity).toBe('critical');
    expect(snapshot.services.knowledge.severity).toBe('critical');
    expect(snapshot.blockers.some((item) => item.includes('草稿储备'))).toBe(true);
    expect(snapshot.blockers.some((item) => item.includes('知识采集锁'))).toBe(true);
  });

  it('escalates to critical when content publishing stalls despite available drafts', () => {
    mockedGetContentSchedulerOverview.mockReturnValueOnce({
      ...baseScheduler,
      draftReserveCount: 120,
      needsDraftReplenishment: false,
      minutesSinceLastPublish: 2400,
      minutesSinceLastGenerate: 120,
    });

    const snapshot = getSystemOpsSnapshot({
      contentPublishStaleMinutes: 1440,
    });

    expect(snapshot.severity).toBe('critical');
    expect(snapshot.services.content.severity).toBe('critical');
    expect(snapshot.services.content.blockers.some((item) => item.includes('内容发布已超过 2400 分钟没有推进'))).toBe(true);
  });

  it('uses lightweight summary mode without loading full analytics, content, or knowledge snapshots', () => {
    const snapshot = getSystemOpsSnapshot({ mode: 'summary' });

    expect(snapshot.severity).toBe('healthy');
    expect(mockedGetOverview).not.toHaveBeenCalled();
    expect(mockedGetSystemHealthSummary).toHaveBeenCalledTimes(1);
    expect(mockedGetContentOpsSnapshot).not.toHaveBeenCalled();
    expect(mockedGetKnowledgeOpsSnapshot).not.toHaveBeenCalled();
    expect(mockedGetContentSchedulerOverview).toHaveBeenCalledTimes(1);
  });
});
