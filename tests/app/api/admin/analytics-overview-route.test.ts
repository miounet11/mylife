jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    getOverview: jest.fn(),
  },
}));

jest.mock('@/lib/knowledge-ops', () => ({
  getKnowledgeOpsSnapshot: jest.fn(),
}));

import { GET } from '@/app/api/admin/analytics/overview/route';
import { getAuthSession } from '@/lib/auth';
import { analyticsOperations } from '@/lib/database';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetOverview = analyticsOperations.getOverview as jest.MockedFunction<typeof analyticsOperations.getOverview>;
const mockedGetKnowledgeOpsSnapshot = getKnowledgeOpsSnapshot as jest.MockedFunction<typeof getKnowledgeOpsSnapshot>;

describe('GET /api/admin/analytics/overview', () => {
  beforeEach(() => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin_test_user',
        email: 'admin@example.com',
        role: 'admin',
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
        { label: '时机偏差', count: 1, share: 100 },
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
    });

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics overview with knowledge ops snapshot', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.knowledgeOps.metrics.publishedKnowledgeEntries).toBe(12);
    expect(payload.data.insights.operatingInsight.headline).toContain('验证');
    expect(payload.data.insights.actionItems).toHaveLength(4);
    expect(mockedGetKnowledgeOpsSnapshot).toHaveBeenCalledTimes(1);
  });

  it('rejects non-admin requests', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: true,
      user: {
        id: 'normal_user',
        email: 'user@example.com',
        role: 'user',
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(mockedGetOverview).not.toHaveBeenCalled();
    expect(mockedGetKnowledgeOpsSnapshot).not.toHaveBeenCalled();
  });
});
