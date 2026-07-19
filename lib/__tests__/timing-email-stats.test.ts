import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  aggregateErrorReasons,
  aggregateTimingEmailRows,
  classifyEmailError,
  DELIVERY_STATS_LABEL,
  extractErrorMessageFromMeta,
  getEmailOpsSnapshot,
  queryTimingEmailStats,
  stripEmailsFromMessage,
} from '@/lib/email/timing-email-stats';

describe('classifyEmailError', () => {
  it('maps mail_not_configured / sender_missing (config)', () => {
    assert.equal(classifyEmailError('mail_not_configured').code, 'mail_not_configured');
    assert.equal(classifyEmailError('sender_missing').code, 'mail_not_configured');
    assert.equal(classifyEmailError('reason: email_not_configured').label, '邮件未配置');
  });

  it('maps missing_sender_fn for is-not-a-function and email_sender_missing', () => {
    const prodSample = '(0 , v.sendTimingDailyReminderEmail) is not a function';
    assert.equal(classifyEmailError(prodSample).code, 'missing_sender_fn');
    assert.equal(classifyEmailError(prodSample).label, '发送函数缺失');
    assert.equal(classifyEmailError('undefined is not a function').code, 'missing_sender_fn');
    assert.equal(classifyEmailError('email_sender_missing').code, 'missing_sender_fn');
    assert.equal(classifyEmailError('foo is not a function').code, 'missing_sender_fn');
  });

  it('maps type_error for TypeError patterns (not is-not-a-function)', () => {
    assert.equal(
      classifyEmailError("TypeError: Cannot read properties of undefined (reading 'x')").code,
      'type_error',
    );
    assert.equal(classifyEmailError('TypeError: cannot set property of null').code, 'type_error');
    assert.equal(classifyEmailError('type_error').label, '类型错误');
  });

  it('maps smtp / connection / timeout / ECONNREFUSED', () => {
    assert.equal(classifyEmailError('connect ECONNREFUSED 127.0.0.1:25').code, 'smtp_connection');
    assert.equal(classifyEmailError('SMTP connection timed out').code, 'smtp_connection');
    assert.equal(classifyEmailError('ETIMEDOUT').code, 'smtp_connection');
    assert.equal(classifyEmailError('Connection reset by peer').code, 'smtp_connection');
  });

  it('maps rate / 429 / throttle', () => {
    assert.equal(classifyEmailError('HTTP 429 Too Many Requests').code, 'rate_limited');
    assert.equal(classifyEmailError('rate limit exceeded').code, 'rate_limited');
    assert.equal(classifyEmailError('throttled by provider').code, 'rate_limited');
  });

  it('maps invalid_address / bounce / 550', () => {
    assert.equal(classifyEmailError('550 User unknown').code, 'invalid_address');
    assert.equal(classifyEmailError('soft bounce: mailbox unavailable').code, 'invalid_address');
    assert.equal(classifyEmailError('invalid_address').code, 'invalid_address');
  });

  it('maps auth / 535 / unauthorized', () => {
    assert.equal(classifyEmailError('535 Authentication failed').code, 'auth');
    assert.equal(classifyEmailError('SMTP unauthorized').code, 'auth');
    assert.equal(classifyEmailError('Invalid login credentials').code, 'auth');
  });

  it('unknown truncates via sample path and strips emails', () => {
    const msg = 'weird failure for user@example.com please retry later';
    const cls = classifyEmailError(msg);
    assert.equal(cls.code, 'unknown');
    assert.equal(cls.label, '其他/未知');
    assert.equal(stripEmailsFromMessage(msg).includes('user@example.com'), false);
    assert.ok(stripEmailsFromMessage(msg).includes('[email]'));
  });

  it('empty message is unknown', () => {
    assert.equal(classifyEmailError('').code, 'unknown');
    assert.equal(classifyEmailError('   ').code, 'unknown');
  });
});

