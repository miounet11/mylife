'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FunnelPageView, trackFunnel } from '@/components/funnel-tracker';
import AccuracyDashboard from '@/components/predictions/accuracy-dashboard';
import { FREE_TIER_FEATURES, MEMBERSHIP_PLANS, type MembershipPlanId } from '@/lib/membership-plans';
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

export default function MembershipClient() {
  const promoActive = isMembershipFreePromoActive();
  const promo = getMembershipPromoCopy('zh-CN');

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
      if (!res.ok) throw new Error(data.error || 'Status lookup failed');
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
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      if (data.mode === 'redirect' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mode === 'activated' || data.mode === 'already_active') {
        setSuccess(
          data.message ||
            (promoActive
              ? '会员已开通（限时免费 ¥0）。你现在可以使用会员功能。'
              : '会员已开通。你现在可以回看完整报告与年度提醒。'),
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

      setSuccess(data.message || '已记录开通意向，我们会通过邮箱发送下一步指引。');
      await refreshStatus(normalizedEmail);
    } catch (err: any) {
      setError(err.message || '开通失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  const ctaLabel = (() => {
    if (loading) return '处理中...';
    if (promoActive) {
      if (isQuarterlyActive && selectedPlan === 'annual') return promo.ctaUpgrade;
      if (selectedPlan === 'annual') return promo.ctaAnnual;
      return promo.ctaQuarterly;
    }
    return `开通${selectedPlanInfo.name}`;
  })();

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
            <li>邮箱登录（注册会员）</li>
            <li>选择季度 / 年度</li>
            <li>¥0 开通，立即生效</li>
          </ol>
          {!authenticated ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
              <Link
                href={`/login?next=${encodeURIComponent(`/membership?source=${source}`)}`}
                className="text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                先登录 / 注册邮箱
              </Link>
              <span className="text-[12px] text-[color:var(--ink-5)]">未登录无法领取</span>
            </div>
          ) : (
            <p className="mt-3 text-[12px] text-[color:var(--ink-3)]">
              已登录：{normalizedEmail} · 可直接 0 元开通
            </p>
          )}
        </section>
      ) : null}

      <AccuracyDashboard
        stats={accuracyStats}
        isMember={Boolean(membershipStatus?.isActive)}
      />

      <div className="lk-grid-3">
        {[
          ['1', promoActive ? '登录邮箱' : '绑定邮箱', promoActive ? '注册会员后才能领取' : '把当前报告与你的邮箱关联'],
          ['2', '选择会员方案', promoActive ? '季度 / 年度 · 活动期 ¥0' : '按年或按季解锁完整版'],
          ['3', promoActive ? '0 元开通' : '随时回看', promoActive ? '立即享受会员功能' : '后续年度更新优先查看'],
        ].map(([step, title, text]) => (
          <div key={step} className="fb-card p-3">
            <div className="text-[11px] font-bold text-[color:var(--brand)]">Step {step}</div>
            <div className="mt-1 text-[14px] font-bold text-[color:var(--ink-1)]">{title}</div>
            <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">{text}</div>
          </div>
        ))}
      </div>

      {membershipStatus?.isActive && (
        <section className="fb-card border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">当前会员状态</p>
          <h2 className="mt-1 text-lg font-bold text-[color:var(--ink-1)]">
            你已开通 {membershipStatus.planName || '会员'}
          </h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            到期时间：{membershipStatus.expiresAt ? new Date(membershipStatus.expiresAt).toLocaleDateString('zh-CN') : '长期有效'}
            {' · '}
            已保存报告 {membershipStatus.savedReportsCount} 份
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/analyze?source=membership_active_return" className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline">
              继续生成或查看报告
            </a>
            {isQuarterlyActive && promoActive ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleCheckout('annual')}
                className="fb-btn h-9 px-4 text-[13px] font-bold disabled:opacity-50"
              >
                {loading ? '处理中...' : promo.ctaUpgrade}
              </button>
            ) : null}
          </div>
        </section>
      )}

      <section className="lk-grid-2">
        <article className="fb-card space-y-3 p-4">
          <h2 className="text-lg font-bold text-[color:var(--ink-1)]">免费版</h2>
          <p className="text-[13px] text-[color:var(--ink-3)]">适合第一次了解命盘结构与阶段节奏。</p>
          <ul className="space-y-2 text-[13px] text-[color:var(--ink-3)]">
            {FREE_TIER_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-[color:var(--brand)]">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="fb-card space-y-3 border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
          <h2 className="text-lg font-bold text-[color:var(--brand-strong)]">会员版</h2>
          <p className="text-[13px] text-[color:var(--ink-3)]">适合需要长期回看、做年度规划的用户。</p>
          <ul className="space-y-2 text-[13px] text-[color:var(--ink-3)]">
            {MEMBERSHIP_PLANS[0].features.map((feature) => (
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
          <h2 className="text-xl font-bold text-[color:var(--ink-1)]">选择会员方案</h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            {promoActive
              ? `活动截止 ${MEMBERSHIP_FREE_PROMO_END} · ${promo.priceNote}`
              : '邮箱会自动从登录态带入，减少重复填写。'}
          </p>
        </div>

        <div className="lk-grid-2">
          {MEMBERSHIP_PLANS.map((plan) => {
            const displayPrice = promoActive ? 0 : plan.priceCny;
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
                  <div className="font-bold text-[color:var(--brand-strong)]">{plan.name}</div>
                  {plan.highlight && (
                    <span className="rounded-full border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--brand)]">
                      {promoActive ? '限时免费' : '推荐'}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink-1)]">
                  ¥{displayPrice}
                  <span className="text-sm font-normal text-[color:var(--ink-3)]">{plan.periodLabel}</span>
                  {promoActive && plan.priceCny > 0 ? (
                    <span className="ml-2 text-sm font-normal text-[color:var(--ink-4)] line-through">
                      ¥{plan.priceCny}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-[color:var(--ink-3)]">
                  {plan.features.slice(0, 3).map((feature) => (
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
            placeholder={authenticated ? '已绑定登录邮箱' : '请先登录后自动填入邮箱'}
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
            {isAnnualActive ? '已是年度会员' : ctaLabel}
          </button>
        </div>

        {!authenticated ? (
          <p className="text-[12px] text-[color:var(--ink-3)]">
            未登录？
            <Link
              href={`/login?next=${encodeURIComponent('/membership')}`}
              className="ml-1 font-semibold text-[color:var(--brand)] hover:underline"
            >
              邮箱登录 / 注册
            </Link>
            后再领取会员。
          </p>
        ) : null}

        {statusLoading ? <p className="text-xs text-[color:var(--ink-4)]">正在查询会员状态…</p> : null}
        {error ? <AlertBanner className="text-[13px]">{error}</AlertBanner> : null}
        {success ? <AlertBanner tone="success" className="text-[13px]">{success}</AlertBanner> : null}
      </section>

      <section className="fb-card space-y-3 p-4">
        <h2 className="text-lg font-bold text-[color:var(--ink-1)]">常见问题</h2>
        <div className="lk-grid-2 text-[13px] text-[color:var(--ink-3)]">
          <div>
            <h3 className="font-bold text-[color:var(--ink-1)]">开通后能看到什么？</h3>
            <p className="mt-1.5">完整事业、财运、婚恋、健康分析，以及流年大运与关键窗口的详细解读。</p>
          </div>
          <div>
            <h3 className="font-bold text-[color:var(--ink-1)]">为什么必须登录？</h3>
            <p className="mt-1.5">会员权益绑定注册邮箱，便于跨设备回看与后续提醒，也避免匿名滥用。</p>
          </div>
          <div>
            <h3 className="font-bold text-[color:var(--ink-1)]">限时免费到什么时候？</h3>
            <p className="mt-1.5">
              活动截至 <strong>{MEMBERSHIP_FREE_PROMO_END}</strong>。期内开通季度 / 年度均为 ¥0；季度可免费升级年度。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[color:var(--ink-1)]">还没生成报告可以开通吗？</h3>
            <p className="mt-1.5">
              可以。开通后可先
              <a href="/analyze" className="text-[color:var(--brand)] hover:underline"> 免费测算 </a>
              ，报告会按会员权益保存。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
