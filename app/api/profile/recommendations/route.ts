// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations } from '@/lib/database';
import {
  getSupplementRecommendations,
  listMissingRecommendations,
} from '@/lib/profile-supplement-recommendations';
import { profileSupplementOperations } from '@/lib/profile-settings-store';
import type { ProfileIntent } from '@/lib/profile-settings-types';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const fortuneId = request.nextUrl.searchParams.get('fortuneId');
    const fortune = fortuneId ? fortuneOperations.getById(fortuneId) : null;

    if (fortuneId && (!fortune || fortune.userId !== userId)) {
      return NextResponse.json({ success: false, error: '档案不存在' }, { status: 404 });
    }

    const intent = ((fortune as { intent?: string } | null)?.intent || null) as ProfileIntent | null;
    const supplements = profileSupplementOperations.listByUser(
      userId,
      fortune?.id || fortuneId || null,
    );
    const supplementMap = supplements.reduce<Record<string, Record<string, string>>>((acc, item) => {
      acc[item.domain] = item.fields;
      return acc;
    }, {});

    const recommendations = getSupplementRecommendations(intent);
    const missing = listMissingRecommendations(intent, supplementMap);

    return NextResponse.json({
      success: true,
      intent,
      recommendations,
      missing,
      missingCount: missing.length,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] profile recommendations failed:', error);
    return NextResponse.json({ success: false, error: '读取推荐失败' }, { status: 500 });
  }
}
