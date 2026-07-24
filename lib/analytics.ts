import { analyticsOperations } from '@/lib/database';
import { resolveDeviceProfile } from '@/lib/device-profile';
import type { AnalyticsEventRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

export type AnalyticsEventName =
  | 'home_page_viewed'
  | 'analyze_page_viewed'
  | 'chat_page_viewed'
  | 'dashboard_page_viewed'
  | 'events_page_viewed'
  | 'profile_page_viewed'
  | 'history_page_viewed'
  | 'updates_page_viewed'
  | 'docs_page_viewed'
  | 'docs_article_viewed'
  | 'knowledge_page_viewed'
  | 'knowledge_article_viewed'
  | 'cases_page_viewed'
  | 'case_article_viewed'
  | 'insights_page_viewed'
  | 'insight_article_viewed'
  | 'tools_page_viewed'
  | 'dimensions_page_viewed'
  | 'dimension_page_viewed'
  | 'tool_detail_viewed'
  | 'tool_result_viewed'
  | 'content_card_clicked'
  | 'tool_card_clicked'
  | 'visual_asset_viewed'
  | 'content_quick_analyze_started'
  | 'tool_run_started'
  | 'tool_image_upload_started'
  | 'tool_image_upload_material_added'
  | 'tool_run_completed'
  | 'analyze_submitted'
  | 'analyze_completed'
  | 'analyze_failed'
  | 'report_generated'
  | 'report_feedback_synced'
  | 'report_monthly_digest_sent'
  | 'report_viewed'
  | 'report_upgrade_requested'
  | 'result_cta_clicked'
  | 'result_chat_started'
  | 'report_to_chat_completed'
  | 'auth_code_requested'
  | 'auth_verified'
  | 'newsletter_subscribed'
  | 'email_delivery_succeeded'
  | 'email_delivery_failed'
  | 'email_retry_enqueued'
  | 'email_retry_processed'
  | 'chat_message_sent'
  | 'chat_completed'
  | 'chat_failed'
  | 'chat_context_loaded'
  | 'chat_followup_clicked'
  | 'chat_event_saved'
  | 'chat_feedback'
  | 'chat_opening_shown'
  | 'chat_starter_clicked'
  | 'chat_topic_chip'
  | 'chat_greeting_swiped'
  | 'chat_efc_flagged'
  | 'chat_structure_scored'
  | 'chat_fab_clicked'
  | 'chat_fab_dismissed'
  | 'premium_service_requested'
  | 'premium_service_status_updated'
  | 'event_created'
  | 'report_event_saved_from_result'
  | 'report_past_event_saved_from_result'
  | 'event_feedback_recorded'
  | 'event_updated'
  | 'event_deleted'
  | 'llm_model_attempt'
  | 'llm_model_circuit_changed'
  | 'report_followup_augmented'
  | 'article_scroll_depth'
  | 'article_cta_impressed'
  | 'article_cta_clicked'
  | 'article_session_end'
  | 'today_card_viewed'
  | 'today_card_cta_clicked'
  | 'newsletter_bar_dismissed'
  | 'analyze_form_started'
  | 'mass_report_viewed'
  | 'mass_decision_copied'
  | 'mass_decision_printed'
  | 'mass_revisit_marked'
  | 'mass_prediction_seed_shown'
  | 'mass_prediction_outcome'
  | 'mass_prediction_to_event'
  | 'mass_need_map_click'
  | 'hehun_page_viewed'
  | 'hehun_run'
  | 'hehun_prefill_used'
  | 'events_created'
  | 'events_feedback'
  | 'chat_anchor_loaded'
  | 'timing_window_viewed'
  | 'expert_view_opened'
  | 'expert_handoff_copied'
  | 'expert_print_clicked'
  | 'expert_crm_saved'
  | 'expert_crm_script_copied'
  | 'expert_crm_desk_viewed'
  | 'expert_dayun_grid_viewed'
  | 'tool_entry_clicked'
  | 'portal_rail_clicked'
  | 'predictions_page_viewed'
  | 'hehun_workspace_viewed'
  | 'expert_crm_page_viewed'
  | 'fengshui_space_lab_viewed'
  | 'fengshui_opening_suggest'
  | 'fengshui_space_saved';

interface TrackEventInput {
  userId?: string | null;
  sessionId?: string | null;
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
  forwardToGoogleAnalytics?: boolean;
  userAgent?: string | null;
}

async function queueGoogleAnalyticsForward(input: {
  eventName: AnalyticsEventName;
  userId?: string | null;
  sessionId?: string | null;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const { forwardServerAnalyticsEventToGoogleAnalytics } = await import('@/lib/google-analytics-server');
    await forwardServerAnalyticsEventToGoogleAnalytics(input);
  } catch (error) {
    console.error('[Analytics] google analytics forward skipped:', error);
  }
}

export function trackServerEvent(input: TrackEventInput) {
  try {
    const baseMeta = input.meta || {};
    const deviceProfile = input.userAgent ? resolveDeviceProfile(input.userAgent) : null;
    const meta = deviceProfile
      ? {
          ...baseMeta,
          deviceType: typeof baseMeta.deviceType === 'string' ? baseMeta.deviceType : deviceProfile.deviceType,
          os: typeof baseMeta.os === 'string' ? baseMeta.os : deviceProfile.os,
          browser: typeof baseMeta.browser === 'string' ? baseMeta.browser : deviceProfile.browser,
        }
      : baseMeta;
    const payload: AnalyticsEventRecord = {
      id: `evt_${generateId()}`,
      userId: input.userId || undefined,
      sessionId: input.sessionId || undefined,
      eventName: input.eventName,
      page: input.page,
      meta,
    };

    analyticsOperations.create(payload);
    if (input.forwardToGoogleAnalytics !== false) {
      void queueGoogleAnalyticsForward({
        eventName: input.eventName,
        userId: input.userId,
        sessionId: input.sessionId,
        page: input.page,
        meta,
      });
    }
  } catch (error) {
    console.error('[Analytics] trackServerEvent failed:', error);
  }
}
