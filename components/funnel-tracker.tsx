'use client';

import React, { useEffect } from 'react';
import {
  PRODUCT_FUNNEL_EVENTS,
  type FunnelEventName,
} from '@/lib/product-analytics-events';

type FunnelEvent = FunnelEventName;

type FunnelPayload = {
  event: FunnelEvent;
  detail: Record<string, string>;
  path: string;
  search: string;
  referrer: string;
  ts: string;
};

const allowed = new Set<string>(PRODUCT_FUNNEL_EVENTS);

function sendFunnelPayload(payload: FunnelPayload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/funnel', new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch('/api/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackFunnel(event: FunnelEvent | string, detail: Record<string, string> = {}) {
  if (typeof window === 'undefined') return;
  if (!allowed.has(event)) {
    // still allow product dual-track via cast after whitelist expand
    if (!event.startsWith('mass_') && !event.startsWith('expert_') && !event.startsWith('hehun_')) {
      // drop unknown to protect funnel API
      return;
    }
  }

  const payload: FunnelPayload = {
    event: event as FunnelEvent,
    detail,
    path: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    ts: new Date().toISOString(),
  };

  try {
    const key = 'life-kline:funnel-events';
    const previous = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...previous.slice(-49), payload]));
  } catch {
    // Funnel tracking must never block the user journey.
  }

  sendFunnelPayload(payload);
}

export function FunnelPageView({
  event,
  sourceFallback = 'direct',
}: {
  event: FunnelEvent;
  sourceFallback?: string;
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackFunnel(event, { source: params.get('source') || sourceFallback });
  }, [event, sourceFallback]);

  return null;
}

export function FunnelLink({
  event,
  detail = {},
  href,
  className,
  children,
  ...rest
}: {
  event: FunnelEvent;
  detail?: Record<string, string>;
  href: string;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        trackFunnel(event, detail);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
