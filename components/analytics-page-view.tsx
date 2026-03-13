'use client';

import { useEffect } from 'react';

interface AnalyticsPageViewProps {
  eventName: 'report_viewed';
  page: string;
  meta?: Record<string, unknown>;
}

export default function AnalyticsPageView({ eventName, page, meta = {} }: AnalyticsPageViewProps) {
  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        page,
        meta,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Page view analytics should never interrupt the page.
    });

    return () => controller.abort();
  }, [eventName, page, meta]);

  return null;
}
