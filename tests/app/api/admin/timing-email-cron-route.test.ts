const mockSendTimingMonthlyDigestEmail = jest.fn();
const mockSendTimingSolarTermEmail = jest.fn();
const mockResolveTimingProfileForReport = jest.fn();

type TimingLogRow = {
  id: string;
  email: string;
  category: string;
  campaign: string;
  report_id?: string | null;
  status: string;
  sent_at?: string | null;
  meta?: string | null;
};

const mockDbState = {
  locks: new Map<string, { owner: string; expiresAt: string }>(),
  subscriptions: [] as Array<{ id: string; email: string; status: string; tags: string; updated_at?: string }>,
  users: new Map<string, { id: string }>(),
  fortunes: new Map<string, { id: string; user_id: string }>(),
  timingLogs: [] as TimingLogRow[],
};

function findTimingLog(email: string, category: string, campaign: string) {
  return mockDbState.timingLogs.find((row) => (
    row.email === email && row.category === category && row.campaign === campaign
  ));
}

jest.mock('@/lib/email', () => ({
  sendTimingMonthlyDigestEmail: (...args: unknown[]) => mockSendTimingMonthlyDigestEmail(...args),
  sendTimingSolarTermEmail: (...args: unknown[]) => mockSendTimingSolarTermEmail(...args),
}));

jest.mock('@/lib/life-timing/resolve-timing-profile', () => ({
  resolveTimingProfileForReport: (...args: unknown[]) => mockResolveTimingProfileForReport(...args),
}));

jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'test-id'),
}));

jest.mock('lunar-javascript', () => ({
  Solar: {
    fromYmd: jest.fn(() => ({
      getLunar: () => ({
        getJieQi: () => '',
      }),
    })),
  },
}));

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    prepare: (sql: string) => ({
      all: (limit?: number) => {
        if (sql.includes('FROM email_subscriptions')) {
          return mockDbState.subscriptions
            .filter((row) => row.status === 'active')
            .slice(0, typeof limit === 'number' ? limit : mockDbState.subscriptions.length);
        }
        return [];
      },
      get: (...args: unknown[]) => {
        if (sql.includes('FROM timing_email_log')) {
          const [email, category, campaign] = args as [string, string, string];
          return findTimingLog(email, category, campaign);
        }
        if (sql.includes('FROM users')) {
          const [email] = args as [string];
          return mockDbState.users.get(email);
        }
        if (sql.includes('FROM fortunes')) {
          const [userId] = args as [string];
          return mockDbState.fortunes.get(userId);
        }
        return undefined;
      },
      run: (...args: unknown[]) => {
        if (sql.includes('INSERT INTO system_locks')) {
          const [key, owner, , expiresAt] = args as [string, string, string, string];
          if (mockDbState.locks.has(key)) {
            return { changes: 0 };
          }
          mockDbState.locks.set(key, { owner, expiresAt });
          return { changes: 1 };
        }

        if (sql.includes('DELETE FROM system_locks')) {
          const [key, owner] = args as [string, string];
          const current = mockDbState.locks.get(key);
          if (current?.owner !== owner) {
            return { changes: 0 };
          }
          mockDbState.locks.delete(key);
          return { changes: 1 };
        }

        if (sql.includes('INSERT OR IGNORE INTO timing_email_log')) {
          const [id, email, category, campaign, reportId, meta] = args as [string, string, string, string, string | null, string];
          if (findTimingLog(email, category, campaign)) {
            return { changes: 0 };
          }
          mockDbState.timingLogs.push({
            id,
            email,
            category,
            campaign,
            report_id: reportId,
            status: 'reserved',
            sent_at: new Date().toISOString(),
            meta,
          });
          return { changes: 1 };
        }

        if (sql.includes("SET status = 'reserved'")) {
          const [reportId, meta, email, category, campaign] = args as [string | null, string, string, string, string];
          const row = findTimingLog(email, category, campaign);
          if (!row || (row.status !== 'error' && row.status !== 'reserved')) {
            return { changes: 0 };
          }
          row.status = 'reserved';
          row.report_id = reportId;
          row.sent_at = new Date().toISOString();
          row.meta = meta;
          return { changes: 1 };
        }

        if (sql.includes("SET status = 'sent'")) {
          const [reportId, meta, email, category, campaign] = args as [string | null, string, string, string, string];
          const row = findTimingLog(email, category, campaign);
          if (!row) {
            return { changes: 0 };
          }
          row.status = 'sent';
          row.report_id = reportId;
          row.sent_at = new Date().toISOString();
          row.meta = meta;
          return { changes: 1 };
        }

        if (sql.includes("SET status = 'error'")) {
          const [reportId, meta, email, category, campaign] = args as [string | null, string, string, string, string];
          const row = findTimingLog(email, category, campaign);
          if (!row) {
            return { changes: 0 };
          }
          row.status = 'error';
          row.report_id = reportId;
          row.meta = meta;
          return { changes: 1 };
        }

        return { changes: 0 };
      },
    }),
    close: jest.fn(),
  }));
});

