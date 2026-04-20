'use client';

import { useEffect, useState } from 'react';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import type { PersonalGrowthHubSummary } from '@/lib/personal-growth-hub';
import type { PersonalizedJourneySummary } from '@/lib/surface-journeys';

export default function PersonalJourneyHub({
  title,
  description,
  page = '/profile',
}: {
  title?: string;
  description?: string;
  page?: string;
}) {
  const [summary, setSummary] = useState<(PersonalizedJourneySummary & { growthHub?: PersonalGrowthHubSummary | null }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/journey/summary', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok && data.success && data.data) {
          setSummary(data.data as PersonalizedJourneySummary & { growthHub?: PersonalGrowthHubSummary | null });
        }
      } catch {
        // ignore fallback
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || !summary) {
    return null;
  }

  return (
    <div className="space-y-8">
      {summary.growthHub ? (
        <PersonalGrowthPanel summary={summary.growthHub} page={page} />
      ) : null}
      <SurfaceJourneyPanel
        journey={summary.journey}
        title={title || summary.heading}
        description={description || ''}
      />
    </div>
  );
}
