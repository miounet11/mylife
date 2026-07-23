'use client';

/**
 * Report-page membership conversion:
 * - Non-members: free claim CTA (promo) or membership pitch
 * - Members: compact active status
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Crown, Gift, Loader2 } from 'lucide-react';
import {
  isMembershipFreePromoActive,
  MEMBERSHIP_FREE_PROMO_END,
} from '@/lib/membership-promo';

type StatusPayload = {
  ok?: boolean;
  isActive?: boolean;
  planName?: string | null;
  plan?: string | null;
  expiresAt?: string | null;
  authenticated?: boolean;
  promoActive?: boolean;
  canUpgradeToAnnual?: boolean;
};

export default function ReportMembershipPanel({
  reportId,
  source = 'result_report',
}: {
  reportId?: string;
  source?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const promo = isMembershipFreePromoActive();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/membership/status');
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          if (res.ok && data.ok) setStatus(data);
          else setStatus({ ok: false, isActive: false, authenticated: false, promoActive: promo });
        }
      } catch {
        if (!cancelled) setStatus({ ok: false, isActive: false, promoActive: promo });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [promo]);

  const membershipHref = `/membership?source=${encodeURIComponent(source)}${
    reportId ? `&reportId=${encodeURIComponent(reportId)}` : ''
  }`;

  if (loading) {
    return (
      <div className="fb-card flex items-center gap-2 p-3.5 text-[13px] text-[color:var(--ink-4)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在确认会员状态…
      </div>
    );
  }

  if (status?.isActive) {
    return (
      <section className="fb-card border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--brand-strong)]">
              <CheckCircle2 className="h-4 w-4" />
              会员已开通 · {status.planName || '会员'}
            </div>
            <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
              可完整回看报告、使用会员权益
              {status.expiresAt
                ? ` · 到期 ${new Date(status.expiresAt).toLocaleDateString('zh-CN')}`
                : ''}
            </p>
          </div>
          {status.canUpgradeToAnnual ? (
            <Link
              href={`${membershipHref}&plan=annual`}
              className="fb-btn fb-btn-primary h-9 shrink-0 px-3 text-[12px] font-semibold hover:no-underline"
            >
              免费升级年度
            </Link>
          ) : (
            <Link
              href="/profile?source=result_membership_active"
              className="fb-btn h-9 shrink-0 px-3 text-[12px] hover:no-underline"
            >
              我的档案
            </Link>
          )}
        </div>
      </section>
    );
  }

  const promoActive = status?.promoActive ?? promo;

  return (
    <section
      id="membership-claim"
      className="fb-card overflow-hidden border-[color:var(--brand)]/35 bg-gradient-to-br from-[color:var(--brand-soft)] to-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand)]/25 bg-white px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--brand-strong)]">
            <Crown className="h-3 w-3" />
            {promoActive ? `限时免费至 ${MEMBERSHIP_FREE_PROMO_END}` : '会员权益'}
          </div>
          <h2 className="mt-2 text-[16px] font-black tracking-tight text-[color:var(--ink-1)]">
            {promoActive ? '读完报告后，两步 0 元开通会员' : '开通会员，完整回看与长期复访'}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-6 text-[color:var(--ink-3)]">
            {promoActive
              ? '绑定邮箱（验证码，无需密码）→ 一点开通。绑定是为了后续方便召回你、保存报告并保持持续关系。活动期 ¥0，立即生效。'
              : '绑定邮箱后开通会员，可解锁完整回看、年度策略与优先更新，并方便后续召回与持续关系。'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {status?.authenticated ? (
            <Link
              href={`${membershipHref}&claim=1`}
              className="fb-btn fb-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-[13px] font-semibold hover:no-underline"
            >
              <Gift className="h-4 w-4" />
              {promoActive ? '0 元一点开通' : '开通会员'}
            </Link>
          ) : (
            <Link
              href={`${membershipHref}#membership-bind`}
              className="fb-btn fb-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-[13px] font-semibold hover:no-underline"
            >
              <Gift className="h-4 w-4" />
              绑定邮箱领取
            </Link>
          )}
          <span className="text-[11px] text-[color:var(--ink-4)]">
            {status?.authenticated
              ? '已绑定 · 可直接开通'
              : '约 1 分钟 · 验证码即可 · 方便后续召回'}
          </span>
        </div>
      </div>
    </section>
  );
}
