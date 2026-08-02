'use client';

/**
 * Guest → email OTP conversion strip.
 * Place after high-value moments (career report, hehun result, foundation hub).
 * Links into /login with source + optional reportId so verify can claim data.
 */

import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

type GuestSaveStripProps = {
  /** Analytics page path */
  page: string;
  /** next= redirect after login */
  nextPath?: string;
  source?: string;
  /** When set, login/verify will claim this report onto the account. */
  reportId?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  className?: string;
  /** When true, use brand-filled CTA (post-value moment) */
  emphasize?: boolean;
};

export function GuestSaveStrip({
  page,
  nextPath = '/profile/foundation',
  source = 'guest_save_strip',
  reportId,
  title = '绑定邮箱，保存进度',
  description = '游客也可先测算。一封验证码即可绑定：跨设备回看结果，避免换机丢失。无需密码。',
  ctaLabel = '验证码绑定',
  className = '',
  emphasize = false,
}: GuestSaveStripProps) {
  const params = new URLSearchParams({
    source,
    next: nextPath,
  });
  if (reportId) params.set('reportId', reportId);
  const href = `/login?${params.toString()}`;

  return (
    <div
      className={
        className ||
        'flex flex-col gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 shadow-card sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[color:var(--ink-1)]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--ink-4)]">{description}</p>
      </div>
      <Link
        href={href}
        onClick={() =>
          void trackClientEvent({
            eventName: 'guest_save_strip_click',
            page,
            meta: { source, next: nextPath, reportId: reportId || null },
          })
        }
        className={
          emphasize
            ? 'inline-flex shrink-0 items-center justify-center rounded-md bg-[color:var(--brand)] px-3 py-1.5 text-[12px] font-medium text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline'
            : 'inline-flex shrink-0 items-center justify-center rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-1)] ring-1 ring-[color:var(--hairline)] no-underline hover:bg-[color:var(--bg-sunken)] hover:no-underline'
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
