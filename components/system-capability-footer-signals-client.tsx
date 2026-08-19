'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';

import {
  SystemCapabilityFooterSignals,
  SystemCapabilityFooterSignalsFallback,
} from '@/components/system-capability-panel';
import type { SystemCapabilityStats } from '@/lib/system-capability-stats';

export default function SystemCapabilityFooterSignalsClient() {
  const { locale } = useLocale();
  const [stats, setStats] = useState<SystemCapabilityStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/system-capability-stats', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: SystemCapabilityStats | null) => {
        if (!cancelled && payload) {
          setStats(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return <SystemCapabilityFooterSignalsFallback locale={locale} />;
  }

  return <SystemCapabilityFooterSignals stats={stats} locale={locale} />;
}