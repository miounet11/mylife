jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  getAdminEmails: jest.fn(() => []),
  isProductionEnvironment: jest.fn(() => false),
}));

jest.mock('@/lib/database', () => ({
  db: {
    prepare: jest.fn(),
    transaction: jest.fn((fn: () => void) => fn),
  },
  userOperations: {
    create: jest.fn(),
    getById: jest.fn(),
    getByEmail: jest.fn(),
    update: jest.fn(),
  },
}));

import { cookies } from 'next/headers';
import { db, userOperations } from '@/lib/database';
import { verifyLoginCodeAndCreateSession } from '@/lib/auth';

const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockedDb = db as unknown as {
  prepare: jest.Mock;
  transaction: jest.Mock;
};
const mockedUserOperations = userOperations as jest.Mocked<typeof userOperations>;

describe('auth guest merge', () => {
  const cookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCookies.mockResolvedValue(cookieStore as any);
    mockedDb.transaction.mockImplementation((fn: () => void) => fn);
    mockedDb.prepare.mockImplementation((sql: string) => ({
      get: () => {
        if (sql.includes('SELECT * FROM auth_codes')) {
          return {
            id: 'auth_1',
            expires_at: '2999-01-01T00:00:00.000Z',
          };
        }

        return undefined;
      },
      run: jest.fn(),
    }));
    mockedUserOperations.getByEmail.mockReturnValue({
      id: 'user_existing',
      email: 'known@example.com',
    } as any);
    mockedUserOperations.getById.mockReturnValue({
      id: 'user_existing',
      name: 'known',
      email: 'known@example.com',
      role: 'user',
      email_verified: 1,
    } as any);
  });

  it('moves analytics and tool history rows from guest identity to verified user identity', async () => {
    const result = await verifyLoginCodeAndCreateSession({
      email: 'known@example.com',
      code: '123456',
      currentUserId: 'guest_merge_1',
    });

    expect(result.success).toBe(true);
    expect(mockedDb.transaction).toHaveBeenCalled();

    const preparedSqls = mockedDb.prepare.mock.calls.map(([sql]) => `${sql}`);
    expect(preparedSqls).toEqual(expect.arrayContaining([
      expect.stringContaining('UPDATE analytics_events SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE report_journey_events SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE tool_sessions SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE premium_service_requests SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE report_upgrade_jobs SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE report_monthly_digest_runs SET user_id = ? WHERE user_id = ?'),
      expect.stringContaining('UPDATE user_lifecycle_email_runs SET user_id = ? WHERE user_id = ?'),
    ]));
    expect(cookieStore.set).toHaveBeenCalledWith(
      'life_kline_session_id',
      'user_existing',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      })
    );
  });
});