describe('extractErrorMessageFromMeta', () => {
  it('reads error from JSON string or object', () => {
    assert.equal(
      extractErrorMessageFromMeta(
        JSON.stringify({ error: 'mail_not_configured', failedAt: '2026-07-18T00:00:00Z' }),
      ),
      'mail_not_configured',
    );
    assert.equal(
      extractErrorMessageFromMeta({ error: 'ECONNREFUSED', failedAt: 'x' }),
      'ECONNREFUSED',
    );
  });

  it('falls back for plain string meta', () => {
    assert.equal(extractErrorMessageFromMeta('plain boom'), 'plain boom');
    assert.equal(extractErrorMessageFromMeta(null), '');
  });
});

describe('aggregateErrorReasons', () => {
  it('aggregates top reasons from error rows and redacts samples', () => {
    const reasons = aggregateErrorReasons([
      {
        category: 'daily_window',
        status: 'error',
        campaign: 'c1',
        meta: JSON.stringify({
          error: 'mail_not_configured',
          failedAt: '2026-07-18T08:00:00.000Z',
        }),
      },
      {
        category: 'daily_window',
        status: 'error',
        campaign: 'c1',
        meta: { error: 'mail_not_configured' },
      },
      {
        category: 'timing',
        status: 'error',
        campaign: 'c0',
        meta: {
          error: '(0 , v.sendTimingDailyReminderEmail) is not a function',
        },
      },
      {
        category: 'prediction_due',
        status: 'error',
        campaign: 'c2',
        meta: JSON.stringify({
          error: '550 User unknown for alice@secret.com',
        }),
      },
      {
        category: 'timing',
        status: 'sent',
        campaign: 'c3',
        meta: JSON.stringify({ error: 'should_not_count' }),
      },
    ]);

    assert.equal(reasons.length, 3);
    assert.equal(reasons[0]!.code, 'mail_not_configured');
    assert.equal(reasons[0]!.count, 2);
    const byCode = Object.fromEntries(reasons.map((r) => [r.code, r]));
    assert.equal(byCode.missing_sender_fn?.count, 1);
    assert.equal(byCode.missing_sender_fn?.label, '发送函数缺失');
    assert.equal(byCode.invalid_address?.count, 1);
    assert.ok(byCode.invalid_address?.sample);
    assert.equal(byCode.invalid_address!.sample!.includes('alice@secret.com'), false);
    assert.ok(byCode.invalid_address!.sample!.includes('[email]'));
  });

  it('returns empty for no errors', () => {
    assert.deepEqual(aggregateErrorReasons([]), []);
    assert.deepEqual(
      aggregateErrorReasons([
        { category: 'x', status: 'sent', campaign: 'c', meta: null },
      ]),
      [],
    );
  });
});

