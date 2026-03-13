'use client';

import { useEffect } from 'react';
import type { AnalyticsEventName } from '@/lib/analytics';
import { trackClientEvent } from '@/lib/analytics-client';

interface AnalyticsPageViewProps {
  eventName: AnalyticsEventName;
  page: string;
  meta?: Record<string, unknown>;
}

export default function AnalyticsPageView({ eventName, page, meta = {} }: AnalyticsPageViewProps) {
  const metaKey = JSON.stringify(meta);

  useEffect(() => {
    const parsedMeta = JSON.parse(metaKey) as Record<string, unknown>;
    void trackClientEvent({
      eventName,
      page,
      meta: parsedMeta,
    });
  }, [eventName, page, metaKey]);

  return null;
}
