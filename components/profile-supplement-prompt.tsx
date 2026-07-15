'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Lightbulb, Loader2, Settings2 } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import type {
  ProfileMissingRecommendationView,
  ProfileSettingsResponse,
} from '@/lib/profile-settings-types';
import { PROFILE_SUPPLEMENT_DOMAINS } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout } from '@/lib/utils';

type PromptVariant = 'report' | 'email' | 'compact';

function buildSettingsHref(
  fortuneId: string,
  item?: Pick<ProfileMissingRecommendationView, 'domain' | 'fieldKey'>,
) {
  const params = new URLSearchParams({
    fortuneId,
    tab: 'supplements',
  });
  if (item) {
    params.set('highlight', `${item.domain}:${item.fieldKey}`);
  }
  return `/profile/settings?${params.toString()}`;
}

export default function ProfileSupplementPrompt({
  fortuneId,
  canManage = false,
  variant = 'report',
}: {
  fortuneId?: string;
  canManage?: boolean;
  variant?: PromptVariant;
}) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ProfileSettingsResponse | null>(null);

  useEffect(() => {
    if (!canManage || !fortuneId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          `/api/profile/settings?fortuneId=${encodeURIComponent(fortuneId)}`,
          { timeoutMs: 8000, timeoutReason: 'profile-supplement-prompt' },
        );
        if (response.ok && data.success) {
          setSettings(data);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [canManage, fortuneId]);

  const missing = settings?.topMissingRecommendations || [];
  const completeness = settings?.completeness ?? 100;
  const shouldShow = canManage && fortuneId && completeness < 80 && missing.length > 0;

  const intentHint = settings?.completenessBreakdown?.intentHint;
  const topDomainLabels = useMemo(() => {
    const domains = settings?.completenessBreakdown?.topWeightedDomains || [];
    return domains.map((domain) => PROFILE_SUPPLEMENT_DOMAINS[domain].label);
  }, [settings]);

  if (!canManage || !fortuneId) return null;
  if (loading) {
    return (
      <div className="fb-card flex items-center gap-2 px-4 py-3 text-sm text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在读取资料完整度…
      </div>
    );
  }
  if (!shouldShow) return null;

  return (
    <section className={variant === 'compact' ? 'space-y-2' : 'space-y-3'}>
      <AlertBanner tone="warning" className={variant === 'compact' ? 'text-xs' : 'text-sm'}>
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4" />
          {variant === 'email' ? '补充资料后，邮件提醒会更准' : '补充几项资料，建议会更贴近你'}
        </span>
      </AlertBanner>
      <p className="text-xs leading-5 text-[color:var(--ink-3)]">
        完整度 {completeness}%
        {intentHint ? ` · ${intentHint}` : ''}
        {topDomainLabels.length > 0 ? ` · 优先：${topDomainLabels.join('、')}` : ''}
      </p>

      <div className="space-y-2">
        {missing.map((item) => (
          <Link
            key={`${item.domain}:${item.fieldKey}`}
            href={buildSettingsHref(fortuneId, item)}
            className="fb-card block px-3 py-2 text-left text-sm text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:no-underline"
          >
            <span className="font-semibold text-[color:var(--ink-1)]">{item.label}</span>
            <span className="mt-0.5 block text-xs text-[color:var(--ink-3)]">{item.reason}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildSettingsHref(fortuneId)} className="fb-btn fb-btn-primary h-8 px-3 text-xs hover:no-underline">
          <Settings2 className="h-3.5 w-3.5" />
          去补充资料
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {settings?.subscriptionFocus?.isSet ? (
          <span className="text-xs text-[color:var(--ink-3)]">
            {settings.subscriptionFocus.headline}
          </span>
        ) : null}
      </div>
    </section>
  );
}