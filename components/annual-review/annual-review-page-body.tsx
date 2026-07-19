'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AnnualReviewCard from '@/components/annual-review/annual-review-card';
import { buildAnnualReview } from '@/lib/annual-review/build-review';
import { annualReviewBodyCopy } from '@/lib/i18n/annual-review-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { shouldShowAnnualReviewEmailGate } from '@/lib/life-profile/calibration-status';
import { getOrCreateProfile, hydrateLifeProfilesFromServer } from '@/lib/life-profile/store';
import { getAllPredictions, hydratePredictionsFromServer } from '@/lib/predictions/store';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout } from '@/lib/utils';
import type { Prediction } from '@/lib/predictions/types';

const YEAR_OPTIONS = Array.from({ length: 4 }, (_, index) => new Date().getFullYear() - index);

export default function AnnualReviewPageBody({ locale = 'zh-CN' }: { locale?: SiteLocale }) {
  const copy = annualReviewBodyCopy(locale);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(YEAR_OPTIONS[1] ?? new Date().getFullYear() - 1);
  const [birthSignature, setBirthSignature] = useState('');
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'annual-review-settings' },
        );
        if (!response.ok || !data.success) {
          setError(copy.errorNoSettings);
          return;
        }

        const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
        if (!primary?.birthDate) {
          setError(copy.errorNoBirth);
          return;
        }

        setAccountEmail(data.account?.email || null);
        await Promise.all([hydrateLifeProfilesFromServer(), hydratePredictionsFromServer()]);
        setPredictions(getAllPredictions());
        setProfileVersion((value) => value + 1);
        setBirthSignature(
          buildBirthSignature({
            birthDate: primary.birthDate,
            birthTime: primary.birthTime,
            birthPlace: primary.birthPlace,
            birthAccuracy: primary.birthAccuracy,
            gender: primary.gender,
          }),
        );
      } catch {
        setError(copy.errorLoadFailed);
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; copy is locale-stable for the page
  }, []);

  const review = useMemo(() => {
    if (!birthSignature) return null;
    const profile = getOrCreateProfile(birthSignature);
    return buildAnnualReview(profile, year, { predictions });
  }, [birthSignature, year, profileVersion, predictions]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  if (error) {
    return (
      <section className="fb-card p-5">
        <p className="text-sm text-[color:var(--ink-3)]">{error}</p>
        <Link href="/analyze" className="fb-btn fb-btn-primary mt-4 h-9 px-4 text-sm hover:no-underline">
          {copy.ctaCreateProfile}
        </Link>
      </section>
    );
  }

  if (!review) return null;

  const hasData =
    review.totalPredictions > 0 ||
    review.feedbackCount > 0 ||
    review.highlights.length > 0 ||
    review.misses.length > 0;

  const showEmailGate = shouldShowAnnualReviewEmailGate({
    hitRate: review.hitRate,
    hasEmail: Boolean(accountEmail),
  });

  return (
    <div className="space-y-4">
      {showEmailGate ? (
        <section className="fb-card border-[color:var(--warning-border,#f5d9a8)] bg-[color:var(--warning-soft,#fff8eb)] p-4 md:p-5">
          <div className="lk-section-eyebrow text-[color:var(--warning-strong,#9a6700)]">
            {copy.emailGateEyebrow}
          </div>
          <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
            {copy.emailGateTitle(Math.round(review.hitRate * 100))}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">{copy.emailGateBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/membership?intent=annual_review_gate" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              {copy.emailGateBind}
            </Link>
            <Link href="/predictions" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              {copy.emailGatePredictions}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="fb-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
            {copy.yearEyebrow}
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">{copy.yearDescription}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-2)]">
          {copy.yearLabel}
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-9 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-white px-3 text-sm"
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {copy.yearOption(option)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {hasData ? (
        <AnnualReviewCard review={review} locale={locale} />
      ) : (
        <section className="fb-card p-5">
          <h2 className="text-sm font-bold text-[color:var(--ink-1)]">{copy.emptyTitle(year)}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">{copy.emptyBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/predictions" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              {copy.emptyCtaPredictions}
            </Link>
            <Link href="/profile/events" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              {copy.emptyCtaEvents}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
