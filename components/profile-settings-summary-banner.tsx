'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout } from '@/lib/utils';

export default function ProfileSettingsSummaryBanner() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ProfileSettingsResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'profile-summary-banner' },
        );
        if (response.ok && data.success) {
          setSettings(data);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-[12px] text-[color:var(--ink-5)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        正在读取资料完整度…
      </div>
    );
  }

  if (!settings?.fortunes.length) {
    return null;
  }

  const href = settings.activeFortuneId
    ? `/profile/settings?fortuneId=${encodeURIComponent(settings.activeFortuneId)}`
    : '/profile/settings';

  return (
    <section className="border-y border-[color:var(--hairline)] py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">测算资料</div>
          <h2 className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">
            完整度 {settings.completeness}%
            {settings.completeness < 60 ? (
              <span className="ml-1 text-[12px] font-normal text-[color:var(--ink-5)]">
                · 补充后提醒会更准
              </span>
            ) : null}
          </h2>
          {settings.topMissingRecommendations?.length ? (
            <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
              还可补充：
              {settings.topMissingRecommendations
                .slice(0, 3)
                .map((m) => m.label)
                .join('、')}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            和老师补充
          </Link>
          <Link href={href} className="text-[color:var(--ink-1)] underline-offset-2 hover:underline">
            编辑资料
          </Link>
        </div>
      </div>
    </section>
  );
}
