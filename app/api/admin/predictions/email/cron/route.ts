// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';
import { buildPredictionDueReminderEmail } from '@/lib/predictions/due-reminder-email-template';
import {
  classifyDueReminderItem,
  groupDueRemindersByEmail,
  mapPredictionToDueReminder,
  PREDICTION_DUE_OVERDUE_LOOKBACK_DAYS,
  PREDICTION_DUE_UPCOMING_DAYS,
  toDueReminderCampaign,
} from '@/lib/predictions/due-reminder';
import { generateId } from '@/lib/utils';

export const maxDuration = 60;

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

function isAuthorized(request: NextRequest): boolean {
  const tokens = [
    process.env.PREDICTION_EMAIL_CRON_TOKEN,
    process.env.TIMING_EMAIL_CRON_TOKEN,
  ].filter(Boolean);
  if (!tokens.length) return false;
  const provided = request.headers.get('x-prediction-email-cron-token')
    || request.headers.get('x-timing-email-cron-token')
    || '';
  return tokens.includes(provided);
}

type DueRow = {
  id: string;
  user_id: string;
  report_id: string;
  statement: string;
  due_date: string;
  window_label?: string | null;
  category: string;
  email: string;
  name?: string | null;
};

function readBatchSize(rawLimit: string | null): number {
  const parsed = rawLimit ? Number(rawLimit) : DEFAULT_BATCH_SIZE;
  if (!Number.isFinite(parsed)) return DEFAULT_BATCH_SIZE;
  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(parsed)));
}

function listDuePredictionRows(): DueRow[] {
  const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  try {
    return db.prepare(`
      SELECT
        p.id,
        p.user_id,
        p.report_id,
        p.statement,
        p.due_date,
        p.window_label,
        p.category,
        u.email,
        u.name
      FROM report_predictions p
      INNER JOIN users u ON u.id = p.user_id
      WHERE p.outcome = 'pending'
        AND u.email IS NOT NULL
        AND trim(u.email) != ''
        AND (
          (date(p.due_date) >= date('now') AND date(p.due_date) <= date('now', '+' || ? || ' days'))
          OR
          (date(p.due_date) < date('now') AND date(p.due_date) >= date('now', '-' || ? || ' days'))
        )
      ORDER BY p.due_date ASC
      LIMIT 500
    `).all(PREDICTION_DUE_UPCOMING_DAYS, PREDICTION_DUE_OVERDUE_LOOKBACK_DAYS) as DueRow[];
  } catch {
    return [];
  } finally {
    db.close();
  }
}

function reservePredictionEmail(email: string, campaign: string): boolean {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    const existing = db.prepare(`
      SELECT status FROM timing_email_log
      WHERE email = ? AND category = 'prediction_due' AND campaign = ?
      LIMIT 1
    `).get(email, campaign) as { status?: string } | undefined;
    if (existing?.status === 'sent') return false;

    const id = `tel_${generateId()}`;
    const result = db.prepare(`
      INSERT OR IGNORE INTO timing_email_log
        (id, email, category, campaign, report_id, status, meta)
      VALUES (?, ?, 'prediction_due', ?, NULL, 'reserved', ?)
    `).run(id, email, campaign, JSON.stringify({ reservedAt: new Date().toISOString() }));
    return result.changes > 0;
  } finally {
    db.close();
  }
}

function markPredictionEmailSent(email: string, campaign: string, meta: Record<string, unknown>) {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'sent', sent_at = datetime('now'), meta = ?
      WHERE email = ? AND category = 'prediction_due' AND campaign = ?
    `).run(JSON.stringify(meta), email, campaign);
  } finally {
    db.close();
  }
}

function markPredictionEmailFailed(email: string, campaign: string, error: string) {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'error', meta = ?
      WHERE email = ? AND category = 'prediction_due' AND campaign = ?
    `).run(JSON.stringify({ error: error.slice(0, 500) }), email, campaign);
  } finally {
    db.close();
  }
}

async function dispatchPredictionDueEmail(params: {
  email: string;
  userName?: string | null;
  items: Array<{ item: ReturnType<typeof mapPredictionToDueReminder>; bucket: 'upcoming' | 'overdue' }>;
  utmCampaign: string;
}) {
  const emailModule = await import('@/lib/email');
  const payload = buildPredictionDueReminderEmail(params);

  if (typeof emailModule.sendPredictionDueReminderEmail === 'function') {
    return emailModule.sendPredictionDueReminderEmail({
      email: params.email,
      userName: params.userName,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      utmCampaign: params.utmCampaign,
      itemCount: params.items.length,
    });
  }

  if (typeof emailModule.sendEmail === 'function') {
    return emailModule.sendEmail({
      to: params.email,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
  }

  return { ok: false, reason: 'email_sender_missing' };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const url = new URL(request.url);
  const batchSize = readBatchSize(url.searchParams.get('limit'));
  const campaign = toDueReminderCampaign();

  const rows = listDuePredictionRows();
  const enriched = rows
    .map((row) => {
      const item = mapPredictionToDueReminder(row);
      const bucket = classifyDueReminderItem(item.dueDate);
      if (!bucket) return null;
      return { item, bucket };
    })
    .filter(Boolean) as Array<{ item: ReturnType<typeof mapPredictionToDueReminder>; bucket: 'upcoming' | 'overdue' }>;

  const grouped = groupDueRemindersByEmail(enriched.map((entry) => entry.item));
  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const [email, userItems] of grouped.entries()) {
    if (sentCount >= batchSize) break;

    const itemMap = new Map(userItems.map((item) => [item.id, item]));
    const emailItems = enriched.filter((entry) => itemMap.has(entry.item.id));

    if (!reservePredictionEmail(email, campaign)) {
      skippedCount++;
      continue;
    }

    try {
      const result = await dispatchPredictionDueEmail({
        email,
        userName: userItems[0]?.userName,
        items: emailItems,
        utmCampaign: campaign,
      });

      if (result?.ok === false) {
        throw new Error(result.reason || 'send_failed');
      }

      markPredictionEmailSent(email, campaign, {
        sentAt: new Date().toISOString(),
        predictionCount: emailItems.length,
      });
      sentCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      markPredictionEmailFailed(email, campaign, message);
      errors.push(`${email}: ${message}`);
    }
  }

  return NextResponse.json({
    success: true,
    campaign,
    candidateRows: rows.length,
    recipientCount: grouped.size,
    sentCount,
    skippedCount,
    errors,
    timestamp: new Date().toISOString(),
  });
}