import { analyticsOperations } from '@/lib/database';
import type { AnalyticsEventRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

export type AnalyticsEventName =
  | 'home_page_viewed'
  | 'analyze_page_viewed'
  | 'chat_page_viewed'
  | 'events_page_viewed'
  | 'profile_page_viewed'
  | 'history_page_viewed'
  | 'updates_page_viewed'
  | 'knowledge_page_viewed'
  | 'knowledge_article_viewed'
  | 'cases_page_viewed'
  | 'case_article_viewed'
  | 'insights_page_viewed'
  | 'insight_article_viewed'
  | 'tools_page_viewed'
  | 'tool_detail_viewed'
  | 'tool_result_viewed'
  | 'content_card_clicked'
  | 'tool_card_clicked'
  | 'content_quick_analyze_started'
  | 'tool_run_started'
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
  | 'premium_service_requested'
  | 'premium_service_status_updated'
  | 'event_created'
  | 'report_event_saved_from_result'
  | 'report_past_event_saved_from_result'
  | 'event_feedback_recorded'
  | 'event_updated'
  | 'event_deleted'
  | 'llm_model_attempt'
  | 'llm_model_circuit_changed';

interface TrackEventInput {
  userId?: string | null;
  sessionId?: string | null;
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
  forwardToGoogleAnalytics?: boolean;
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
    const payload: AnalyticsEventRecord = {
      id: `evt_${generateId()}`,
      userId: input.userId || undefined,
      sessionId: input.sessionId || undefined,
      eventName: input.eventName,
      page: input.page,
      meta: input.meta || {},
    };

    analyticsOperations.create(payload);
    if (input.forwardToGoogleAnalytics !== false) {
      void queueGoogleAnalyticsForward({
        eventName: input.eventName,
        userId: input.userId,
        sessionId: input.sessionId,
        page: input.page,
        meta: input.meta,
      });
    }
  } catch (error) {
    console.error('[Analytics] trackServerEvent failed:', error);
  }
}
