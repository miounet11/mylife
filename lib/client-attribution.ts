'use client';

export interface ClientAttributionRecord {
  eventName: string;
  page?: string;
  target?: string;
  source?: string;
  toolSlug?: string;
  href?: string;
  contentType?: string;
  timestamp: string;
}

const ATTRIBUTION_KEY = 'life_kline_last_attribution_v1';
const ATTRIBUTION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function rememberClientAttribution(input: {
  eventName: string;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  if (!canUseStorage()) {
    return;
  }

  const target = typeof input.meta?.target === 'string' ? input.meta.target : '';
  const source = typeof input.meta?.source === 'string' ? input.meta.source : '';
  const toolSlug = typeof input.meta?.toolSlug === 'string' ? input.meta.toolSlug : '';
  const href = typeof input.meta?.href === 'string' ? input.meta.href : '';
  const contentType = typeof input.meta?.contentType === 'string' ? input.meta.contentType : '';

  if (!target && !source && !toolSlug && !href && !contentType) {
    return;
  }

  const payload: ClientAttributionRecord = {
    eventName: input.eventName,
    page: input.page,
    target: target || undefined,
    source: source || undefined,
    toolSlug: toolSlug || undefined,
    href: href || undefined,
    contentType: contentType || undefined,
    timestamp: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

export function getRememberedClientAttribution(): ClientAttributionRecord | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ClientAttributionRecord;
    const timestamp = new Date(parsed.timestamp).getTime();
    if (!Number.isFinite(timestamp) || (Date.now() - timestamp) > ATTRIBUTION_MAX_AGE_MS) {
      window.localStorage.removeItem(ATTRIBUTION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
