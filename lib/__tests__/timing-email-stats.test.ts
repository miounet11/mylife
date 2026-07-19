import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  aggregateTimingEmailRows,
  DELIVERY_STATS_LABEL,
  getEmailOpsSnapshot,
  queryTimingEmailStats,
} from '@/lib/email/timing-email-stats';

describe('aggregateTimingEmailRows', () => {
  it('returns zeros for empty / missing rows (never invents open rates)', () => {
    const empty = aggregateTimingEmailRows([]);
    assert.equal(empty.label, DELIVERY_STATS_LABEL);
    assert.equal(empty.total, 0);
    assert.deepEqual(empty.byCategory, []);
    assert.deepEqual(empty.byStatus, []);
    assert.deepEqual(empty.campaigns, []);
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
        status: 'sent',
        campaign: 'c1',
        sent_at: '2026-07-18T00:00:00.000Z',
        // @ts-expect-error intentional — callers must not rely on email
        email: 'secret@example.com',
      } as any,
    ]);
    const json = JSON.stringify(stats);
    assert.equal(json.includes('secret@example.com'), false);
    assert.equal(json.includes('open_rate'), false);
    assert.equal(json.includes('openRate'), false);
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
  });

  it('ops snapshot includes dailyWindowLastRun and success', () => {
    const snap = getEmailOpsSnapshot({ days: 3 });
    assert.equal(snap.success, true);
    assert.equal(snap.label, 'delivery_stats');
    assert.equal(snap.days, 3);
    assert.ok(snap.dailyWindowLastRun);
    assert.ok(typeof snap.dailyWindowLastRun.found === 'boolean');
    assert.ok(typeof snap.timestamp === 'string');
  });
});
