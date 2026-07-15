'use client';

import { useEffect, useMemo, useState } from 'react';
import DimensionRecommendationsPanel from '@/components/dimensions/dimension-recommendations-panel';
import {
  mergeLearningProgress,
  recommendDimensions,
  resolveRecommendationIntent,
} from '@/lib/dimensions/recommendations';
import type { ProfileIntent } from '@/lib/profile-settings-types';
import { PROFILE_INTENT_OPTIONS } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout } from '@/lib/utils';

const INTENT_LABEL = Object.fromEntries(
  PROFILE_INTENT_OPTIONS.map((item) => [item.key, item.label]),
) as Record<ProfileIntent, string>;

export default function DimensionRecommendations({
  intent,
  learningProgress,
  limit = 3,
  compact = false,
  loadFromServer = false,
  title,
  description,
}: {
  intent?: ProfileIntent | null;
  learningProgress?: Record<string, number>;
  limit?: number;
  compact?: boolean;
  loadFromServer?: boolean;
  title?: string;
  description?: string;
}) {
  const [resolvedIntent, setResolvedIntent] = useState<ProfileIntent>(
    resolveRecommendationIntent(null, intent || null),
  );
  const [resolvedProgress, setResolvedProgress] = useState<Record<string, number>>(learningProgress || {});
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loadFromServer) {
      setResolvedIntent(resolveRecommendationIntent(null, intent || null));
      setResolvedProgress(learningProgress || {});
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [settingsRes, lifeProfileRes] = await Promise.all([
          fetchJsonWithTimeout<{
            success?: boolean;
            fortunes?: Array<{ intent?: string | null; isPrimary?: boolean }>;
          }>('/api/profile/settings', {
            timeoutMs: 8000,
            timeoutReason: 'dimension-rec-settings',
          }),
          fetchJsonWithTimeout<{
            success?: boolean;
            profiles?: Array<{
              learningProgress?: Record<string, number>;
              recentDimensionSlugs?: string[];
              dimensionVisitCounts?: Record<string, number>;
            }>;
            authenticated?: boolean;
          }>('/api/life-profile', {
            timeoutMs: 8000,
            timeoutReason: 'dimension-rec-life-profile',
          }),
        ]);

        if (cancelled) return;

        const fortunes = settingsRes.data?.fortunes || [];
        const primary = fortunes.find((item) => item.isPrimary) || fortunes[0];
        setResolvedIntent(resolveRecommendationIntent(primary?.intent, intent || null));

        const profiles = lifeProfileRes.data?.authenticated && Array.isArray(lifeProfileRes.data.profiles)
          ? lifeProfileRes.data.profiles
          : [];
        setResolvedProgress({
          ...(learningProgress || {}),
          ...mergeLearningProgress(profiles),
        });

        const recent = profiles.flatMap((item) => item.recentDimensionSlugs || []);
        setRecentSlugs([...new Set(recent)].slice(0, 8));
        const visits: Record<string, number> = {};
        for (const profile of profiles) {
          for (const [slug, count] of Object.entries(profile.dimensionVisitCounts || {})) {
            visits[slug] = Math.max(visits[slug] || 0, count);
          }
        }
        setVisitCounts(visits);
      } catch {
        if (!cancelled) {
          setResolvedIntent(resolveRecommendationIntent(null, intent || null));
          setResolvedProgress(learningProgress || {});
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [intent, learningProgress, loadFromServer]);

  const items = useMemo(
    () => recommendDimensions({
      intent: resolvedIntent,
      learningProgress: resolvedProgress,
      recentDimensionSlugs: recentSlugs,
      dimensionVisitCounts: visitCounts,
      limit,
    }),
    [resolvedIntent, resolvedProgress, recentSlugs, visitCounts, limit],
  );

  return (
    <DimensionRecommendationsPanel
      items={items}
      intentLabel={INTENT_LABEL[resolvedIntent]}
      title={title}
      description={description}
      compact={compact}
    />
  );
}