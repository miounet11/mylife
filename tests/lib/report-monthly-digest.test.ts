const mockEmailSubscriptionListActiveByTags = jest.fn();
const mockFortuneGetByUserId = jest.fn();
const mockReportMonthlyDigestRunGetByCycleAndEmail = jest.fn();
const mockReportMonthlyDigestRunCreate = jest.fn();
const mockSystemLockAcquire = jest.fn();
const mockSystemLockRelease = jest.fn();
const mockUserGetByEmail = jest.fn();

jest.mock('@/lib/database', () => ({
  emailSubscriptionOperations: {
    listActiveByTags: (...args: unknown[]) => mockEmailSubscriptionListActiveByTags(...args),
  },
  fortuneOperations: {
    getByUserId: (...args: unknown[]) => mockFortuneGetByUserId(...args),
  },
  reportMonthlyDigestRunOperations: {
    getByCycleAndEmail: (...args: unknown[]) => mockReportMonthlyDigestRunGetByCycleAndEmail(...args),
    create: (...args: unknown[]) => mockReportMonthlyDigestRunCreate(...args),
  },
  systemLockOperations: {
    acquire: (...args: unknown[]) => mockSystemLockAcquire(...args),
    release: (...args: unknown[]) => mockSystemLockRelease(...args),
  },
  userOperations: {
    getByEmail: (...args: unknown[]) => mockUserGetByEmail(...args),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  getReportMonthlyDigestBatchSize: jest.fn(() => 20),
  getReportMonthlyDigestTimezoneOffsetMinutes: jest.fn(() => 480),
}));

jest.mock('@/lib/email', () => ({
  isEmailDeliveryConfigured: jest.fn(() => true),
  sendMonthlyReportDigestEmail: jest.fn(() => Promise.resolve({ success: true, message: 'ok' })),
}));

jest.mock('@/lib/report-v2', () => ({
  buildMonthlyWindows: jest.fn(() => [
    { label: '一月', theme: '整理', status: 'steady' },
    { label: '二月', theme: '推进', status: 'active' },
    { label: '三月', theme: '复盘', status: 'review' },
  ]),
  buildScenarioViews: jest.fn(() => [
    { summary: '本月适合围绕长期节奏做安排。' },
  ]),
}));

jest.mock('@/lib/subscription-backfill', () => ({
  backfillEmailSubscriptionsFromUsers: jest.fn(() => ({ scanned: 0, createdOrUpdated: 0 })),
}));

import { sendMonthlyReportDigestEmail } from '@/lib/email';
import { runReportMonthlyDigestCycle } from '@/lib/report-monthly-digest';

const mockedSendMonthlyReportDigestEmail = sendMonthlyReportDigestEmail as jest.MockedFunction<typeof sendMonthlyReportDigestEmail>;

function buildReport(id: string) {
  return {
    id,
    userId: `user_${id}`,
    name: '月报用户',
    bazi: {},
    advice: {},
    fiveElements: {},
    pattern: { type: '平衡格', description: '结构稳定' },
    fortune: {},
    klineData: null,
    dayun: [],
    shenSha: [],
    analysis: {
      explanation: '这是一段用于月报摘要的稳定分析。',
      qualityAudit: {
        overallScore: 92,
        grade: 'A',
      },
    },
  };
}

describe('report monthly digest cycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSystemLockAcquire.mockReturnValue(true);
    mockSystemLockRelease.mockReturnValue({ changes: 1 });
    mockReportMonthlyDigestRunGetByCycleAndEmail.mockReturnValue(null);
    mockReportMonthlyDigestRunCreate.mockReturnValue({ changes: 1 });
    mockUserGetByEmail.mockImplementation((email: string) => ({ id: `user_${email}`, name: '月报用户' }));
    mockFortuneGetByUserId.mockImplementation((userId: string) => [buildReport(`report_${userId}`)]);
    mockedSendMonthlyReportDigestEmail.mockResolvedValue({ success: true, message: 'ok' } as any);
  });

  it('skips overlapping cycles before scanning subscriptions', async () => {
    mockSystemLockAcquire.mockReturnValue(false);
    mockEmailSubscriptionListActiveByTags.mockReturnValue([
      { email: 'locked@example.com' },
    ] as any);

    const result = await runReportMonthlyDigestCycle({
      trigger: 'cron',
      cycleDate: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(result.reason).toBe('already_running');
    expect(result.sentCount).toBe(0);
    expect(mockEmailSubscriptionListActiveByTags).not.toHaveBeenCalled();
    expect(mockedSendMonthlyReportDigestEmail).not.toHaveBeenCalled();
    expect(mockSystemLockRelease).not.toHaveBeenCalled();
  });

  it('clamps oversized batches to avoid long cron monopolies', async () => {
    mockEmailSubscriptionListActiveByTags.mockReturnValue(
      Array.from({ length: 80 }, (_, index) => ({ email: `user-${index}@example.com` })) as any
    );

    const result = await runReportMonthlyDigestCycle({
      trigger: 'manual',
      batchSize: 1000,
      cycleDate: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(mockEmailSubscriptionListActiveByTags).toHaveBeenCalledWith(
      expect.any(Array),
      200
    );
    expect(result.sentCount).toBe(50);
    expect(mockReportMonthlyDigestRunCreate).toHaveBeenCalledTimes(50);
    expect(mockSystemLockRelease).toHaveBeenCalledTimes(1);
  });
});
