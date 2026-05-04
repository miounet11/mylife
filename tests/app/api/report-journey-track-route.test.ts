jest.mock('@/lib/user-utils', () => ({
  getOrCreateGuestUserId: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
  },
  reportJourneyEventOperations: {
    create: jest.fn(),
    listByUser: jest.fn(),
  },
}));

import { POST } from '@/app/api/report-journey/track/route';
import { fortuneOperations, reportJourneyEventOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

const mockedGetOrCreateGuestUserId = getOrCreateGuestUserId as jest.MockedFunction<typeof getOrCreateGuestUserId>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedReportJourneyEventOperations = reportJourneyEventOperations as jest.Mocked<typeof reportJourneyEventOperations>;

describe('POST /api/report-journey/track', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrCreateGuestUserId.mockResolvedValue('guest_user_report_journey');
  });

  it('records a report journey event for the report owner', async () => {
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_1',
      userId: 'guest_user_report_journey',
    } as any);

    const response = await POST(new Request('http://localhost/api/report-journey/track', {
      method: 'POST',
      body: JSON.stringify({
        reportId: 'report_1',
        workflowId: 'report-journey-v1',
        layerKey: 'category-report',
        actionTarget: 'report_journey_primary_category',
        category: 'career',
        toolSlug: 'career-role-fit',
        source: 'report_journey:report_1',
        href: '/tools/career-role-fit',
        meta: {
          page: '/result/report_1',
        },
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedReportJourneyEventOperations.create).toHaveBeenCalledTimes(1);
    expect(mockedReportJourneyEventOperations.create.mock.calls[0][0]).toEqual(expect.objectContaining({
      userId: 'guest_user_report_journey',
      reportId: 'report_1',
      workflowId: 'report-journey-v1',
      layerKey: 'category-report',
      actionTarget: 'report_journey_primary_category',
      category: 'career',
      toolSlug: 'career-role-fit',
    }));
  });

  it('rejects journey events for a report owned by another user', async () => {
    mockedFortuneOperations.getById.mockReturnValue({
      id: 'report_2',
      userId: 'other_user',
    } as any);

    const response = await POST(new Request('http://localhost/api/report-journey/track', {
      method: 'POST',
      body: JSON.stringify({
        reportId: 'report_2',
        workflowId: 'report-journey-v1',
        actionTarget: 'report_journey_deep_report',
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(mockedReportJourneyEventOperations.create).not.toHaveBeenCalled();
  });
});
