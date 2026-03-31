import type { AnalyticsEventName } from '@/lib/analytics';
import { rememberClientAttribution } from '@/lib/client-attribution';
import { forwardAnalyticsEventToGoogleAnalytics } from '@/lib/google-analytics';

export async function trackClientEvent(input: {
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if ([
    'result_cta_clicked',
    'content_card_clicked',
    'tool_card_clicked',
    'content_quick_analyze_started',
  ].includes(input.eventName)) {
    rememberClientAttribution(input);
  }

  forwardAnalyticsEventToGoogleAnalytics(input);

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName: input.eventName,
        page: input.page,
        meta: input.meta || {},
      }),
      keepalive: true,
    });
  } catch {
    // Client analytics should never interrupt primary interactions.
  }
}
