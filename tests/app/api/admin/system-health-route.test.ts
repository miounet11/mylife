jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/system-ops', () => ({
  getSystemOpsSnapshot: jest.fn(),
}));

import { GET } from '@/app/api/admin/system/health/route';
import { getAuthSession } from '@/lib/auth';
import { getSystemOpsSnapshot } from '@/lib/system-ops';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetSystemOpsSnapshot = getSystemOpsSnapshot as jest.MockedFunction<typeof getSystemOpsSnapshot>;

describe('GET /api/admin/system/health', () => {
  const originalToken = process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN;

  beforeEach(() => {
    process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN = 'knowledge-token';
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'admin_test_user',
        name: 'Admin Test',
        email: 'admin@example.com',
        role: 'admin',
        emailVerified: true,
      },
    });
    mockedGetSystemOpsSnapshot.mockReturnValue({
      severity: 'healthy',
      title: 'stable',
      summary: 'stable',
      checkedAt: '2026-03-15T00:00:00.000Z',
      blockers: [],
      healthySignals: ['ok'],
      services: {
        analytics: {
          severity: 'healthy',
          title: 'analytics',
          summary: 'ok',
          updatedAt: '2026-03-15T00:00:00.000Z',
          blockers: [],
          healthySignals: ['ok'],
          metrics: {
            totalAnalyses: 1,
            publicReports: 1,
            validAnalyses: 1,
            validPublicReports: 1,
            validAnalysesLast7d: 1,
            totalEvents: 1,
            validationPending: 0,
          },
        },
        content: {
          severity: 'healthy',
          summary: 'ok',
          blockers: [],
          healthySignals: ['ok'],
          metrics: {
            publishedEntries: 1,
            draftEntries: 1,
            generationQueueLength: 1,
            autoPublishCandidateCount: 1,
            quickStartRate: 10,
          },
          scheduler: {
            draftReserveCount: 1,
            draftReserveTarget: 1,
            needsDraftReplenishment: false,
            canPublishNow: true,
            publishWindowOpen: true,
            nextPublishSlotLabel: '15:00',
          },
        },
        knowledge: {
          severity: 'healthy',
          summary: 'ok',
          blockers: [],
          healthySignals: ['ok'],
          metrics: {
            publishedKnowledgeEntries: 1,
            draftKnowledgeEntries: 1,
            publishedSynthesisEntries: 1,
            draftSynthesisEntries: 1,
            publishCandidateCount: 1,
            topicHubCount: 1,
            flagshipCount: 1,
            homepageEligibleCount: 1,
            featuredTopicCount: 1,
            publishQueueLength: 1,
          },
          acquisition: {
            status: 'success',
            lastRunAt: '2026-03-15T00:00:00.000Z',
            lock: {
              present: false,
              stale: false,
              ageMs: 0,
              ttlMs: 2_700_000,
            },
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN = originalToken;
  });

  it('returns a cheap system snapshot for admins', async () => {
    const response = await GET(new Request('http://localhost/api/admin/system/health') as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.snapshot.severity).toBe('healthy');
    expect(mockedGetSystemOpsSnapshot).toHaveBeenCalledTimes(1);
    expect(mockedGetSystemOpsSnapshot).toHaveBeenCalledWith({
      mode: 'summary',
      modelWindowMinutes: undefined,
    });
  });

  it('passes model window minutes to the system snapshot', async () => {
    const response = await GET(new Request('http://localhost/api/admin/system/health?modelWindowMinutes=10') as any);

    expect(response.status).toBe(200);
    expect(mockedGetSystemOpsSnapshot).toHaveBeenCalledWith({
      mode: 'summary',
      modelWindowMinutes: 10,
    });
  });

  it('allows token-based access when no admin session is present', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    });

    const response = await GET(new Request('http://localhost/api/admin/system/health', {
      headers: {
        'x-system-health-token': 'knowledge-token',
      },
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  it('rejects unauthorized requests', async () => {
    mockedGetAuthSession.mockResolvedValueOnce({
      authenticated: false,
      user: null,
    });

    const response = await GET(new Request('http://localhost/api/admin/system/health') as any);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
  });
});
