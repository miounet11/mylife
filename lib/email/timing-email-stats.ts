/**
 * Ops visibility for email delivery (timing / daily-window / prediction-due).
 *
 * Source of truth: timing_email_log (sent / error / reserved counts).
 * Honest labeling: "delivery stats" only — no open-rate (no open pixel).
 * Soft-empty when DB or table is missing (local sandbox).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  readDailyWindowLastRun,
  type DailyWindowLastRun,
} from '@/lib/email/daily-window-last-run';

export const DELIVERY_STATS_LABEL = 'delivery_stats' as const;

export type TimingEmailLogRow = {
  category: string;
  status: string;
  campaign: string;
  sent_at?: string | null;
};

export type CategoryBucket = {
  category: string;
  counts: Record<string, number>;
  total: number;
};

export type StatusBucket = {
  status: string;
  count: number;
};

export type CampaignSummary = {
  campaign: string;
  category: string;
  statusCounts: Record<string, number>;
  total: number;
  lastSentAt: string | null;
};

export type TimingEmailStats = {
  /** Always "delivery_stats" — never "open_rate". */
  label: typeof DELIVERY_STATS_LABEL;
  days: number;
  dbAvailable: boolean;
  tablePresent: boolean;
  total: number;
  byCategory: CategoryBucket[];
  byStatus: StatusBucket[];
  campaigns: CampaignSummary[];
  note?: string;
  generatedAt: string;
};

export type EmailOpsSnapshot = {
  success: true;
  days: number;
  label: typeof DELIVERY_STATS_LABEL;
  byCategory: CategoryBucket[];
  byStatus: StatusBucket[];
  campaigns: CampaignSummary[];
  total: number;
  dbAvailable: boolean;
  tablePresent: boolean;
  note?: string;
  dailyWindowLastRun: {
    found: boolean;
    data: DailyWindowLastRun | null;
    path: string | null;
  };
  timestamp: string;
};

const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 90;
const MAX_CAMPAIGNS = 40;

function clampDays(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(raw)));
}

function emptyStats(days: number, note?: string): TimingEmailStats {
  return {
    label: DELIVERY_STATS_LABEL,
    days,
    dbAvailable: false,
    tablePresent: false,
    total: 0,
    byCategory: [],
    byStatus: [],
    campaigns: [],
    note,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Pure aggregation of timing_email_log-like rows.
 * Testable without SQLite.
 */
export function aggregateTimingEmailRows(
  rows: TimingEmailLogRow[] | null | undefined,
  days: number = DEFAULT_DAYS,
): Pick<
  TimingEmailStats,
  'label' | 'days' | 'total' | 'byCategory' | 'byStatus' | 'campaigns' | 'generatedAt'
> {
  const windowDays = clampDays(days);
  const byCategoryMap = new Map<string, Record<string, number>>();
  const byStatusMap = new Map<string, number>();
  const campaignMap = new Map<
    string,
    {
      campaign: string;
      category: string;
      statusCounts: Record<string, number>;
      total: number;
      lastSentAt: string | null;
    }
  >();

  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const category = String(row.category || 'unknown').trim() || 'unknown';
    const status = String(row.status || 'unknown').trim() || 'unknown';
    const campaign = String(row.campaign || '').trim() || '(none)';
    const sentAt = row.sent_at ? String(row.sent_at) : null;

    const catCounts = byCategoryMap.get(category) || {};
    catCounts[status] = (catCounts[status] || 0) + 1;
    byCategoryMap.set(category, catCounts);

    byStatusMap.set(status, (byStatusMap.get(status) || 0) + 1);

    const campKey = `${category}::${campaign}`;
    const existing = campaignMap.get(campKey) || {
      campaign,
      category,
      statusCounts: {} as Record<string, number>,
      total: 0,
      lastSentAt: null as string | null,
    };
    existing.statusCounts[status] = (existing.statusCounts[status] || 0) + 1;
    existing.total += 1;
    if (sentAt && (!existing.lastSentAt || sentAt > existing.lastSentAt)) {
      existing.lastSentAt = sentAt;
    }
    campaignMap.set(campKey, existing);
  }

  const byCategory: CategoryBucket[] = Array.from(byCategoryMap.entries())
    .map(([category, counts]) => ({
      category,
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

  const byStatus: StatusBucket[] = Array.from(byStatusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const campaigns: CampaignSummary[] = Array.from(campaignMap.values())
    .sort((a, b) => {
      const ta = a.lastSentAt || '';
      const tb = b.lastSentAt || '';
      if (ta !== tb) return tb.localeCompare(ta);
      return b.total - a.total;
    })
    .slice(0, MAX_CAMPAIGNS);

  return {
    label: DELIVERY_STATS_LABEL,
    days: windowDays,
    total: list.length,
    byCategory,
    byStatus,
    campaigns,
    generatedAt: new Date().toISOString(),
  };
}

function resolveDbPath(): string {
  return path.join(process.cwd(), 'data', 'lifekline.db');
}

/**
 * Query delivery counts from timing_email_log for the last N days.
 * Soft-empty if DB / table missing. Never returns email addresses.
 */
export function queryTimingEmailStats(opts?: { days?: number }): TimingEmailStats {
  const days = clampDays(opts?.days);
  const dbPath = resolveDbPath();

  if (!fs.existsSync(dbPath)) {
    return emptyStats(days, 'db_missing');
  }

  let Database: typeof import('better-sqlite3');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Database = require('better-sqlite3');
  } catch {
    return emptyStats(days, 'better_sqlite3_unavailable');
  }

  let db: InstanceType<typeof Database> | null = null;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const tableRow = db
      .prepare(
        `SELECT 1 AS n FROM sqlite_master WHERE type = 'table' AND name = 'timing_email_log' LIMIT 1`,
      )
      .get() as { n?: number } | undefined;

    if (!tableRow?.n) {
      return {
        ...emptyStats(days, 'table_missing'),
        dbAvailable: true,
        tablePresent: false,
      };
    }

    // sent_at is ISO or SQLite datetime; compare with datetime('now', '-N days')
    const rows = db
      .prepare(
        `SELECT category, status, campaign, sent_at
         FROM timing_email_log
         WHERE datetime(sent_at) >= datetime('now', ?)
         ORDER BY datetime(sent_at) DESC
         LIMIT 5000`,
      )
      .all(`-${days} days`) as TimingEmailLogRow[];

    const aggregated = aggregateTimingEmailRows(rows, days);
    return {
      ...aggregated,
      dbAvailable: true,
      tablePresent: true,
      note: rows.length >= 5000 ? 'row_cap_5000' : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return emptyStats(days, `query_error:${message.slice(0, 120)}`);
  } finally {
    try {
      db?.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Combined ops snapshot: delivery aggregates + daily-window last-run file.
 */
export function getEmailOpsSnapshot(opts?: { days?: number }): EmailOpsSnapshot {
  const stats = queryTimingEmailStats(opts);
  const lastRun = readDailyWindowLastRun();
  return {
    success: true,
    days: stats.days,
    label: DELIVERY_STATS_LABEL,
    byCategory: stats.byCategory,
    byStatus: stats.byStatus,
    campaigns: stats.campaigns,
    total: stats.total,
    dbAvailable: stats.dbAvailable,
    tablePresent: stats.tablePresent,
    note: stats.note,
    dailyWindowLastRun: {
      found: lastRun.found,
      data: lastRun.data,
      path: lastRun.path,
    },
    timestamp: new Date().toISOString(),
  };
}
