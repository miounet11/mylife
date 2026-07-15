import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent, type AnalyticsEventName } from '@/lib/analytics';
import { fortuneOperations } from '@/lib/database';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { isLikelyTestReportName } from '@/lib/report-sample-classifier';
import { getCurrentUserId } from '@/lib/user-utils';
import { getClientKey } from '@/lib/rate-limit';

const ALLOWED_EVENTS = new Set<AnalyticsEventName>([
  'home_page_viewed',
  'analyze_page_viewed',
  'chat_page_viewed',
  'events_page_viewed',
  'profile_page_viewed',
  'history_page_viewed',
  'updates_page_viewed',
  'docs_page_viewed',
  'docs_article_viewed',
  'knowledge_page_viewed',
  'knowledge_article_viewed',
  'cases_page_viewed',
  'case_article_viewed',
  'insights_page_viewed',
  'insight_article_viewed',
  'tools_page_viewed',
  'tool_detail_viewed',
  'tool_result_viewed',
  'content_card_clicked',
  'tool_card_clicked',
  'visual_asset_viewed',
  'content_quick_analyze_started',
  'tool_run_started',
  'tool_image_upload_started',
  'tool_image_upload_material_added',
  'tool_run_completed',
  'report_viewed',
  'chat_followup_clicked',
  'result_cta_clicked',
  'report_upgrade_requested',
  'report_past_event_saved_from_result',
  'mass_report_viewed',
  'mass_decision_copied',
  'mass_decision_printed',
  'mass_revisit_marked',
  'mass_prediction_seed_shown',
  'mass_prediction_outcome',
  'mass_prediction_to_event',
  'mass_need_map_click',
  'hehun_page_viewed',
  'hehun_run',
  'hehun_prefill_used',
  'events_created',
  'events_feedback',
  'chat_anchor_loaded',
  'timing_window_viewed',
  'expert_view_opened',
  'expert_handoff_copied',
  'expert_print_clicked',
  'expert_crm_saved',
  'expert_crm_script_copied',
  'expert_crm_desk_viewed',
  'expert_dayun_grid_viewed',
  'tool_entry_clicked',
  'portal_rail_clicked',
  'predictions_page_viewed',
  'hehun_workspace_viewed',
  'expert_crm_page_viewed',
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

    const currentUserId = await getCurrentUserId();
    const sessionId = getClientKey(request);
    trackServerEvent({
      userId: currentUserId || undefined,
      sessionId,
      userAgent: request.headers.get('user-agent'),
      eventName,
      page,
      meta,
      forwardToGoogleAnalytics: false,
    });

    if (eventName === 'report_viewed') {
      enqueueViewedReportUpgrade(meta);
    }

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

function enqueueViewedReportUpgrade(meta: Record<string, unknown>) {
  try {
    const reportId = typeof meta.reportId === 'string' ? meta.reportId.trim() : '';
    if (!reportId) {
      return;
    }

    const report = fortuneOperations.getById(reportId);
    if (!report || isLikelyTestReportName(report.name)) {
      return;
    }

    const qualityAudit = report.analysis?.qualityAudit;
    if (qualityAudit?.targetAchieved) {
      return;
    }

    const deliveryTier = qualityAudit?.deliveryTier || 'basic';
    const llmUsed = !!report.analysis?.llmUsed;
    if (deliveryTier !== 'basic' && llmUsed) {
      return;
    }

    enqueueReportUpgrade({
      report,
      reason: 'real_user_report_viewed',
      meta: {
        realUserPriority: true,
        viewedFromAnalytics: true,
        viewSource: typeof meta.source === 'string' ? meta.source : null,
        deliveryTier,
        llmUsed,
      },
    });
  } catch (error) {
    console.error('[Analytics] failed to enqueue viewed report upgrade:', error);
  }
}
