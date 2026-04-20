jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    rawQuery: jest.fn(),
  },
  eventOperations: {
    getByUserId: jest.fn(),
  },
  fortuneOperations: {
    getByUserId: jest.fn(),
  },
  questionOperations: {
    getByUserId: jest.fn(),
  },
  toolSessionOperations: {
    listByUser: jest.fn(),
  },
  userLifecycleEmailRunOperations: {
    getByStageAndEmail: jest.fn(),
    create: jest.fn(),
  },
  userOperations: {
    listWithEmail: jest.fn(),
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackServerEvent: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  isEmailDeliveryConfigured: jest.fn(() => true),
  deliverMailWithRetry: jest.fn(),
  sendUserLifecycleEmail: jest.fn(),
}));

jest.mock('@/lib/email-delivery-jobs', () => ({
  queueEmailDeliveryJob: jest.fn(),
}));

jest.mock('@/lib/subscription-backfill', () => ({
  backfillEmailSubscriptionsFromUsers: jest.fn(() => ({
    scanned: 0,
    createdOrUpdated: 0,
  })),
}));

jest.mock('@/lib/env', () => ({
  getAppBaseUrl: jest.fn(() => 'https://www.life-kline.com'),
}));

import {
  analyticsOperations,
  eventOperations,
  fortuneOperations,
  questionOperations,
  toolSessionOperations,
  userLifecycleEmailRunOperations,
  userOperations,
} from '@/lib/database';
import { deliverMailWithRetry, sendUserLifecycleEmail } from '@/lib/email';
import { runUserLifecycleEmailCycle } from '@/lib/user-lifecycle-email';

const mockedAnalyticsOperations = analyticsOperations as jest.Mocked<typeof analyticsOperations>;
const mockedEventOperations = eventOperations as jest.Mocked<typeof eventOperations>;
const mockedFortuneOperations = fortuneOperations as jest.Mocked<typeof fortuneOperations>;
const mockedQuestionOperations = questionOperations as jest.Mocked<typeof questionOperations>;
const mockedToolSessionOperations = toolSessionOperations as jest.Mocked<typeof toolSessionOperations>;
const mockedLifecycleRuns = userLifecycleEmailRunOperations as jest.Mocked<typeof userLifecycleEmailRunOperations>;
const mockedUserOperations = userOperations as jest.Mocked<typeof userOperations>;
const mockedDeliverMailWithRetry = deliverMailWithRetry as jest.MockedFunction<typeof deliverMailWithRetry>;
const mockedSendUserLifecycleEmail = sendUserLifecycleEmail as jest.MockedFunction<typeof sendUserLifecycleEmail>;

