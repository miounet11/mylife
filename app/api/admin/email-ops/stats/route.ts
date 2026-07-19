/**
 * Life K-Line · email delivery ops stats (read-only)
 *
 * Aggregates timing_email_log for the last N days (sent / error / reserved).
 * Honest labeling: delivery stats only — no open-rate metrics.
 *
 * Auth: header `x-timing-email-cron-token` (or `x-daily-window-email-cron-token`)
 * must match env `TIMING_EMAIL_CRON_TOKEN` (or `DAILY_WINDOW_EMAIL_CRON_TOKEN`).
 *
 * Example:
 *   curl -sS \
 *     'http://127.0.0.1:3000/api/admin/email-ops/stats?days=7' \
 *     -H "x-timing-email-cron-token: $TIMING_EMAIL_CRON_TOKEN"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailOpsSnapshot } from '@/lib/email/timing-email-stats';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

function parseDays(raw: string | null): number {
  if (!raw) return 7;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 7;
  return Math.min(90, Math.max(1, Math.floor(n)));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const days = parseDays(request.nextUrl.searchParams.get('days'));
  const snapshot = getEmailOpsSnapshot({ days });

  return NextResponse.json({
    success: true,
    days: snapshot.days,
    label: snapshot.label,
    byCategory: snapshot.byCategory,
    byStatus: snapshot.byStatus,
    campaigns: snapshot.campaigns,
    errorReasons: snapshot.errorReasons,
    total: snapshot.total,
    dbAvailable: snapshot.dbAvailable,
    tablePresent: snapshot.tablePresent,
    note: snapshot.note,
    dailyWindowLastRun: snapshot.dailyWindowLastRun,
    timestamp: snapshot.timestamp,
  });
}
