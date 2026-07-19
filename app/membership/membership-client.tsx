'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/i18n/locale-provider';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FunnelPageView, trackFunnel } from '@/components/funnel-tracker';
import AccuracyDashboard from '@/components/predictions/accuracy-dashboard';
import {
  membershipClientCopy,
  membershipPlanChrome,
} from '@/lib/i18n/membership-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { MEMBERSHIP_PLANS, type MembershipPlanId } from '@/lib/membership-plans';
import {
  getMembershipPromoCopy,
  isMembershipFreePromoActive,
  MEMBERSHIP_FREE_PROMO_END,
} from '@/lib/membership-promo';
import {
  getAccuracyStats,
  hydratePredictionsFromServer,
} from '@/lib/predictions/store';
import type { PredictionAccuracyStats } from '@/lib/predictions/types';

type MembershipStatus = {
  status: string;
  plan: MembershipPlanId | null;
  planName: string | null;
  expiresAt: string | null;
  savedReportsCount: number;
  isActive: boolean;
};

type AuthSession = {
  authenticated?: boolean;
  user?: { email?: string; id?: string } | null;
};

export default function MembershipClient({ locale: localeProp }: { locale?: SiteLocale }) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale || 'zh-CN';
  const copy = useMemo(() => membershipClientCopy(locale), [locale]);
  const promoActive = isMembershipFreePromoActive();
  const promo = useMemo(() => getMembershipPromoCopy(locale), [locale]);

  const [email, setEmail] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [source, setSource] = useState('direct');
  const [intent, setIntent] = useState('membership');
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanId>('annual');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [accuracyStats, setAccuracyStats] = useState<PredictionAccuracyStats>({
    total: 0,
    hitRate: 0,
    byCategory: {},
  });

  useEffect(() => {
    const loadAccuracy = async () => {
      await hydratePredictionsFromServer();
      setAccuracyStats(getAccuracyStats());
    };
    void loadAccuracy();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceFromUrl = params.get('source') || 'direct';
    const intentFromUrl = params.get('intent') || 'membership';
    const planFromUrl = params.get('plan');
    setSource(sourceFromUrl);
    setIntent(intentFromUrl);
    if (planFromUrl === 'annual' || planFromUrl === 'quarterly') {
      setSelectedPlan(planFromUrl);
    }

    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = (await res.json()) as AuthSession;
        if (data?.authenticated && data.user?.email) {
          const sessionEmail = String(data.user.email).trim().toLowerCase();
          setAuthenticated(true);
          setEmail(sessionEmail);
          void refreshStatus(sessionEmail);
          return;
        }
      } catch {
        // fall through
      }
      setAuthenticated(false);
      const emailFromUrl = params.get('email')?.trim().toLowerCase();
      const emailFromStorage = localStorage.getItem('life-kline:lead-email')?.trim().toLowerCase();
      const initialEmail = emailFromUrl || emailFromStorage || '';
      if (initialEmail) {
        setEmail(initialEmail);
        void refreshStatus(initialEmail);
      }
    };
    void loadSession();
  }, []);

  const normalizedEmail = email.trim().toLowerCase();
  const selectedPlanInfo = useMemo(
    () => MEMBERSHIP_PLANS.find((plan) => plan.id === selectedPlan) || MEMBERSHIP_PLANS[0],
    [selectedPlan],
  );
  const selectedPlanChrome = useMemo(
    () => membershipPlanChrome(locale, selectedPlanInfo.id),
    [locale, selectedPlanInfo.id],
  );

  const isQuarterlyActive =
    Boolean(membershipStatus?.isActive) && membershipStatus?.plan === 'quarterly';
  const isAnnualActive =
    Boolean(membershipStatus?.isActive) && membershipStatus?.plan === 'annual';

  async function refreshStatus(targetEmail: string) {
    const normalized = targetEmail.trim().toLowerCase();
    if (!normalized.includes('@')) return;

    setStatusLoading(true);
    try {
      const res = await fetch(`/api/membership/status?email=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || copy.errorStatus);
      setMembershipStatus({
        status: data.status,
        plan: data.plan || null,
        planName: data.planName,
        expiresAt: data.expiresAt,
        savedReportsCount: data.savedReportsCount,
        isActive: data.isActive,
      });
    } catch {
      setMembershipStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleCheckout(planOverride?: MembershipPlanId) {
    const plan = planOverride || selectedPlan;

    if (!authenticated || !normalizedEmail) {
      setError(promo.needLogin);
      const next = encodeURIComponent(`/membership?source=${encodeURIComponent(source)}&plan=${plan}`);
      window.location.href = `/login?next=${next}`;
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    if (planOverride) setSelectedPlan(planOverride);

    try {
      localStorage.setItem('life-kline:lead-email', normalizedEmail);
      localStorage.setItem('life-kline:lead-source', source);
    } catch {
      // Non-blocking.
    }

    trackFunnel('membership_checkout_click', {
      source,
      intent,
      plan,
      has_email: 'true',
      free_promo: promoActive ? 'true' : 'false',
      authenticated: 'true',
    });

    try {
      const res = await fetch('/api/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          plan,
          source,
        }),
      });
      const data = await res.json();
      if (res.status === 401 || data.code === 'login_required') {
        window.location.href = data.loginUrl || `/login?next=${encodeURIComponent('/membership')}`;
        return;
      }
      if (!res.ok) throw new Error(data.error || copy.errorCheckout);

      if (data.mode === 'redirect' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mode === 'activated' || data.mode === 'already_active') {
        setSuccess(
          data.message ||
            (promoActive ? copy.successActivatedPromo : copy.successActivated),
        );
        await refreshStatus(normalizedEmail);
        trackFunnel('membership_activated', {
          source,
          plan: data.plan || plan,
          mode: data.mode,
          free_promo: promoActive ? 'true' : 'false',
        });
        return;
      }

      setSuccess(data.message || copy.successRecorded);
      await refreshStatus(normalizedEmail);
    } catch (err: any) {
      setError(err.message || copy.errorCheckout);
    } finally {
      setLoading(false);
    }
  }

  const ctaLabel = (() => {
    if (loading) return copy.processing;
    if (promoActive) {
      if (isQuarterlyActive && selectedPlan === 'annual') return promo.ctaUpgrade;
      if (selectedPlan === 'annual') return promo.ctaAnnual;
      return promo.ctaQuarterly;
    }
    return copy.activatePlan(selectedPlanChrome.name);
  })();

  const stepCards = promoActive ? copy.steps.promo : copy.steps.paid;

  const activePlanLabel = membershipStatus?.plan
    ? membershipPlanChrome(locale, membershipStatus.plan).name
    : membershipStatus?.planName || copy.statusMemberFallback;

  const expiresLabel = membershipStatus?.expiresAt
    ? new Date(membershipStatus.expiresAt).toLocaleDateString(copy.dateLocale)
    : copy.statusLongTerm;

  return (
    <div className="space-y-4">
      <FunnelPageView event="membership_page_view" sourceFallback="membership" />

      {promoActive ? (
        <section className="border-b border-[color:var(--hairline)] pb-5">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">{promo.badge}</div>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[color:var(--ink-1)]">
            {promo.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.55] text-[color:var(--ink-5)]">{promo.body}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-[12px] text-[color:var(--ink-3)]">
            {copy.promoSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {!authenticated ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
              <Link
                href={`/login?next=${encodeURIComponent(`/membership?source=${source}`)}`}
                className="text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                {copy.loginFirst}
              </Link>
              <span className="text-[12px] text-[color:var(--ink-5)]">{copy.needLoginHint}</span>
            </div>
          ) : (
            <p className="mt-3 text-[12px] text-[color:var(--ink-3)]">
              {copy.loggedInReady(normalizedEmail)}
            </p>
          )}
        </section>
      ) : null}

      <AccuracyDashboard
        stats={accuracyStats}
        isMember={Boolean(membershipStatus?.isActive)}
      />

      <div className="lk-grid-3">
        {stepCards.map((card, index) => (
          <div key={card.title} className="fb-card p-3">
            <div className="text-[11px] font-bold text-[color:var(--brand)]">Step {index + 1}</div>
            <div className="mt-1 text-[14px] font-bold text-[color:var(--ink-1)]">{card.title}</div>
            <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">{card.text}</div>
          </div>
        ))}
      </div>

      {membershipStatus?.isActive && (
        <section className="fb-card border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            {copy.statusEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold text-[color:var(--ink-1)]">
            {copy.statusActiveTitle(activePlanLabel)}
          </h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            {copy.statusExpires(expiresLabel)}
            {' · '}
            {copy.statusSavedReports(membershipStatus.savedReportsCount)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/analyze?source=membership_active_return" className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline">
              {copy.continueReports}
            </a>
            {isQuarterlyActive && promoActive ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleCheckout('annual')}
                className="fb-btn h-9 px-4 text-[13px] font-bold disabled:opacity-50"
              >
                {loading ? copy.processing : promo.ctaUpgrade}
              </button>
            ) : null}
          </div>
        </section>
      )}

      <section className="lk-grid-2">
        <article className="fb-card space-y-3 p-4">
          <h2 className="text-lg font-bold text-[color:var(--ink-1)]">{copy.freeTierTitle}</h2>
          <p className="text-[13px] text-[color:var(--ink-3)]">{copy.freeTierDesc}</p>
          <ul className="space-y-2 text-[13px] text-[color:var(--ink-3)]">
            {copy.freeTierFeatures.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-[color:var(--brand)]">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="fb-card space-y-3 border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
          <h2 className="text-lg font-bold text-[color:var(--brand-strong)]">{copy.memberTierTitle}</h2>
          <p className="text-[13px] text-[color:var(--ink-3)]">{copy.memberTierDesc}</p>
          <ul className="space-y-2 text-[13px] text-[color:var(--ink-3)]">
            {copy.memberTierFeatures.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-[color:var(--brand)]">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="fb-card space-y-5 p-4 md:p-5">
        <div>
          <h2 className="text-xl font-bold text-[color:var(--ink-1)]">{copy.selectPlanTitle}</h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            {promoActive
              ? copy.selectPlanDescPromo(MEMBERSHIP_FREE_PROMO_END, promo.priceNote)
              : copy.selectPlanDescPaid}
          </p>
        </div>

        <div className="lk-grid-2">
          {MEMBERSHIP_PLANS.map((plan) => {
            const displayPrice = promoActive ? 0 : plan.priceCny;
            const planChrome = membershipPlanChrome(locale, plan.id);
            const features = copy.planFeatures[plan.id] || plan.features;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`text-left rounded-[var(--radius)] border p-4 transition-colors ${
                  selectedPlan === plan.id
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]'
                    : 'border-[color:var(--hairline)] bg-white hover:border-[color:var(--brand-soft-2)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-[color:var(--brand-strong)]">{planChrome.name}</div>
                  {plan.highlight && (
                    <span className="rounded-full border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--brand)]">
                      {promoActive ? copy.badgeFree : copy.badgeRecommended}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink-1)]">
                  ¥{displayPrice}
                  <span className="text-sm font-normal text-[color:var(--ink-3)]">{planChrome.periodLabel}</span>
                  {promoActive && plan.priceCny > 0 ? (
                    <span className="ml-2 text-sm font-normal text-[color:var(--ink-4)] line-through">
                      ¥{plan.priceCny}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-[color:var(--ink-3)]">
                  {features.slice(0, 3).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => refreshStatus(normalizedEmail)}
            placeholder={authenticated ? copy.emailPlaceholderAuth : copy.emailPlaceholderGuest}
            autoComplete="email"
            disabled={authenticated}
            className="fb-input h-10 w-full px-3 text-[13px] disabled:bg-[color:var(--bg-sunken)]"
          />
          <button
            type="button"
            disabled={loading || isAnnualActive}
            onClick={() => void handleCheckout()}
            className="fb-btn fb-btn-primary h-10 px-5 text-[13px] font-bold disabled:opacity-50"
          >
            {isAnnualActive ? copy.alreadyAnnual : ctaLabel}
          </button>
        </div>

        {!authenticated ? (
          <p className="text-[12px] text-[color:var(--ink-3)]">
            {copy.notLoggedIn}
            <Link
              href={`/login?next=${encodeURIComponent('/membership')}`}
              className="ml-1 font-semibold text-[color:var(--brand)] hover:underline"
            >
              {copy.loginRegister}
            </Link>
            {copy.claimAfterLogin}
          </p>
        ) : null}

        {statusLoading ? <p className="text-xs text-[color:var(--ink-4)]">{copy.statusLoading}</p> : null}
        {error ? <AlertBanner className="text-[13px]">{error}</AlertBanner> : null}
        {success ? <AlertBanner tone="success" className="text-[13px]">{success}</AlertBanner> : null}
      </section>

      <section className="fb-card space-y-3 p-4">
        <h2 className="text-lg font-bold text-[color:var(--ink-1)]">{copy.faqTitle}</h2>
        <div className="lk-grid-2 text-[13px] text-[color:var(--ink-3)]">
          {copy.faqItems.map((item) => (
            <div key={item.q}>
              <h3 className="font-bold text-[color:var(--ink-1)]">{item.q}</h3>
              <p className="mt-1.5">{item.a}</p>
            </div>
          ))}
          <div>
            <h3 className="font-bold text-[color:var(--ink-1)]">{copy.faqAnalyze.q}</h3>
            <p className="mt-1.5">
              {copy.faqAnalyze.aPrefix}
              <a href="/analyze" className="text-[color:var(--brand)] hover:underline">
                {copy.faqAnalyze.aLink}
              </a>
              {copy.faqAnalyze.aSuffix}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
