jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    getOverview: jest.fn(),
  },
  reportJourneyEventOperations: {
    getAnalyticsSnapshot: jest.fn(),
  },
}));

jest.mock('@/lib/knowledge-ops', () => ({
  getKnowledgeOpsSnapshot: jest.fn(),
}));

jest.mock('@/lib/product-experience-analytics', () => ({
  getProductExperienceAnalyticsSnapshot: jest.fn(),
}));

import { GET } from '@/app/api/admin/analytics/overview/route';
import { getAuthSession } from '@/lib/auth';
import { analyticsOperations, reportJourneyEventOperations } from '@/lib/database';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';
import { getProductExperienceAnalyticsSnapshot } from '@/lib/product-experience-analytics';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetOverview = analyticsOperations.getOverview as jest.MockedFunction<typeof analyticsOperations.getOverview>;
const mockedGetReportJourneyAnalytics = reportJourneyEventOperations.getAnalyticsSnapshot as jest.MockedFunction<typeof reportJourneyEventOperations.getAnalyticsSnapshot>;
const mockedGetKnowledgeOpsSnapshot = getKnowledgeOpsSnapshot as jest.MockedFunction<typeof getKnowledgeOpsSnapshot>;
const mockedGetProductExperienceAnalyticsSnapshot = getProductExperienceAnalyticsSnapshot as jest.MockedFunction<typeof getProductExperienceAnalyticsSnapshot>;

describe('GET /api/admin/analytics/overview', () => {
  beforeEach(() => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin_test_user',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        emailVerified: true,
      },
    });

    mockedGetOverview.mockReturnValue({
      totals: {
        total_analyses: 10,
        analyses_last_7d: 4,
        public_reports: 5,
        chat_messages: 9,
        active_subscribers: 3,
        total_events: 8,
        result_report_linked_events: 2,
        chat_sourced_events: 1,
        validation_accurate: 2,
        validation_drift: 1,
        validation_pending: 3,
        total_tracked_events: 20,
        tracked_events_last_7d: 11,
      },
      pendingValidationBuckets: {
        overdue: 1,
        upcoming: 2,
        driftNeedsNotes: 0,
        driftReadyForCorrection: 1,
      },
      driftReasonBreakdown: [
        { key: 'timing_window', label: '时机偏差', count: 1, share: 100, examples: ['窗口提前'] },
      ],
      reportVersionBreakdown: [
        { version: 'v2', count: 10, share: 100 },
      ],
      journeyFunnel: [
        { key: 'report_viewed', label: '打开结果页', count: 5 },
        { key: 'chat_message_sent', label: '发送聊天消息', count: 2 },
      ],
      reasoningModeBreakdown: [
        { mode: 'deterministic-expert', count: 8, share: 80 },
      ],
      chatActionBreakdown: [
        { action: 'ask', label: '直接提问', count: 2, share: 100 },
      ],
    } as ReturnType<typeof analyticsOperations.getOverview>);

    mockedGetKnowledgeOpsSnapshot.mockReturnValue({
      metrics: {
        publishedKnowledgeEntries: 12,
        draftKnowledgeEntries: 4,
        publishedSynthesisEntries: 8,
        draftSynthesisEntries: 3,
        publishCandidateCount: 2,
        topicHubCount: 6,
        flagshipCount: 2,
        homepageEligibleCount: 5,
      },
      acquisition: {
        status: 'success',
        lastRunAt: '2026-03-15T00:00:00.000Z',
        durationMs: 2400,
        lock: {
          present: false,
          stale: false,
          ageMs: 0,
          ttlMs: 2_700_000,
        },
      },
      featuredTopics: [
        {
          topicName: '命理基础',
          topicSlug: 'ming-li-ji-chu',
          entryCount: 5,
          synthesisTypes: ['topic-overview'],
        },
      ],
      publishQueue: [
        {
          slug: 'topic-overview-a',
          title: '主题总览 A',
          synthesisType: 'topic-overview',
          qualityScore: 92,
        },
      ],
    });

    mockedGetReportJourneyAnalytics.mockReturnValue({
      totalEvents: 3,
      uniqueReports: 2,
      uniqueUsers: 2,
      funnel: [
        { key: 'deep-report', label: '深入报告', count: 1, share: 33 },
        { key: 'category-report', label: '专项细分', count: 2, share: 67 },
      ],
      categories: [
        { category: 'career', count: 2, share: 67 },
      ],
      tools: [
        { toolSlug: 'career-role-fit', count: 2, share: 67 },
      ],
      latestEvents: [],
    });

    mockedGetProductExperienceAnalyticsSnapshot.mockReturnValue({
      days: 30,
      generatedAt: '2026-05-04T00:00:00.000Z',
      rows: [
        {
          surface: 'home',
          label: '入口页',
          successMetric: '测算表单开始率、首份报告生成率、老用户恢复路径点击率。',
          views: 10,
          primaryActions: 3,
          secondaryActions: 1,
          nextStepActions: 2,
          totalActions: 6,
          conversionRate: 30,
          health: 'healthy',
          action: '当前路径已能完成页面角色。',
          latestAt: '2026-05-03T00:00:00.000Z',
        },
      ],
      totals: {
        surfaces: 1,
        views: 10,
        primaryActions: 3,
        totalActions: 6,
        healthy: 1,
        warning: 0,
        critical: 0,
        neutral: 0,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics overview with knowledge ops and report journey snapshots', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.knowledgeOps.metrics.publishedKnowledgeEntries).toBe(12);
    expect(payload.data.reportJourney.totalEvents).toBe(3);
    expect(payload.data.reportJourney.funnel[0].key).toBe('deep-report');
    expect(payload.data.productExperience.rows[0].surface).toBe('home');
    expect(payload.data.productExperience.totals.healthy).toBe(1);
    expect(payload.data.insights.operatingInsight.headline).toContain('验证');
    expect(payload.data.insights.actionItems).toHaveLength(4);
    expect(mockedGetKnowledgeOpsSnapshot).toHaveBeenCalledTimes(1);
    expect(mockedGetReportJourneyAnalytics).toHaveBeenCalledWith(30);
    expect(mockedGetProductExperienceAnalyticsSnapshot).toHaveBeenCalledWith(30);
  });

  it('rejects non-admin requests', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: true,
      user: {
        id: 'normal_user',
        name: 'Normal User',
        email: 'user@example.com',
        role: 'user',
        emailVerified: true,
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(mockedGetOverview).not.toHaveBeenCalled();
    expect(mockedGetKnowledgeOpsSnapshot).not.toHaveBeenCalled();
    expect(mockedGetReportJourneyAnalytics).not.toHaveBeenCalled();
    expect(mockedGetProductExperienceAnalyticsSnapshot).not.toHaveBeenCalled();
  });
});
