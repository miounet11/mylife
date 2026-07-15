'use client';

import { useEffect, useState } from 'react';

import {
  SystemCapabilityFooterSignals,
  SystemCapabilityFooterSignalsFallback,
} from '@/components/system-capability-panel';
import type { SystemCapabilityStats } from '@/lib/system-capability-stats';

export default function SystemCapabilityFooterSignalsClient() {
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
    return <SystemCapabilityFooterSignalsFallback />;
  }

  return <SystemCapabilityFooterSignals stats={stats} />;
}