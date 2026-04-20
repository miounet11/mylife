jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  eventOperations: {
    getByUserId: jest.fn(),
  },
  fortuneOperations: {
    getByUserId: jest.fn(),
  },
  toolSessionOperations: {
    listByUser: jest.fn(),
  },
  userOperations: {
    getById: jest.fn(),
  },
}));

import { GET } from '@/app/api/history/route';
import { getAuthSession } from '@/lib/auth';
import { eventOperations, fortuneOperations, toolSessionOperations, userOperations } from '@/lib/database';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedEventOperations = eventOperations as jest.Mocked<typeof eventOperations>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;
const mockedUserOperations = userOperations as jest.Mocked<typeof userOperations>;

describe('GET /api/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns normalized events for authenticated users', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'user_history_1',
      },
    } as any);
    mockedUserOperations.getById.mockReturnValue({
      id: 'user_history_1',
      name: '测试用户',
    } as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      { id: 'report_1' } as any,
    ]);
    mockedEventOperations.getByUserId.mockReturnValue([
      {
        id: 'evt_history',
        user_id: 'user_history_1',
        type: 'career',
        title: '项目上线',
        date: '2026-04-20',
        impact: 'positive',
        reminder_enabled: 1,
        reminder_advance_days: 3,
        reminder_method: 'app',
        fortune_analysis: {
          reportId: 'report_1',
        },
      } as any,
    ]);
    mockedToolSessionOperations.listByUser.mockReturnValue([]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.events).toEqual([
      expect.objectContaining({
        id: 'evt_history',
        userId: 'user_history_1',
        date: '2026-04-20',
        reminderEnabled: true,
        reminderAdvanceDays: 3,
        reminderMethod: 'app',
      }),
    ]);
  });

  it('returns empty normalized collections when not authenticated', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: false,
      user: null,
    } as any);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.events).toEqual([]);
    expect(payload.fortunes).toEqual([]);
    expect(payload.toolSessions).toEqual([]);
  });
});
