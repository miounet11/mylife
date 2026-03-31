'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GOOGLE_ANALYTICS_ID } from '@/lib/google-analytics-config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || '';

  useEffect(() => {
    if (!GOOGLE_ANALYTICS_ID || !pathname || typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname;
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}
