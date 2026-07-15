// @ts-nocheck
import { NextResponse } from 'next/server';
import { PRODUCT_FUNNEL_EVENTS } from '@/lib/product-analytics-events';

type FunnelPayload = {
  event?: string;
  detail?: Record<string, string>;
  path?: string;
  search?: string;
  referrer?: string;
  ts?: string;
};

const allowedEvents = new Set<string>(PRODUCT_FUNNEL_EVENTS);

function cleanDetail(detail: unknown) {
  if (!detail || typeof detail !== 'object') return {};

  return Object.fromEntries(
    Object.entries(detail as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      .map(([key, value]) => [key.slice(0, 64), String(value).slice(0, 256)]),
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as FunnelPayload;

    if (!payload.event || !allowedEvents.has(payload.event)) {
      return NextResponse.json({ error: 'Invalid funnel event' }, { status: 400 });
    }

    const detail = cleanDetail(payload.detail);
    console.info('[funnel]', payload.event, {
      path: payload.path || '/',
      search: payload.search || '',
      referrer: payload.referrer || request.headers.get('referer') || '',
      detail,
      userAgent: request.headers.get('user-agent') || '',
      ts: payload.ts || new Date().toISOString(),
    });

    // best-effort persist into analytics_events when available (prod)
    try {
      const { trackServerEvent } = await import('@/lib/analytics');
      if (typeof trackServerEvent === 'function') {
        trackServerEvent({
          eventName: payload.event as never,
          page: payload.path || '/',
          meta: {
            ...detail,
            search: payload.search || '',
            referrer: payload.referrer || '',
            channel: 'funnel',
          },
          userAgent: request.headers.get('user-agent'),
          forwardToGoogleAnalytics: false,
        });
      }
    } catch {
      // local stub analytics or missing DB — ignore
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[funnel API]', err);
    return NextResponse.json({ error: err?.message || 'Invalid funnel payload' }, { status: 400 });
  }
}
