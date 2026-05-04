import type { AnalyticsEventName } from '@/lib/analytics';
import { GOOGLE_ANALYTICS_ID } from '@/lib/google-analytics-config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const FORWARDED_ANALYTICS_EVENTS = new Set<AnalyticsEventName>([
  'content_card_clicked',
  'content_quick_analyze_started',
  'chat_followup_clicked',
  'report_upgrade_requested',
  'result_cta_clicked',
  'report_viewed',
  'report_event_saved_from_result',
  'report_past_event_saved_from_result',
]);

const EVENT_PARAM_ALLOWLIST: Partial<Record<AnalyticsEventName, string[]>> = {
  content_card_clicked: ['surfaceKey', 'targetSurfaceKey', 'contentType', 'series', 'slug', 'href', 'locale', 'market'],
  content_quick_analyze_started: ['surface', 'contentType', 'slug', 'title'],
  chat_followup_clicked: ['question', 'reportId', 'eventId', 'intent', 'source', 'ctaStrategyKey', 'sourceFamily'],
  report_upgrade_requested: ['reportId', 'source', 'reason', 'status'],
  report_viewed: ['reportId', 'isPublic', 'reportVersion', 'reasoningMode', 'pattern'],
  report_event_saved_from_result: ['reportId', 'eventType', 'source'],
  report_past_event_saved_from_result: ['reportId', 'templateKey', 'templateType', 'confidenceLabel'],
  result_cta_clicked: ['reportId', 'cta', 'surface', 'target'],
};

function normalizeValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized.slice(0, 100) : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

function sanitizeParams(meta?: Record<string, unknown>) {
  const params: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(meta || {})) {
    const normalized = normalizeValue(value);
    if (normalized === undefined) {
      continue;
    }

    params[key] = normalized;
  }

  return params;
}

function sanitizeEventName(eventName: string) {
  return eventName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
}

function buildEventParams(eventName: AnalyticsEventName, input: {
  page?: string;
  meta?: Record<string, unknown>;
}) {
  const allowedKeys = EVENT_PARAM_ALLOWLIST[eventName];
  const rawMeta = input.meta || {};
  const filteredMeta = allowedKeys
    ? Object.fromEntries(Object.entries(rawMeta).filter(([key]) => allowedKeys.includes(key)))
    : rawMeta;

  return sanitizeParams({
    page: input.page,
    ...filteredMeta,
  });
}

export function trackGoogleAnalyticsEvent(eventName: string, params?: Record<string, unknown>) {
  if (!GOOGLE_ANALYTICS_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', sanitizeEventName(eventName), sanitizeParams(params));
}

export function forwardAnalyticsEventToGoogleAnalytics(input: {
  eventName: AnalyticsEventName;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if (!FORWARDED_ANALYTICS_EVENTS.has(input.eventName)) {
    return;
  }

  trackGoogleAnalyticsEvent(input.eventName, buildEventParams(input.eventName, input));
}
