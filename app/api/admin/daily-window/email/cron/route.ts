/**
 * Life K-Line · light daily-window email cron
 *
 * Educational tip-of-the-day for active subscribers with tag `timing:daily`.
 * Does NOT invent personal 八字 / 日主 / 用神 — content from lib/daily/window-copy.
 *
 * Auth: header `x-timing-email-cron-token` (or `x-daily-window-email-cron-token`)
 * must match env `TIMING_EMAIL_CRON_TOKEN` (or `DAILY_WINDOW_EMAIL_CRON_TOKEN`).
 *
 * Example dry-run (no send, returns sample JSON):
 *   curl -sS -X POST \
 *     'http://127.0.0.1:3000/api/admin/daily-window/email/cron?dryRun=1' \
 *     -H "x-timing-email-cron-token: $TIMING_EMAIL_CRON_TOKEN"
 *
 * Live send (batch of up to limit, default 50):
 *   curl -sS -X POST \
 *     'http://127.0.0.1:8080/api/admin/daily-window/email/cron?limit=50' \
 *     -H "x-timing-email-cron-token: $TIMING_EMAIL_CRON_TOKEN"
 *
 * Optional: `?locale=en` forces sample locale on dryRun; live send still
 * resolves per-recipient when possible.
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';
import { buildDailyWindowEmail } from '@/lib/email/daily-window-email';
import { generateId } from '@/lib/utils';

export const maxDuration = 60;

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;
const LOG_CATEGORY = 'daily_window';

function isAuthorized(request: NextRequest): boolean {
  const tokens = [
    process.env.DAILY_WINDOW_EMAIL_CRON_TOKEN,
    process.env.TIMING_EMAIL_CRON_TOKEN,
  ].filter(Boolean) as string[];
  if (!tokens.length) return false;
  const provided =
    request.headers.get('x-daily-window-email-cron-token')
    || request.headers.get('x-timing-email-cron-token')
    || '';
  return tokens.includes(provided);
}

function readBatchSize(rawLimit: string | null): number {
  const parsed = rawLimit ? Number(rawLimit) : DEFAULT_BATCH_SIZE;
  if (!Number.isFinite(parsed)) return DEFAULT_BATCH_SIZE;
  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(parsed)));
}

function isDryRun(url: URL): boolean {
  const raw = (url.searchParams.get('dryRun') || url.searchParams.get('dry_run') || '').trim();
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes';
}

function campaignForToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type SubRow = {
  id: string;
  email: string;
  status: string;
  tags: string;
};

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
}

function openDb(readonly: boolean): Database.Database | null {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');
    return new Database(dbPath, { readonly });
  } catch {
    return null;
  }
}

/** Active email_subscriptions that include timing:daily. Soft-empty if DB missing. */
function listDailyWindowSubscribers(limit: number): {
  rows: SubRow[];
  error?: string;
  dbAvailable: boolean;
} {
  const db = openDb(true);
  if (!db) {
    return { rows: [], dbAvailable: false, error: 'db_unavailable' };
  }
  try {
    // Pull a wider pool then filter by tag in JS (tags are JSON text).
    const pool = Math.min(Math.max(limit * 8, 100), 800);
    const rows = db.prepare(`
      SELECT id, email, status, tags FROM email_subscriptions
      WHERE status = 'active'
        AND email IS NOT NULL
        AND trim(email) != ''
      ORDER BY datetime(updated_at) ASC, email ASC
      LIMIT ?
    `).all(pool) as SubRow[];

    const matched = rows.filter((row) => parseTags(row.tags).includes('timing:daily'));
    return { rows: matched.slice(0, limit), dbAvailable: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { rows: [], dbAvailable: false, error: message };
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function reserveDailyWindowEmail(email: string, campaign: string): boolean {
  const db = openDb(false);
  if (!db) return false;
  try {
    const existing = db.prepare(`
      SELECT status FROM timing_email_log
      WHERE email = ? AND category = ? AND campaign = ?
      LIMIT 1
    `).get(email, LOG_CATEGORY, campaign) as { status?: string } | undefined;
    if (existing?.status === 'sent' || existing?.status === 'reserved') {
      return false;
    }

    if (existing?.status === 'error') {
      const result = db.prepare(`
        UPDATE timing_email_log
        SET status = 'reserved',
            sent_at = datetime('now'),
            meta = ?
        WHERE email = ? AND category = ? AND campaign = ? AND status = 'error'
      `).run(JSON.stringify({ reservedAt: new Date().toISOString() }), email, LOG_CATEGORY, campaign);
      return result.changes > 0;
    }

    const id = `tel_${generateId()}`;
    const result = db.prepare(`
      INSERT OR IGNORE INTO timing_email_log
        (id, email, category, campaign, report_id, status, meta)
      VALUES (?, ?, ?, ?, NULL, 'reserved', ?)
    `).run(
      id,
      email,
      LOG_CATEGORY,
      campaign,
      JSON.stringify({ reservedAt: new Date().toISOString(), kind: 'daily_window_light' }),
    );
    return result.changes > 0;
  } catch {
    return false;
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function markDailyWindowSent(email: string, campaign: string, meta: Record<string, unknown>) {
  const db = openDb(false);
  if (!db) return;
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'sent', sent_at = datetime('now'), meta = ?
      WHERE email = ? AND category = ? AND campaign = ?
    `).run(JSON.stringify(meta), email, LOG_CATEGORY, campaign);
  } catch {
    // soft fail
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function markDailyWindowFailed(email: string, campaign: string, error: string) {
  const db = openDb(false);
  if (!db) return;
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'error', meta = ?
      WHERE email = ? AND category = ? AND campaign = ?
    `).run(
      JSON.stringify({ error: error.slice(0, 500), failedAt: new Date().toISOString() }),
      email,
      LOG_CATEGORY,
      campaign,
    );
  } catch {
    // soft fail
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

async function dispatchDailyWindowEmail(params: {
  email: string;
  subject: string;
  html: string;
  text: string;
}) {
  const emailModule = await import('@/lib/email');

  if (typeof (emailModule as any).sendDailyWindowEmail === 'function') {
    return (emailModule as any).sendDailyWindowEmail(params);
  }

  if (typeof (emailModule as any).sendEmail === 'function') {
    return (emailModule as any).sendEmail({
      to: params.email,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }

  // Prefer mail facade used by other transactional senders.
  try {
    const mail = await import('@/mail');
    if (typeof mail.sendMailV2 === 'function') {
      return mail.sendMailV2({
        to: params.email,
        subject: params.subject,
        subtype: 'html',
        text: params.text,
        content: params.html,
      });
    }
  } catch {
    // fall through
  }

  return { ok: false, success: false, reason: 'email_sender_missing' };
}

function isSendOk(result: unknown): boolean {
  if (!result || typeof result !== 'object') return true;
  const r = result as { ok?: boolean; success?: boolean; reason?: string; message?: string };
  if (r.ok === false || r.success === false) return false;
  if (r.reason === 'email_sender_missing' || r.message === 'mail_not_configured') return false;
  return true;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const url = new URL(request.url);
  const dryRun = isDryRun(url);
  const batchSize = readBatchSize(url.searchParams.get('limit'));
  const forceLocale = url.searchParams.get('locale') || undefined;
  const now = new Date();
  const campaign = campaignForToday(now);

  const sample = buildDailyWindowEmail({
    locale: forceLocale,
    date: now,
    utmCampaign: campaign,
  });

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      campaign,
      sample: {
        subject: sample.subject,
        text: sample.text,
        html: sample.html,
        locale: sample.locale,
        tip: sample.tip,
        dateLabel: sample.dateLabel,
        dayOfYear: sample.dayOfYear,
        tipIndex: sample.tipIndex,
      },
      note: 'No email sent. Remove dryRun=1 to dispatch to timing:daily subscribers.',
      timestamp: new Date().toISOString(),
    });
  }

  const listed = listDailyWindowSubscribers(batchSize);
  if (!listed.dbAvailable) {
    return NextResponse.json({
      success: true,
      campaign,
      sentCount: 0,
      skippedCount: 0,
      candidateCount: 0,
      errors: listed.error ? [listed.error] : ['db_unavailable'],
      reason: 'db_unavailable',
      softFail: true,
      sample: {
        subject: sample.subject,
        tip: sample.tip,
        dateLabel: sample.dateLabel,
      },
      timestamp: new Date().toISOString(),
    });
  }

  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const sub of listed.rows) {
    const email = `${sub.email || ''}`.trim().toLowerCase();
    if (!email) {
      skippedCount++;
      continue;
    }

    if (!reserveDailyWindowEmail(email, campaign)) {
      skippedCount++;
      continue;
    }

    try {
      const payload = buildDailyWindowEmail({
        email,
        date: now,
        utmCampaign: campaign,
        locale: forceLocale,
      });

      const result = await dispatchDailyWindowEmail({
        email,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (!isSendOk(result)) {
        const reason =
          (result as any)?.reason
          || (result as any)?.message
          || 'send_failed';
        throw new Error(String(reason));
      }

      markDailyWindowSent(email, campaign, {
        sentAt: new Date().toISOString(),
        tipIndex: payload.tipIndex,
        dayOfYear: payload.dayOfYear,
        locale: payload.locale,
      });
      sentCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      markDailyWindowFailed(email, campaign, message);
      errors.push(`${email}: ${message}`);
    }
  }

  return NextResponse.json({
    success: true,
    campaign,
    candidateCount: listed.rows.length,
    sentCount,
    skippedCount,
    errors,
    timestamp: new Date().toISOString(),
  });
}

/** GET also allowed for dryRun previews (same auth). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (!isDryRun(url)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Use POST for live send, or GET/POST with ?dryRun=1 for sample JSON.',
      },
      { status: 405 },
    );
  }
  // Reuse POST dry-run path
  return POST(request);
}