describe('user lifecycle email cycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAnalyticsOperations.rawQuery.mockReturnValue([]);
    mockedEventOperations.getByUserId.mockReturnValue([]);
    mockedFortuneOperations.getByUserId.mockReturnValue([]);
    mockedQuestionOperations.getByUserId.mockReturnValue([]);
    mockedToolSessionOperations.listByUser.mockReturnValue([]);
    mockedLifecycleRuns.getByStageAndEmail.mockReturnValue(null);
    mockedDeliverMailWithRetry.mockResolvedValue({ success: true, message: 'ok' } as any);
  });

  it('sends a lifecycle email to verified users without a first report after one day', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_1',
        email: 'user@example.com',
        name: '测试用户',
        createdAt: '2026-04-18T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);

    const result = await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(result.sentCount).toBe(1);
    expect(mockedDeliverMailWithRetry).toHaveBeenCalled();
    expect(mockedLifecycleRuns.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stageKey: 'signup_day1_no_report',
        email: 'user@example.com',
        status: 'sent',
      })
    );
  });

  it('skips the report follow-up reminder once the user already chatted on that report', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_2',
        email: 'user2@example.com',
        name: '已跟进用户',
        createdAt: '2026-04-10T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_1',
        userId: 'user_2',
        name: '报告用户',
        createdAt: '2026-04-17T00:00:00.000Z',
      },
    ] as any);
    mockedQuestionOperations.getByUserId.mockReturnValue([
      {
        id: 'q_1',
        category: 'chat_user',
        analysis: { reportId: 'report_1' },
      },
    ] as any);
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { created_at: '2026-04-19T10:00:00.000Z' },
    ] as any);

    const result = await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(result.sentCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(mockedDeliverMailWithRetry).not.toHaveBeenCalled();
  });

  it('uses a week-scoped reactivation stage key for inactive users without a report', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_3',
        email: 'user3@example.com',
        name: '沉默用户',
        createdAt: '2026-04-01T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([] as any);
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { created_at: '2026-04-10T10:00:00.000Z' },
    ] as any);
    mockedLifecycleRuns.getByStageAndEmail.mockImplementation((stageKey) => (
      stageKey === 'signup_day1_no_report'
        ? {
            id: 'lifecycle_existing',
            stageKey,
            email: 'user3@example.com',
            status: 'sent',
          } as any
        : null
    ));

    const result = await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(result.sentCount).toBe(1);
    expect(mockedLifecycleRuns.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stageKey: expect.stringMatching(/^inactive_day7_reactivation:2026-04-20$/),
      })
    );
  });

  it('prioritizes report follow-up reminder before generic reactivation when a report exists', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_4',
        email: 'user4@example.com',
        name: '报告沉默用户',
        createdAt: '2026-04-01T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_4',
        userId: 'user_4',
        name: '报告沉默用户',
        createdAt: '2026-04-10T00:00:00.000Z',
      },
    ] as any);
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { created_at: '2026-04-10T10:00:00.000Z' },
    ] as any);

    const result = await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(result.sentCount).toBe(1);
    expect(mockedLifecycleRuns.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stageKey: 'report_day2_no_followup',
        reportId: 'report_4',
      })
    );
  });

  it('builds a prefilled chat follow-up link for report reminder emails', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_5',
        email: 'user5@example.com',
        name: '回流用户',
        createdAt: '2026-04-01T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_5',
        userId: 'user_5',
        name: '回流用户',
        createdAt: '2026-04-10T00:00:00.000Z',
      },
    ] as any);
    mockedAnalyticsOperations.rawQuery.mockReturnValue([
      { created_at: '2026-04-10T10:00:00.000Z' },
    ] as any);

    await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(mockedDeliverMailWithRetry).toHaveBeenCalled();
    const sender = mockedDeliverMailWithRetry.mock.calls[0]?.[0];
    expect(sender).toBeInstanceOf(Function);
    await sender();
    expect(mockedSendUserLifecycleEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        stageKey: 'report_day2_no_followup',
        reportId: 'report_5',
        primaryCtaHref: expect.stringContaining('lifecycle_report_followup'),
      })
    );
  });

  it('routes tool-interest users back to the same tool when they viewed but did not run it', async () => {
    mockedUserOperations.listWithEmail.mockReturnValue([
      {
        id: 'user_6',
        email: 'user6@example.com',
        name: '工具回流用户',
        createdAt: '2026-04-01T00:00:00.000Z',
        emailVerified: 1,
      },
    ] as any);
    mockedFortuneOperations.getByUserId.mockReturnValue([
      {
        id: 'report_6',
        userId: 'user_6',
        name: '工具回流用户',
        createdAt: '2026-04-12T00:00:00.000Z',
      },
    ] as any);
    mockedAnalyticsOperations.rawQuery.mockImplementation((sql: string) => {
      if (sql.includes("event_name = 'tool_detail_viewed'")) {
        return [
          {
            page: '/tools/career-role-fit',
            meta: JSON.stringify({ toolSlug: 'career-role-fit' }),
            created_at: '2026-04-18T00:00:00.000Z',
          },
        ] as any;
      }

      return [
        { created_at: '2026-04-19T10:00:00.000Z' },
      ] as any;
    });
    mockedToolSessionOperations.listByUser.mockReturnValue([] as any);
    mockedLifecycleRuns.getByStageAndEmail.mockImplementation((stageKey) => (
      stageKey === 'report_day2_no_followup'
        ? {
            id: 'lifecycle_report_followup_sent',
            stageKey,
            email: 'user6@example.com',
            status: 'sent',
          } as any
        : null
    ));

    await runUserLifecycleEmailCycle({
      trigger: 'manual',
      now: new Date('2026-04-20T00:00:00.000Z'),
    });

    expect(mockedDeliverMailWithRetry).toHaveBeenCalled();
    const sender = mockedDeliverMailWithRetry.mock.calls[0]?.[0];
    expect(sender).toBeInstanceOf(Function);
    await sender();
    expect(mockedSendUserLifecycleEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        stageKey: 'tool_interest_day1_no_run:career-role-fit',
        reportId: 'report_6',
        primaryCtaHref: expect.stringContaining('/tools/career-role-fit?source=lifecycle_tool_interest'),
      })
    );
  });
});
