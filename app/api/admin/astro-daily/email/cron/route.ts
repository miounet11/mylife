/**
 * Life K-Line · 星座日运简报 cron
 *
 * Public compare + tong-shu for subscribers with tag `astro:daily`.
 * Auth: x-timing-email-cron-token or x-astro-daily-email-cron-token
 *   matches TIMING_EMAIL_CRON_TOKEN / ASTRO_DAILY_EMAIL_CRON_TOKEN
 *
 * dryRun=1 → sample payload, no send
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';
import { buildAstroDailyEmail } from '@/lib/email/astro-daily-email';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { generateId } from '@/lib/utils';

export const maxDuration = 60;

const DEFAULT_BATCH = 50;
const MAX_BATCH = 100;
const LOG_CATEGORY = 'astro_daily';
const TAG = 'astro:daily';

function isAuthorized(request: NextRequest): boolean {
  const tokens = [
    process.env.ASTRO_DAILY_EMAIL_CRON_TOKEN,
    process.env.TIMING_EMAIL_CRON_TOKEN,
    process.env.DAILY_WINDOW_EMAIL_CRON_TOKEN,
  ].filter(Boolean) as string[];
  if (!tokens.length) return false;
  const provided =
    request.headers.get('x-astro-daily-email-cron-token')
    || request.headers.get('x-timing-email-cron-token')
    || request.headers.get('x-daily-window-email-cron-token')
    || '';
  return tokens.includes(provided);
}

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

function openDb(readonly: boolean) {
  try {
    return new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly });
  } catch {
    return null;
  }
}

function listSubscribers(limit: number) {
  const db = openDb(true);
  if (!db) return { rows: [] as Array<{ email: string }>, dbAvailable: false };
  try {
    const pool = Math.min(Math.max(limit * 8, 100), 800);
    const rows = db
      .prepare(
        `SELECT email, tags FROM email_subscriptions
         WHERE status = 'active' AND email IS NOT NULL AND trim(email) != ''
         ORDER BY datetime(updated_at) ASC LIMIT ?`,
      )
      .all(pool) as Array<{ email: string; tags: string }>;
    const matched = rows
      .filter((r) => parseTags(r.tags).includes(TAG))
      .map((r) => ({ email: r.email }))
      .slice(0, limit);
    return { rows: matched, dbAvailable: true };
  } catch {
    return { rows: [], dbAvailable: false };
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function reserve(email: string, campaign: string): boolean {
  const db = openDb(false);
  if (!db) return false;
  try {
    const existing = db
      .prepare(
        `SELECT status FROM timing_email_log WHERE email=? AND category=? AND campaign=? LIMIT 1`,
      )
      .get(email, LOG_CATEGORY, campaign) as { status?: string } | undefined;
    if (existing?.status === 'sent' || existing?.status === 'reserved') return false;
    if (existing?.status === 'error') {
      const r = db
        .prepare(
          `UPDATE timing_email_log SET status='reserved', sent_at=datetime('now'), meta=?
           WHERE email=? AND category=? AND campaign=? AND status='error'`,
        )
        .run(JSON.stringify({ reservedAt: new Date().toISOString() }), email, LOG_CATEGORY, campaign);
      return r.changes > 0;
    }
    const r = db
      .prepare(
        `INSERT OR IGNORE INTO timing_email_log (id, email, category, campaign, report_id, status, meta)
         VALUES (?, ?, ?, ?, NULL, 'reserved', ?)`,
      )
      .run(
        `tel_${generateId()}`,
        email,
        LOG_CATEGORY,
        campaign,
        JSON.stringify({ kind: 'astro_daily', reservedAt: new Date().toISOString() }),
      );
    return r.changes > 0;
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

function mark(email: string, campaign: string, status: 'sent' | 'error', meta: Record<string, unknown>) {
  const db = openDb(false);
  if (!db) return;
  try {
    db.prepare(
      `UPDATE timing_email_log SET status=?, sent_at=datetime('now'), meta=?
       WHERE email=? AND category=? AND campaign=?`,
    ).run(status, JSON.stringify(meta), email, LOG_CATEGORY, campaign);
  } catch {
    // soft
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

async function dispatch(params: { email: string; subject: string; html: string; text: string }) {
  const emailModule = await import('@/lib/email');
  if (typeof (emailModule as any).sendEmail === 'function') {
    return (emailModule as any).sendEmail({
      to: params.email,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
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
  const r = result as { ok?: boolean; success?: boolean; error?: string };
  if (r.ok === false || r.success === false) return false;
  if (r.error) return false;
  return true;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const dryRun =
    ['1', 'true', 'yes'].includes((url.searchParams.get('dryRun') || url.searchParams.get('dry_run') || '').toLowerCase());
  const limit = Math.min(
    MAX_BATCH,
    Math.max(1, Number(url.searchParams.get('limit') || DEFAULT_BATCH) || DEFAULT_BATCH),
  );
  const date = (url.searchParams.get('date') || todayIsoLocal()).trim();
  const campaign = date;

  const sample = buildAstroDailyEmail({ date, locale: url.searchParams.get('locale') });
  if (!sample.ok) {
    return NextResponse.json({ success: false, error: sample.reason || 'build_failed', date }, { status: 500 });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      date,
      subject: sample.subject,
      previewText: sample.text.slice(0, 400),
      htmlLength: sample.html.length,
    });
  }

  const { rows, dbAvailable } = listSubscribers(limit);
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!reserve(row.email, campaign)) {
      skipped += 1;
      continue;
    }
    const built = buildAstroDailyEmail({ date, email: row.email });
    if (!built.ok) {
      failed += 1;
      mark(row.email, campaign, 'error', { error: built.reason });
      continue;
    }
    try {
      const result = await dispatch({
        email: row.email,
        subject: built.subject,
        html: built.html,
        text: built.text,
      });
      if (isSendOk(result)) {
        sent += 1;
        mark(row.email, campaign, 'sent', { date, at: new Date().toISOString() });
      } else {
        failed += 1;
        const err = JSON.stringify(result).slice(0, 300);
        errors.push(err);
        mark(row.email, campaign, 'error', { error: err });
      }
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      mark(row.email, campaign, 'error', { error: msg.slice(0, 300) });
    }
  }

  return NextResponse.json({
    success: true,
    dryRun: false,
    date,
    dbAvailable,
    candidates: rows.length,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 5),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
