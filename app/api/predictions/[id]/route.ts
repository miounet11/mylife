// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { updatePredictionOutcomeForUser } from '@/lib/predictions/server-store';
import type { PredictionOutcome } from '@/lib/predictions/types';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

const VALID_OUTCOMES = new Set<PredictionOutcome>(['fulfilled', 'partial', 'missed', 'pending']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());

    const { id } = await params;
    const body = await request.json();
    const outcome = body?.outcome as PredictionOutcome;
    if (!VALID_OUTCOMES.has(outcome) || outcome === 'pending') {
      return NextResponse.json({ success: false, error: '无效反馈结果' }, { status: 400 });
    }

    const updated = updatePredictionOutcomeForUser(
      userId,
      id,
      outcome,
      typeof body?.feedback === 'string' ? body.feedback : undefined,
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: '预测不存在或服务未就绪' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prediction: updated });
  } catch (error) {
    console.error('[API] predictions PATCH failed:', error);
    return NextResponse.json({ success: false, error: '更新预测失败' }, { status: 500 });
  }
}
