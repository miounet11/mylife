import 'server-only';

import { GOOGLE_ANALYTICS_ID } from '@/lib/google-analytics-config';

const GOOGLE_ANALYTICS_API_SECRET = `${process.env.GA4_API_SECRET || ''}`.trim();
const GOOGLE_ANALYTICS_MP_ENDPOINT = `${process.env.GA4_MEASUREMENT_PROTOCOL_REGION || ''}`.trim().toLowerCase() === 'eu'
  ? 'https://region1.google-analytics.com/mp/collect'
  : 'https://www.google-analytics.com/mp/collect';

const FORWARDED_SERVER_EVENTS = new Set([
  'auth_code_requested',
  'auth_verified',
  'newsletter_subscribed',
  'report_generated',
  'report_feedback_synced',
  'report_monthly_digest_sent',
  'report_upgrade_requested',
  'premium_service_requested',
  'premium_service_status_updated',
  'email_delivery_succeeded',
  'email_delivery_failed',
  'email_retry_enqueued',
  'email_retry_processed',
]);

const EVENT_PARAM_ALLOWLIST: Record<string, string[]> = {
  auth_code_requested: ['channel'],
  auth_verified: ['method'],
  newsletter_subscribed: ['source', 'status'],
  report_generated: ['reportId', 'reportVersion', 'reasoningMode', 'deliveryTier', 'qualityGrade', 'qualityScore', 'llmUsed'],
  report_feedback_synced: ['reportId', 'linkedEventCount', 'accurateCount', 'driftCount', 'pendingCount'],
  report_monthly_digest_sent: ['reportId', 'cycleKey', 'deliveryTier', 'qualityGrade'],
  report_upgrade_requested: ['reportId', 'reason', 'status', 'source'],
  premium_service_requested: ['serviceKey', 'reportId', 'priority', 'source'],
  premium_service_status_updated: ['serviceKey', 'reportId', 'status', 'priority'],
  email_delivery_succeeded: ['kind', 'reportId', 'serviceKey', 'cycleKey'],
  email_delivery_failed: ['kind', 'reportId', 'serviceKey', 'cycleKey', 'error'],
  email_retry_enqueued: ['kind', 'reportId', 'serviceKey', 'cycleKey', 'attempts'],
  email_retry_processed: ['kind', 'reportId', 'serviceKey', 'cycleKey', 'attempts', 'status'],
};

function sanitizeEventName(eventName: string) {
  return eventName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
}

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

function sanitizeParams(params: Record<string, unknown>) {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    const normalized = normalizeValue(value);
    if (normalized === undefined) {
      continue;
    }

    sanitized[key] = normalized;
  }

  return sanitized;
}

function buildSessionNumber(seed?: string | null) {
  const normalized = `${seed || ''}`.trim();
  if (!normalized) {
    return undefined;
  }

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

function buildEventParams(eventName: string, input: {
  page?: string;
  sessionId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const allowedKeys = EVENT_PARAM_ALLOWLIST[eventName] || [];
  const filteredMeta = Object.fromEntries(
    Object.entries(input.meta || {}).filter(([key]) => allowedKeys.includes(key))
  );

  return sanitizeParams({
    page: input.page,
    session_id: buildSessionNumber(input.sessionId),
    engagement_time_msec: 1,
    ...filteredMeta,
  });
}

export async function forwardServerAnalyticsEventToGoogleAnalytics(input: {
  eventName: string;
  userId?: string | null;
  sessionId?: string | null;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if (!GOOGLE_ANALYTICS_ID || !GOOGLE_ANALYTICS_API_SECRET) {
    return;
  }

  if (!FORWARDED_SERVER_EVENTS.has(input.eventName)) {
    return;
  }

  const clientId = `${input.sessionId || input.userId || ''}`.trim();
  if (!clientId) {
    return;
  }

  try {
    await fetch(
      `${GOOGLE_ANALYTICS_MP_ENDPOINT}?measurement_id=${encodeURIComponent(GOOGLE_ANALYTICS_ID)}&api_secret=${encodeURIComponent(GOOGLE_ANALYTICS_API_SECRET)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          user_id: input.userId || undefined,
          events: [
            {
              name: sanitizeEventName(input.eventName),
              params: buildEventParams(input.eventName, input),
            },
          ],
        }),
      }
    );
  } catch (error) {
    console.error('[GoogleAnalytics] Measurement Protocol forward failed:', error);
  }
}
