'use client';

import { useEffect } from 'react';
import { trackProductEvent } from '@/lib/product-analytics';

/** 报告阅读页浏览打点（大众 / 专业入口共用） */
export default function ProAnalyticsBeacon({
  reportId,
  surface,
}: {
  reportId: string;
  surface: 'mass' | 'expert';
}) {
  useEffect(() => {
    if (surface === 'mass') {
      trackProductEvent('mass_report_viewed', { reportId });
    } else {
      trackProductEvent('expert_view_opened', { reportId });
    }
  }, [reportId, surface]);
  return null;
}
