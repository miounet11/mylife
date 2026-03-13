import type { AnalyticsEventName } from '@/lib/analytics';

export async function trackClientEvent(input: {
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
}) {
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
