/**
 * Client analytics (production-compatible).
 * - Enriches device profile when helpers exist
 * - Uses sendBeacon so Link navigation does not drop hits
 */
import type { AnalyticsEventName } from '@/lib/analytics';

function resolveDeviceMeta(): Record<string, string> {
  if (typeof navigator === 'undefined') return {};
  try {
    // Optional: production has resolveDeviceProfile; keep soft fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/device-profile') as {
      resolveDeviceProfile?: (ua: string) => Record<string, string>;
    };
    if (typeof mod.resolveDeviceProfile === 'function') {
      return mod.resolveDeviceProfile(navigator.userAgent) || {};
    }
  } catch {
    // ignore
  }
  return {};
}

function rememberAttribution(input: {
  eventName: string;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if (
    ![
      'result_cta_clicked',
      'content_card_clicked',
      'tool_card_clicked',
      'tool_entry_clicked',
      'content_quick_analyze_started',
    ].includes(input.eventName)
  ) {
    return;
  }
  try {
    // Prefer production helper when present
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/client-attribution') as {
      rememberClientAttribution?: (v: unknown) => void;
    };
    if (typeof mod.rememberClientAttribution === 'function') {
      mod.rememberClientAttribution(input);
      return;
    }
  } catch {
    // fall through
  }
  try {
    window.localStorage.setItem(
      'lk_client_attribution_v1',
      JSON.stringify({ ...input, timestamp: new Date().toISOString() }),
    );
  } catch {
    // ignore
  }
}

function postTrack(body: object) {
  try {
    const json = JSON.stringify(body);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        '/api/analytics/track',
        new Blob([json], { type: 'application/json' }),
      );
      if (ok) return;
    }
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never block UX
  }
}

export async function trackClientEvent(input: {
  eventName: AnalyticsEventName | string;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if (typeof window === 'undefined') return;

  const enrichedMeta = {
    ...(input.meta || {}),
    ...resolveDeviceMeta(),
  };
  const page = input.page || window.location.pathname;

  rememberAttribution({
    eventName: String(input.eventName),
    page,
    meta: enrichedMeta,
  });

  // Optional GA forward (production helper)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ga = require('@/lib/google-analytics') as {
      forwardAnalyticsEventToGoogleAnalytics?: (v: unknown) => void;
    };
    ga.forwardAnalyticsEventToGoogleAnalytics?.({
      eventName: input.eventName,
      page,
      meta: enrichedMeta,
    });
  } catch {
    // ignore
  }

  postTrack({
    eventName: input.eventName,
    page,
    meta: enrichedMeta,
  });
}

export function trackAnalyticsEvent(event: string, meta?: Record<string, unknown>) {
  void trackClientEvent({ eventName: event, meta });
}
