import { analyticsOperations } from '@/lib/database';
import type { AnalyticsEventRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

export type AnalyticsEventName =
  | 'home_page_viewed'
  | 'analyze_page_viewed'
  | 'chat_page_viewed'
  | 'events_page_viewed'
  | 'analyze_submitted'
  | 'report_generated'
  | 'report_viewed'
  | 'report_upgrade_requested'
  | 'result_cta_clicked'
  | 'auth_code_requested'
  | 'auth_verified'
  | 'newsletter_subscribed'
  | 'chat_message_sent'
  | 'chat_context_loaded'
  | 'chat_followup_clicked'
  | 'chat_event_saved'
  | 'event_created'
  | 'report_event_saved_from_result'
  | 'event_feedback_recorded'
  | 'event_updated'
  | 'event_deleted';

interface TrackEventInput {
  userId?: string | null;
  sessionId?: string | null;
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
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
  } catch (error) {
    console.error('[Analytics] trackServerEvent failed:', error);
  }
}