import { POST } from '@/app/api/admin/timing/email/cron/route';

function buildTimingProfile() {
  return {
    record: {
      next_30_days: [
        {
          id: 'point_1',
          startDate: '2026-06-10',
          rawReason: '适合整理节奏',
          context: {},
          userCopy: {
            title: '整理节奏',
            summary: '适合整理节奏。',
          },
        },
      ],
      next_12_months: [],
    },
  };
}

describe('POST /api/admin/timing/email/cron', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-06T00:00:00.000Z'));
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      TIMING_EMAIL_CRON_TOKEN: 'timing-token',
    };
    mockDbState.locks.clear();
    mockDbState.subscriptions = [
      {
        id: 'sub_1',
        email: 'user@example.com',
        status: 'active',
        tags: JSON.stringify(['timing:monthly']),
      },
    ];
    mockDbState.users = new Map([['user@example.com', { id: 'user_1' }]]);
    mockDbState.fortunes = new Map([['user_1', { id: 'report_1', user_id: 'user_1' }]]);
    mockDbState.timingLogs = [];
    mockResolveTimingProfileForReport.mockReturnValue(buildTimingProfile());
    mockSendTimingMonthlyDigestEmail.mockResolvedValue({ success: true });
    mockSendTimingSolarTermEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('reserves timing email before sending and marks it sent', async () => {
    const response = await POST(new Request('http://localhost/api/admin/timing/email/cron?mode=monthly', {
      method: 'POST',
      headers: {
        'x-timing-email-cron-token': 'timing-token',
      },
    }) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.monthlySent).toBe(1);
    expect(mockSendTimingMonthlyDigestEmail).toHaveBeenCalledTimes(1);
    expect(mockDbState.timingLogs[0]).toEqual(expect.objectContaining({
      email: 'user@example.com',
      category: 'monthly',
      campaign: '2026-06-monthly',
      status: 'sent',
    }));
    expect(mockDbState.locks.size).toBe(0);
  });

  it('skips the run when the timing email lock is already held', async () => {
    mockDbState.locks.set('timing_email_cycle:monthly:2026-06-monthly', {
      owner: 'other-worker',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const response = await POST(new Request('http://localhost/api/admin/timing/email/cron?mode=monthly', {
      method: 'POST',
      headers: {
        'x-timing-email-cron-token': 'timing-token',
      },
    }) as any);
    const payload = await response.json();

    expect(payload.reason).toBe('already_running');
    expect(mockSendTimingMonthlyDigestEmail).not.toHaveBeenCalled();
    expect(mockDbState.timingLogs).toHaveLength(0);
  });

  it('clamps oversized limits before scanning subscriptions', async () => {
    mockDbState.subscriptions = Array.from({ length: 120 }, (_, index) => ({
      id: `sub_${index}`,
      email: `user-${index}@example.com`,
      status: 'active',
      tags: JSON.stringify(['timing:monthly']),
    }));
    mockDbState.users = new Map(
      mockDbState.subscriptions.map((subscription, index) => [
        subscription.email,
        { id: `user_${index}` },
      ])
    );
    mockDbState.fortunes = new Map(
      mockDbState.subscriptions.map((subscription, index) => [
        `user_${index}`,
        { id: `report_${index}`, user_id: `user_${index}` },
      ])
    );

    const response = await POST(new Request('http://localhost/api/admin/timing/email/cron?mode=monthly&limit=1000', {
      method: 'POST',
      headers: {
        'x-timing-email-cron-token': 'timing-token',
      },
    }) as any);
    const payload = await response.json();

    expect(payload.monthlySent).toBe(100);
    expect(mockSendTimingMonthlyDigestEmail).toHaveBeenCalledTimes(100);
  });
});
