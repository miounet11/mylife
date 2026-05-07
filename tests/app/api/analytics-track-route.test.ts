jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
  },
}));

jest.mock('@/lib/report-upgrade-jobs', () => ({
  enqueueReportUpgrade: jest.fn(),
}));

jest.mock('@/lib/user-utils', () => ({
  getCurrentUserId: jest.fn(),
  getOrCreateGuestUserId: jest.fn(),
}));

import { POST } from '@/app/api/analytics/track/route';
import { trackServerEvent } from '@/lib/analytics';
import { fortuneOperations } from '@/lib/database';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { getCurrentUserId, getOrCreateGuestUserId } from '@/lib/user-utils';

const mockedTrackServerEvent = trackServerEvent as jest.MockedFunction<typeof trackServerEvent>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedEnqueueReportUpgrade = enqueueReportUpgrade as jest.MockedFunction<typeof enqueueReportUpgrade>;
const mockedGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockedGetOrCreateGuestUserId = getOrCreateGuestUserId as jest.MockedFunction<typeof getOrCreateGuestUserId>;

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/analytics/track', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUserId.mockResolvedValue(null);
    mockedFortuneOperations.getById.mockReturnValue(null);
  });

  it('tracks public page events without creating a guest user', async () => {
    const response = await POST(createRequest({
      eventName: 'home_page_viewed',
      page: '/',
      meta: { surfaceKey: 'landing' },
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedGetCurrentUserId).toHaveBeenCalledTimes(1);
    expect(mockedGetOrCreateGuestUserId).not.toHaveBeenCalled();
    expect(mockedTrackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      userId: undefined,
      sessionId: '203.0.113.10',
      eventName: 'home_page_viewed',
      page: '/',
    }));
  });

  it('enqueues a viewed real basic report for background upgrade', async () => {
    mockedGetCurrentUserId.mockResolvedValue('guest_report_owner');
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_real_basic',
      userId: 'guest_report_owner',
      name: '李嘉文',
      reportVersion: 'v3',
      analysis: {
        llmUsed: false,
        qualityAudit: {
          overallScore: 78,
          grade: 'B',
          deliveryTier: 'basic',
          targetAchieved: false,
        },
      },
    } as any);

    const response = await POST(createRequest({
      eventName: 'report_viewed',
      page: '/result/report_real_basic',
      meta: {
        reportId: 'report_real_basic',
        source: 'direct',
      },
    }));

    expect(response.status).toBe(200);
    expect(mockedEnqueueReportUpgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'real_user_report_viewed',
        report: expect.objectContaining({
          id: 'report_real_basic',
        }),
        meta: expect.objectContaining({
          realUserPriority: true,
          viewedFromAnalytics: true,
          deliveryTier: 'basic',
          llmUsed: false,
        }),
      })
    );
  });

  it('does not enqueue likely test report views', async () => {
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_test',
      name: '案例1',
      analysis: {
        llmUsed: false,
        qualityAudit: {
          deliveryTier: 'basic',
          targetAchieved: false,
        },
      },
    } as any);

    const response = await POST(createRequest({
      eventName: 'report_viewed',
      page: '/result/report_test',
      meta: {
        reportId: 'report_test',
      },
    }));

    expect(response.status).toBe(200);
    expect(mockedEnqueueReportUpgrade).not.toHaveBeenCalled();
  });
});
