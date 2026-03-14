import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent, type AnalyticsEventName } from '@/lib/analytics';
import { getCurrentUserId } from '@/lib/user-utils';

const ALLOWED_EVENTS = new Set<AnalyticsEventName>([
  'home_page_viewed',
  'analyze_page_viewed',
  'chat_page_viewed',
  'events_page_viewed',
  'profile_page_viewed',
  'history_page_viewed',
  'updates_page_viewed',
  'knowledge_page_viewed',
  'knowledge_article_viewed',
  'cases_page_viewed',
  'case_article_viewed',
  'insights_page_viewed',
  'insight_article_viewed',
  'content_card_clicked',
  'content_quick_analyze_started',
  'report_viewed',
  'chat_followup_clicked',
  'result_cta_clicked',
  'report_upgrade_requested',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventName = body?.eventName as AnalyticsEventName | undefined;
    const page = typeof body?.page === 'string' ? body.page : undefined;
    const meta = body?.meta && typeof body.meta === 'object' ? body.meta : {};

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json(
        { success: false, error: '不支持的埋点事件' },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserId();
    trackServerEvent({
      userId,
      sessionId: userId,
      eventName,
      page,
      meta,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Analytics] track route failed:', error);
    return NextResponse.json(
      { success: false, error: '埋点失败' },
      { status: 500 }
    );
  }
}
