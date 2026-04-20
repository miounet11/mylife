jest.mock('@/lib/user-utils', () => ({
  getOrCreateGuestUserId: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  eventOperations: {
    getById: jest.fn(),
    getByUserId: jest.fn(),
    getByDateRange: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/report-feedback-loop', () => ({
  syncReportFeedbackLoop: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

import { GET, PATCH } from '@/app/api/events/route';
import { eventOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

const mockedGetOrCreateGuestUserId = getOrCreateGuestUserId as jest.MockedFunction<typeof getOrCreateGuestUserId>;
const mockedEventOperations = eventOperations as jest.Mocked<typeof eventOperations>;

describe('events route normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrCreateGuestUserId.mockResolvedValue('guest_user_1');
  });

  it('returns normalized event payloads from GET', async () => {
    mockedEventOperations.getByUserId.mockReturnValue([
      {
        id: 'evt_1',
        userId: 'guest_user_1',
        type: 'career',
        title: '季度评估',
        date: '2026-04-20',
        impact: 'positive',
        reminderEnabled: true,
        reminderAdvanceDays: 5,
        reminderMethod: 'app',
        fortuneAnalysis: {
          reportId: 'report_1',
        },
      } as any,
    ]);

    const response = await GET(new Request('http://localhost/api/events') as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.events).toEqual([
      expect.objectContaining({
        id: 'evt_1',
        date: '2026-04-20',
        reminderEnabled: true,
        reminderAdvanceDays: 5,
        reminderMethod: 'app',
        fortuneAnalysis: {
          reportId: 'report_1',
        },
      }),
    ]);
  });

  it('returns normalized event payloads from PATCH writes', async () => {
    mockedEventOperations.getById
      .mockReturnValueOnce({
        id: 'evt_patch',
        userId: 'guest_user_1',
        type: 'career',
        title: '初始事件',
        date: '2026-04-20',
        impact: 'neutral',
        fortuneAnalysis: {
          reportId: 'report_1',
        },
      } as any)
      .mockReturnValueOnce({
        id: 'evt_patch',
        user_id: 'guest_user_1',
        type: 'career',
        title: '更新后的事件',
        date: '2026-04-20',
        impact: 'positive',
        reminder_enabled: 1,
        reminder_advance_days: 7,
        reminder_method: 'email',
        fortune_analysis: {
          reportId: 'report_1',
        },
        user_feedback: {
          wasAccurate: true,
        },
      } as any);

    const response = await PATCH(new Request('http://localhost/api/events', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'evt_patch',
        title: '更新后的事件',
        impact: 'positive',
        reminderEnabled: true,
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(expect.objectContaining({
      id: 'evt_patch',
      userId: 'guest_user_1',
      date: '2026-04-20',
      impact: 'positive',
      reminderEnabled: true,
      reminderAdvanceDays: 7,
      reminderMethod: 'email',
      userFeedback: {
        wasAccurate: true,
      },
    }));
  });
});
