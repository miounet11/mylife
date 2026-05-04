jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/user-utils', () => ({
  getCurrentUserId: jest.fn(),
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
import { getCurrentUserId } from '@/lib/user-utils';

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockedEventOperations = eventOperations as jest.Mocked<typeof eventOperations>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;
const mockedUserOperations = userOperations as jest.Mocked<typeof userOperations>;

describe('GET /api/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUserId.mockResolvedValue(null);
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

  it('returns current guest session data when not authenticated', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValue('guest_history_1');
    mockedUserOperations.getById.mockReturnValue({
      id: 'guest_history_1',
      name: '游客用户',
    } as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      { id: 'report_guest_1', userId: 'guest_history_1' } as any,
    ]);
    mockedEventOperations.getByUserId.mockReturnValue([]);
    mockedToolSessionOperations.listByUser.mockReturnValue([
      { id: 'tool_guest_1', userId: 'guest_history_1' } as any,
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.user.id).toBe('guest_history_1');
    expect(payload.fortunes).toEqual([{ id: 'report_guest_1', userId: 'guest_history_1' }]);
    expect(payload.toolSessions).toEqual([{ id: 'tool_guest_1', userId: 'guest_history_1' }]);
    expect(payload.events).toEqual([]);
  });

  it('returns empty normalized collections when no session exists', async () => {
    mockedGetAuthSession.mockResolvedValue({
      authenticated: false,
      user: null,
    } as any);
    mockedGetCurrentUserId.mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.fortunes).toEqual([]);
    expect(payload.toolSessions).toEqual([]);
  });
});
