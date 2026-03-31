jest.mock('@/lib/user-utils', () => ({
  getOrCreateGuestUserId: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
    getByUserId: jest.fn(),
  },
  toolSessionOperations: {
    create: jest.fn(),
    listByUser: jest.fn(),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

import { POST } from '@/app/api/tools/run/route';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

const mockedGetOrCreateGuestUserId = getOrCreateGuestUserId as jest.MockedFunction<typeof getOrCreateGuestUserId>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;

describe('POST /api/tools/run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrCreateGuestUserId.mockResolvedValue('guest_test_user');
    mockedToolSessionOperations.listByUser.mockReturnValue([]);
  });

  test('rejects when the user has no report yet', async () => {
    mockedFortuneOperations.getByUserId.mockReturnValue([]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.redirectTo).toBe('/analyze');
  });

  test('creates a completed tool session when report exists', async () => {
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_1',
        userId: 'guest_test_user',
        name: '测试用户',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        timezone: 8,
        gender: 'female',
        bazi: {},
        fiveElements: {},
        tenGods: {},
        pattern: { type: '事业结构', strength: 'strong', quality: 'good', description: '事业' },
        fortune: {},
        advice: { overall: '先缩窄一个真实问题。' },
        evidence: {},
        analysis: {
          opening: '当前更适合先看事业节奏。',
          explanation: '不要一次推进太多事。',
        },
      } as any,
    ]);

    const response = await POST(new Request('http://localhost/api/tools/run', {
      method: 'POST',
      body: JSON.stringify({
        toolSlug: 'career-role-fit',
        note: '我在想是否换岗',
        attribution: {
          eventName: 'result_cta_clicked',
          page: '/knowledge/test',
          source: 'content_conversion_panel',
          target: 'content_primary_tool',
          timestamp: '2026-03-31T00:00:00.000Z',
        },
      }),
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.tool.slug).toBe('career-role-fit');
    expect(mockedToolSessionOperations.create).toHaveBeenCalledTimes(1);
    expect(mockedToolSessionOperations.create.mock.calls[0][0].meta.attribution).toEqual({
      eventName: 'result_cta_clicked',
      page: '/knowledge/test',
      source: 'content_conversion_panel',
      target: 'content_primary_tool',
      timestamp: '2026-03-31T00:00:00.000Z',
    });
  });
});
