// @ts-nocheck
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { eventOperations, fortuneOperations } from '@/lib/database';
import { normalizeEventTransportRecords } from '@/lib/event-view';
import { getSavedReports } from '@/lib/membership-store';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function loadFortunesForUser(userId: string) {
  const ops = fortuneOperations as {
    getByUserId?: (id: string) => any[];
    listByUser?: (id: string) => any[];
  };
  const rows = ops.getByUserId?.(userId) || ops.listByUser?.(userId) || [];
  return Array.isArray(rows) ? rows : [];
}

function loadEventsForUser(userId: string) {
  const ops = eventOperations as {
    getByUserId?: (id: string) => any[];
    listByUser?: (id: string) => any[];
  };
  const rows = ops.getByUserId?.(userId) || ops.listByUser?.(userId) || [];
  return Array.isArray(rows) ? rows : [];
}

function mapFortuneToHistoryItem(fortune: any) {
  return {
    id: fortune.id,
    intent: fortune.intent || fortune.analysis?.intent || null,
    birthAccuracy: fortune.birthAccuracy || fortune.birth_accuracy || null,
    createdAt: fortune.createdAt || fortune.created_at || new Date().toISOString(),
    birthDate: fortune.birthDate || fortune.birth_date || undefined,
    name: fortune.name || undefined,
    relation: fortune.relation || undefined,
    relationLabel: fortune.relationLabel || fortune.relation_label || undefined,
    source: 'fortune' as const,
  };
}

export async function GET() {
  try {
    // Ensure cookie guest exists so same-browser analyze history is visible without email login.
    const userId = await getOrCreateGuestUserId();
    const session = await getAuthSession();
    const effectiveUserId = session.user?.id || userId;

    const rawFortunes = loadFortunesForUser(effectiveUserId);
    const fortunes = rawFortunes
      .filter((item) => !item?.deletedAt && !item?.deleted_at)
      .slice(0, 20)
      .map(mapFortuneToHistoryItem);

    const events = normalizeEventTransportRecords(loadEventsForUser(effectiveUserId) || []).slice(0, 20);

    const email = session.user?.email || null;
    const savedReports = email
      ? getSavedReports(email, 20).map((report) => ({
          id: report.id,
          intent: report.intent,
          birthAccuracy: report.birthAccuracy,
          createdAt: report.createdAt,
          birthDate: report.birthDate,
          source: 'membership' as const,
        }))
      : [];

    // Prefer cookie fortunes for listing; append email archive that isn't already present.
    const seen = new Set(fortunes.map((item) => item.id));
    const merged = [
      ...fortunes,
      ...savedReports.filter((item) => !seen.has(item.id)),
    ].slice(0, 30);

    return NextResponse.json({
      success: true,
      authenticated: session.authenticated,
      hasSessionUser: Boolean(effectiveUserId),
      data: {
        user: session.user || { id: effectiveUserId, email: null, role: 'guest' },
        fortunes,
        events,
        savedReports,
        reports: merged,
      },
      user: session.user || { id: effectiveUserId, email: null, role: 'guest' },
      fortunes,
      events,
      savedReports,
      reports: merged,
    });
  } catch (error) {
    console.error('[API] history GET failed:', error);
    return NextResponse.json({ success: false, error: '加载历史失败' }, { status: 500 });
  }
}
