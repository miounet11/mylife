jest.mock('@/lib/database', () => ({
  eventOperations: {
    getByUserId: jest.fn(),
  },
  fortuneOperations: {
    getByUserId: jest.fn(),
  },
  userOperations: {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
}));

import { GET } from '@/app/api/profile/[id]/route';
import { eventOperations, fortuneOperations, userOperations } from '@/lib/database';

const mockedEventOperations = eventOperations as jest.Mocked<typeof eventOperations>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedUserOperations = userOperations as jest.Mocked<typeof userOperations>;

describe('GET /api/profile/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns normalized recent events in profile payload', async () => {
    mockedUserOperations.getById.mockReturnValue({
      id: 'user_profile_1',
      name: '测试用户',
    } as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      { id: 'report_1' } as any,
      { id: 'report_2' } as any,
    ]);
    mockedEventOperations.getByUserId.mockReturnValue([
      {
        id: 'evt_profile',
        user_id: 'user_profile_1',
        type: 'health',
        title: '体检复查',
        date: '2026-05-12',
        impact: 'neutral',
        reminder_enabled: 0,
        user_feedback: {
          wasAccurate: false,
        },
      } as any,
    ]);

    const response = await GET(new Request('http://localhost/api/profile/user_profile_1') as any, {
      params: Promise.resolve({ id: 'user_profile_1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.events).toEqual([
      expect.objectContaining({
        id: 'evt_profile',
        userId: 'user_profile_1',
        date: '2026-05-12',
        type: 'health',
        impact: 'neutral',
        reminderEnabled: false,
        userFeedback: {
          wasAccurate: false,
        },
      }),
    ]);
    expect(payload.data.fortunes).toHaveLength(2);
  });

  it('returns 404 when profile user is missing', async () => {
    mockedUserOperations.getById.mockReturnValue(null);

    const response = await GET(new Request('http://localhost/api/profile/missing') as any, {
      params: Promise.resolve({ id: 'missing' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.success).toBe(false);
  });
});
