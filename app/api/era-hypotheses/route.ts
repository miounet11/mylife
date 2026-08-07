// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  deleteEraHypothesisScoreForUser,
  listEraHypothesisScoresForUser,
  upsertEraHypothesisScoresForUser,
} from '@/lib/era-hypothesis-server-store';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    const scores = listEraHypothesisScoresForUser(userId);
    return NextResponse.json({
      success: true,
      scores,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] era-hypotheses GET failed:', error);
    return NextResponse.json({ success: false, error: '读取时代假设失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    const body = await request.json();
    const raw = Array.isArray(body?.scores) ? body.scores : [];
    if (!raw.length) {
      return NextResponse.json({ success: true, saved: 0, scores: listEraHypothesisScoresForUser(userId) });
    }

    const scores = raw.map((item: any) => {
      const now = new Date().toISOString();
      const outcome = ['hit', 'partial', 'miss', 'pending'].includes(item?.outcome)
        ? item.outcome
        : 'pending';
      return {
        hypothesisId: `${item?.hypothesisId || item?.hypothesis_id || ''}`.trim(),
        outcome,
        note: item?.note ? String(item.note).slice(0, 2000) : undefined,
        scoredAt: item?.scoredAt || item?.scored_at || (outcome !== 'pending' ? now : undefined),
        updatedAt: item?.updatedAt || item?.updated_at || now,
      };
    }).filter((s: { hypothesisId: string }) => s.hypothesisId);

    const saved = upsertEraHypothesisScoresForUser(userId, scores);
    return NextResponse.json({
      success: true,
      saved,
      scores: listEraHypothesisScoresForUser(userId),
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] era-hypotheses POST failed:', error);
    return NextResponse.json({ success: false, error: '保存时代假设失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    const body = await request.json().catch(() => ({}));
    const hypothesisId = `${body?.hypothesisId || ''}`.trim();
    if (!hypothesisId) {
      return NextResponse.json({ success: false, error: '缺少 hypothesisId' }, { status: 400 });
    }
    const ok = deleteEraHypothesisScoreForUser(userId, hypothesisId);
    return NextResponse.json({
      success: ok,
      scores: listEraHypothesisScoresForUser(userId),
      authenticated: Boolean(session.authenticated),
    });
  } catch (error) {
    console.error('[API] era-hypotheses DELETE failed:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
