// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  listPredictionsForUser,
  upsertPredictionsForUser,
} from '@/lib/predictions/server-store';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());

    const predictions = listPredictionsForUser(userId);
    return NextResponse.json({
      success: true,
      predictions,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] predictions GET failed:', error);
    return NextResponse.json({ success: false, error: '读取预测失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    // Guest cookie identity is enough; subscription is not required for prediction sync.
    const userId = session.user?.id || (await getOrCreateGuestUserId());

    const body = await request.json();
    const raw = Array.isArray(body?.predictions) ? body.predictions : [];
    if (!raw.length) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    // Normalize thin client payloads so guest sync never fails on NOT NULL columns.
    const predictions = raw.map((item: any, index: number) => {
      const now = new Date().toISOString();
      const dueDate =
        typeof item?.dueDate === 'string' && item.dueDate.trim()
          ? item.dueDate.trim()
          : now.slice(0, 10);
      return {
        id: item?.id || `pred_${userId}_${Date.now()}_${index}`,
        reportId: item?.reportId || item?.report_id || '',
        birthSignature: item?.birthSignature || item?.birth_signature || '',
        category: item?.category || 'timing',
        statement: item?.statement || item?.text || '待补充预测',
        confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : 0.55,
        dueDate,
        window: item?.window || item?.window_label || undefined,
        evidence: item?.evidence || '',
        verifyChecklist: Array.isArray(item?.verifyChecklist) ? item.verifyChecklist : [],
        outcome: item?.outcome || 'pending',
        userFeedback: item?.userFeedback,
        createdAt: item?.createdAt || now,
        source: item?.source || 'report',
      };
    });

    const saved = upsertPredictionsForUser(userId, predictions);
    return NextResponse.json({
      success: true,
      saved,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] predictions POST failed:', error);
    return NextResponse.json({ success: false, error: '保存预测失败' }, { status: 500 });
  }
}
