import type { AnalyticsEventName } from '@/lib/analytics';
import { rememberClientAttribution } from '@/lib/client-attribution';
import { resolveDeviceProfile } from '@/lib/device-profile';
import { forwardAnalyticsEventToGoogleAnalytics } from '@/lib/google-analytics';

export async function trackClientEvent(input: {
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  const deviceProfile = typeof navigator !== 'undefined'
    ? resolveDeviceProfile(navigator.userAgent)
    : { deviceType: 'unknown', os: 'unknown', browser: 'unknown' };
  const enrichedMeta = {
    ...(input.meta || {}),
    ...deviceProfile,
  };

  if ([
    'result_cta_clicked',
    'content_card_clicked',
    'tool_card_clicked',
    'content_quick_analyze_started',
  ].includes(input.eventName)) {
    rememberClientAttribution({
      ...input,
      meta: enrichedMeta,
    });
  }

  forwardAnalyticsEventToGoogleAnalytics({
    ...input,
    meta: enrichedMeta,
  });

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName: input.eventName,
        page: input.page,
        meta: enrichedMeta,
      }),
      keepalive: true,
    });
  } catch {
    // Client analytics should never interrupt primary interactions.
  }
}