describe('aggregateTimingEmailRows', () => {
  it('returns zeros for empty / missing rows (never invents open rates)', () => {
    const empty = aggregateTimingEmailRows([]);
    assert.equal(empty.label, DELIVERY_STATS_LABEL);
    assert.equal(empty.total, 0);
    assert.deepEqual(empty.byCategory, []);
    assert.deepEqual(empty.byStatus, []);
    assert.deepEqual(empty.campaigns, []);
    assert.deepEqual(empty.errorReasons, []);
    assert.equal(empty.days, 7);

    assert.equal(aggregateTimingEmailRows(null).total, 0);
    assert.equal(aggregateTimingEmailRows(undefined).total, 0);
  });

  it('aggregates by category × status and campaign', () => {
    const stats = aggregateTimingEmailRows(
      [
        {
          category: 'daily_window',
          status: 'sent',
          campaign: '2026-07-18',
          sent_at: '2026-07-18T08:00:00.000Z',
        },
        {
          category: 'daily_window',
          status: 'sent',
          campaign: '2026-07-18',
          sent_at: '2026-07-18T09:00:00.000Z',
        },
        {
          category: 'daily_window',
          status: 'error',
          campaign: '2026-07-18',
          sent_at: '2026-07-18T08:30:00.000Z',
        },
        {
          category: 'prediction_due',
          status: 'reserved',
          campaign: 'due-2026-07-18',
          sent_at: '2026-07-18T10:00:00.000Z',
        },
        {
          category: 'prediction_due',
          status: 'sent',
          campaign: 'due-2026-07-17',
          sent_at: '2026-07-17T10:00:00.000Z',
        },
      ],
      7,
    );

    assert.equal(stats.total, 5);
    assert.equal(stats.label, 'delivery_stats');

    const daily = stats.byCategory.find((c) => c.category === 'daily_window');
    assert.ok(daily);
    assert.equal(daily!.counts.sent, 2);
    assert.equal(daily!.counts.error, 1);
    assert.equal(daily!.total, 3);

    const pred = stats.byCategory.find((c) => c.category === 'prediction_due');
    assert.ok(pred);
    assert.equal(pred!.counts.sent, 1);
    assert.equal(pred!.counts.reserved, 1);

    const sentBucket = stats.byStatus.find((s) => s.status === 'sent');
    assert.equal(sentBucket?.count, 3);

    const camp = stats.campaigns.find(
      (c) => c.category === 'daily_window' && c.campaign === '2026-07-18',
    );
    assert.ok(camp);
    assert.equal(camp!.total, 3);
    assert.equal(camp!.statusCounts.sent, 2);
    assert.equal(camp!.statusCounts.error, 1);
    assert.equal(camp!.lastSentAt, '2026-07-18T09:00:00.000Z');
  });

  it('clamps days and sorts campaigns by lastSentAt desc', () => {
    const stats = aggregateTimingEmailRows(
      [
        {
          category: 'timing',
          status: 'sent',
          campaign: 'old',
          sent_at: '2026-01-01T00:00:00.000Z',
        },
        {
          category: 'timing',
          status: 'sent',
          campaign: 'new',
          sent_at: '2026-07-01T00:00:00.000Z',
        },
      ],
      999,
    );
    assert.equal(stats.days, 90);
    assert.equal(stats.campaigns[0]?.campaign, 'new');
    assert.equal(stats.campaigns[1]?.campaign, 'old');
  });

  it('does not include email PII fields in aggregate shape', () => {
    const stats = aggregateTimingEmailRows([
      {
        category: 'daily_window',
        status: 'error',
        campaign: 'c1',
        sent_at: '2026-07-18T00:00:00.000Z',
        meta: JSON.stringify({
          error: 'failed for secret@example.com: ECONNREFUSED',
        }),
        // @ts-expect-error intentional — callers must not rely on email
        email: 'secret@example.com',
      } as any,
    ]);
    const json = JSON.stringify(stats);
    assert.equal(json.includes('secret@example.com'), false);
    assert.equal(json.includes('open_rate'), false);
    assert.equal(json.includes('openRate'), false);
    assert.ok(stats.errorReasons.length >= 1);
    assert.equal(stats.errorReasons[0]!.code, 'smtp_connection');
  });
});

describe('queryTimingEmailStats / getEmailOpsSnapshot', () => {
  it('soft-empties when local DB is missing or empty table', () => {
    const stats = queryTimingEmailStats({ days: 7 });
    assert.equal(stats.label, DELIVERY_STATS_LABEL);
    assert.equal(stats.days, 7);
    // Local sandbox usually has no DB or no table — either way no throw
    assert.ok(typeof stats.dbAvailable === 'boolean');
    assert.ok(Array.isArray(stats.byCategory));
    assert.ok(Array.isArray(stats.byStatus));
    assert.ok(Array.isArray(stats.campaigns));
    assert.ok(Array.isArray(stats.errorReasons));
  });

  it('ops snapshot includes dailyWindowLastRun, timingEmailLastRun, predictionDueLastRun, errorReasons, and success', () => {
    const snap = getEmailOpsSnapshot({ days: 3 });
    assert.equal(snap.success, true);
    assert.equal(snap.label, 'delivery_stats');
    assert.equal(snap.days, 3);
    assert.ok(snap.dailyWindowLastRun);
    assert.ok(typeof snap.dailyWindowLastRun.found === 'boolean');
    assert.ok(snap.timingEmailLastRun);
    assert.ok(typeof snap.timingEmailLastRun.found === 'boolean');
    assert.ok(snap.predictionDueLastRun);
    assert.ok(typeof snap.predictionDueLastRun.found === 'boolean');
    assert.ok(typeof snap.timestamp === 'string');
    assert.ok(Array.isArray(snap.errorReasons));
  });
});
