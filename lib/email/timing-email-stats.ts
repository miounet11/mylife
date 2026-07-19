/**
 * Ops visibility for email delivery (timing / daily-window / prediction-due).
 *
 * Source of truth: timing_email_log (sent / error / reserved counts).
 * Honest labeling: "delivery stats" only — no open-rate (no open pixel).
 * Soft-empty when DB or table is missing (local sandbox).
 * Error taxonomy from meta.error on status='error' rows — no recipient emails in output.
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
  /** JSON string or object; only used for status=error classification. Never returned raw. */
  meta?: string | Record<string, unknown> | null;
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

export type EmailErrorClass = {
  code: string;
  label: string;
};

export type ErrorReasonBucket = {
  code: string;
  label: string;
  count: number;
  /** Redacted/truncated sample message — no recipient emails. */
  sample?: string;
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
  /** Top error reasons from meta.error on error rows. */
  errorReasons: ErrorReasonBucket[];
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
  errorReasons: ErrorReasonBucket[];
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
const MAX_ERROR_REASONS = 15;
const SAMPLE_MAX_LEN = 160;

/** Email-like tokens stripped from samples before API/UI exposure. */
const EMAIL_TOKEN_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

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
    errorReasons: [],
    note,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Strip email addresses from a message for safe display samples.
 */
export function stripEmailsFromMessage(message: string): string {
  return String(message || '').replace(EMAIL_TOKEN_RE, '[email]');
}

/**
 * Classify a delivery error message into a stable taxonomy code + label.
 * Pure; safe for unit tests.
 */
export function classifyEmailError(message: string): EmailErrorClass {
  const raw = String(message || '').trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return { code: 'unknown', label: '其他/未知' };
  }

  // Config / missing sender (local stub & cron short-circuit)
  if (
    lower.includes('mail_not_configured') ||
    lower.includes('email_sender_missing') ||
    lower.includes('email_not_configured') ||
    lower.includes('sender_missing')
  ) {
    return { code: 'mail_not_configured', label: '邮件未配置' };
  }

  // Auth before generic "invalid" / smtp so "Invalid login" / "SMTP unauthorized" land here
  if (
    lower.includes('535') ||
    lower.includes('534') ||
    lower.includes('unauthorized') ||
    lower.includes('authentication') ||
    lower.includes('auth failed') ||
    lower.includes('auth error') ||
    lower.includes('invalid login') ||
    lower.includes('login fail') ||
    lower.includes('login credentials') ||
    /\bauth\b/.test(lower)
  ) {
    return { code: 'auth', label: '认证失败' };
  }

  // Recipient / bounce
  if (
    lower.includes('invalid_address') ||
    lower.includes('invalid address') ||
    lower.includes('invalid recipient') ||
    lower.includes('bounce') ||
    lower.includes('550') ||
    lower.includes('551') ||
    lower.includes('553') ||
    lower.includes('user unknown') ||
    lower.includes('mailbox unavailable') ||
    lower.includes('recipient rejected') ||
    lower.includes('no such user')
  ) {
    return { code: 'invalid_address', label: '地址无效/退信' };
  }

  // Rate limits
  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('ratelimit') ||
    lower.includes('throttl') ||
    lower.includes('too many') ||
    lower.includes('quota')
  ) {
    return { code: 'rate_limited', label: '限流/429' };
  }

  // SMTP / transport
  if (
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('smtp') ||
    lower.includes('connection') ||
    lower.includes('connect') ||
    lower.includes('enotfound') ||
    lower.includes('network') ||
    lower.includes('socket')
  ) {
    return { code: 'smtp_connection', label: 'SMTP/连接/超时' };
  }

  return { code: 'unknown', label: '其他/未知' };
}

/**
 * Pull error text from timing_email_log.meta (JSON string or object).
 * Expects shape like `{ error: "...", failedAt: "..." }`.
 */
export function extractErrorMessageFromMeta(
  meta: TimingEmailLogRow['meta'],
): string {
  if (meta == null || meta === '') return '';
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    const err = (meta as Record<string, unknown>).error;
    if (typeof err === 'string') return err;
    if (err != null) return String(err);
    return '';
  }
  const s = String(meta);
  try {
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const err = (parsed as Record<string, unknown>).error;
      if (typeof err === 'string') return err;
      if (err != null) return String(err);
    }
  } catch {
    // meta may be a plain error string
  }
  return s;
}

function redactSample(message: string): string {
  const cleaned = stripEmailsFromMessage(message).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= SAMPLE_MAX_LEN) return cleaned;
  return `${cleaned.slice(0, SAMPLE_MAX_LEN - 1)}…`;
}

/**
 * Aggregate classified error reasons from rows (typically status=error).
 * Top MAX_ERROR_REASONS by count; sample is redacted.
 */
export function aggregateErrorReasons(
  rows: TimingEmailLogRow[] | null | undefined,
): ErrorReasonBucket[] {
  const list = Array.isArray(rows) ? rows : [];
  const map = new Map<
    string,
    { code: string; label: string; count: number; sample?: string }
  >();

  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const status = String(row.status || '').trim().toLowerCase();
    // Only classify error rows when status is present; bare message rows still count
    if (status && status !== 'error') continue;

    const message = extractErrorMessageFromMeta(row.meta);
    const classified = classifyEmailError(message);
    const existing = map.get(classified.code);
    if (existing) {
      existing.count += 1;
      if (!existing.sample && message) {
        existing.sample = redactSample(message);
      }
    } else {
      map.set(classified.code, {
        code: classified.code,
        label: classified.label,
        count: 1,
        sample: message ? redactSample(message) : undefined,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, MAX_ERROR_REASONS)
    .map((b) => {
      const out: ErrorReasonBucket = {
        code: b.code,
        label: b.label,
        count: b.count,
      };
      if (b.sample) out.sample = b.sample;
      return out;
    });
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
  | 'label'
  | 'days'
  | 'total'
  | 'byCategory'
  | 'byStatus'
  | 'campaigns'
  | 'errorReasons'
  | 'generatedAt'
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

  const errorReasons = aggregateErrorReasons(list);

  return {
    label: DELIVERY_STATS_LABEL,
    days: windowDays,
    total: list.length,
    byCategory,
    byStatus,
    campaigns,
    errorReasons,
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
    // Include meta for error classification (never returned raw / no recipient emails).
    const rows = db
      .prepare(
        `SELECT category, status, campaign, sent_at, meta
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
    errorReasons: stats.errorReasons,
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
