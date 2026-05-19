// v5-D37 今日一签 API
// GET /api/today/[fortuneId] -> { success, data: TodayCardData }
//
// 权限：fortune.isPublic === false 时仅 owner 可访问；公开档案任何人可访问。
// 缓存：lib/today-card 已做进程内 24h memoize；route 自身设置短 CDN cache。

import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';
import { buildTodayCardMemoized } from '@/lib/today-card';
import { trackServerEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { fortuneId } = (await params) as { fortuneId: string };
    if (!fortuneId) {
      return NextResponse.json({ success: false, error: '缺少 fortuneId' }, { status: 400 });
    }

    const fortune = fortuneOperations.getById(fortuneId);
    if (!fortune) {
      return NextResponse.json({ success: false, error: '未找到档案' }, { status: 404 });
    }

    const currentUserId = await getCurrentUserId();
    const canManage = !!currentUserId && fortune.userId === currentUserId;
    if (fortune.isPublic === false && !canManage) {
      return NextResponse.json({ success: false, error: '档案不可访问' }, { status: 404 });
    }

    const card = buildTodayCardMemoized(fortune as any);
    if (!card) {
      return NextResponse.json(
        { success: false, error: '档案缺少有效 bazi 数据' },
        { status: 422 }
      );
    }

    // 一次 view 计数：用于跑 D1/D7 留存
    try {
      trackServerEvent({
        eventName: 'today_card_viewed',
        page: `/api/today/${fortuneId}`,
        meta: {
          fortuneId,
          date: card.date,
          tone: card.toneLabel,
          shiShen: card.todayShiShen || 'unknown',
          isOwner: canManage,
        },
      });
    } catch {
      // 埋点失败不影响主链路
    }

    return NextResponse.json(
      { success: true, data: card },
      {
        headers: {
          // 60s 边缘缓存，命中后 2 小时仍可 stale-while-revalidate
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('[api/today] failed:', err);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
