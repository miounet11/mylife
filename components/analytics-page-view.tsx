'use client';

import { useEffect } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';

export default function AnalyticsPageView({
  eventName,
  page,
  meta = {},
}: {
  eventName: string;
  page: string;
  meta?: Record<string, unknown>;
}) {
  const metaKey = JSON.stringify(meta);

  useEffect(() => {
    const parsedMeta = JSON.parse(metaKey) as Record<string, unknown>;
    void trackClientEvent({
      eventName: eventName as never,
      page,
      meta: parsedMeta,
    });
  }, [eventName, page, metaKey]);

  return null;
}
