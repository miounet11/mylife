/**
 * 星座周运简报 cron — tag `astro:weekly`
 * Auth: same timing email tokens
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';
import { buildAstroWeeklyEmail } from '@/lib/email/astro-weekly-email';
import { currentIsoWeekId } from '@/lib/astro/week-engine';
import { generateId } from '@/lib/utils';

export const maxDuration = 90;

const LOG_CATEGORY = 'astro_weekly';
const TAG = 'astro:weekly';
const DEFAULT_BATCH = 50;
const MAX_BATCH = 100;

function isAuthorized(request: NextRequest): boolean {
  const tokens = [
    process.env.ASTRO_WEEKLY_EMAIL_CRON_TOKEN,
    process.env.ASTRO_DAILY_EMAIL_CRON_TOKEN,
    process.env.TIMING_EMAIL_CRON_TOKEN,
  ].filter(Boolean) as string[];
  if (!tokens.length) return false;
  const provided =
    request.headers.get('x-astro-weekly-email-cron-token')
    || request.headers.get('x-astro-daily-email-cron-token')
    || request.headers.get('x-timing-email-cron-token')
    || '';
  return tokens.includes(provided);
}

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
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
  if (!db) return { rows: [] as Array<{ email: string }> };
  try {
    const rows = db
      .prepare(
        `SELECT email, tags FROM email_subscriptions
         WHERE status='active' AND email IS NOT NULL AND trim(email)!=''
         ORDER BY datetime(updated_at) ASC LIMIT ?`,
      )
      .all(Math.min(limit * 8, 800)) as Array<{ email: string; tags: string }>;
    return {
      rows: rows.filter((r) => parseTags(r.tags).includes(TAG)).slice(0, limit).map((r) => ({ email: r.email })),
    };
  } catch {
    return { rows: [] };
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
      .prepare(`SELECT status FROM timing_email_log WHERE email=? AND category=? AND campaign=? LIMIT 1`)
      .get(email, LOG_CATEGORY, campaign) as { status?: string } | undefined;
    if (existing?.status === 'sent' || existing?.status === 'reserved') return false;
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
        JSON.stringify({ kind: 'astro_weekly' }),
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

function mark(email: string, campaign: string, status: string, meta: object) {
  const db = openDb(false);
  if (!db) return;
  try {
    db.prepare(
      `UPDATE timing_email_log SET status=?, sent_at=datetime('now'), meta=? WHERE email=? AND category=? AND campaign=?`,
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
  return { ok: false, success: false };
}

function isSendOk(result: unknown): boolean {
  if (!result || typeof result !== 'object') return true;
  const r = result as { ok?: boolean; success?: boolean; error?: string };
  return r.ok !== false && r.success !== false && !r.error;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const dryRun = ['1', 'true', 'yes'].includes(
    (url.searchParams.get('dryRun') || url.searchParams.get('dry_run') || '').toLowerCase(),
  );
  const limit = Math.min(MAX_BATCH, Math.max(1, Number(url.searchParams.get('limit') || DEFAULT_BATCH) || DEFAULT_BATCH));
  const weekId = (url.searchParams.get('weekId') || currentIsoWeekId()).trim();
  const sample = buildAstroWeeklyEmail({ weekId });
  if (!sample.ok) {
    return NextResponse.json({ success: false, error: sample.reason, weekId }, { status: 500 });
  }
  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      weekId,
      subject: sample.subject,
      previewText: sample.text.slice(0, 400),
    });
  }

  const { rows } = listSubscribers(limit);
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    if (!reserve(row.email, weekId)) {
      skipped += 1;
      continue;
    }
    const built = buildAstroWeeklyEmail({ weekId, email: row.email });
    if (!built.ok) {
      failed += 1;
      mark(row.email, weekId, 'error', { error: built.reason });
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
        mark(row.email, weekId, 'sent', { weekId });
      } else {
        failed += 1;
        mark(row.email, weekId, 'error', { error: 'send_failed' });
      }
    } catch (e) {
      failed += 1;
      mark(row.email, weekId, 'error', {
        error: e instanceof Error ? e.message.slice(0, 200) : 'err',
      });
    }
  }
  return NextResponse.json({ success: true, weekId, candidates: rows.length, sent, skipped, failed });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
