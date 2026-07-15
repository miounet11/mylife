'use client';

/**
 * Conversion banner for limited free membership (through 2026-12-31).
 * Quiet text strip — no gradient card chrome.
 */

import Link from 'next/link';
import {
  getMembershipPromoCopy,
  isMembershipFreePromoActive,
  MEMBERSHIP_FREE_PROMO_END,
} from '@/lib/membership-promo';

export default function FreeMembershipClaimBanner({
  source = 'banner',
  compact = false,
}: {
  source?: string;
  compact?: boolean;
}) {
  if (!isMembershipFreePromoActive()) return null;

  const promo = getMembershipPromoCopy('zh-CN');
  const href = `/membership?source=${encodeURIComponent(source)}`;

  if (compact) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between gap-3 border-b border-[color:var(--hairline)] px-0.5 py-2.5 no-underline transition hover:no-underline"
      >
        <span className="text-[13px] text-[color:var(--ink-2)]">
          限时免费会员
          <span className="ml-2 text-[12px] text-[color:var(--ink-5)]">截止 {MEMBERSHIP_FREE_PROMO_END}</span>
        </span>
        <span className="shrink-0 text-[12px] text-[color:var(--ink-1)] underline-offset-2 hover:underline">
          领取
        </span>
      </Link>
    );
  }

  return (
    <section className="border-y border-[color:var(--hairline)] py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">{promo.badge}</div>
          <h2 className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">{promo.title}</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{promo.body}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end">
          <Link
            href={href}
            className="text-[13px] text-[color:var(--ink-1)] underline-offset-2 hover:underline"
          >
            0 元领取会员
          </Link>
          <span className="text-[11px] text-[color:var(--ink-5)]">需邮箱登录 · 无需支付</span>
        </div>
      </div>
    </section>
  );
}
