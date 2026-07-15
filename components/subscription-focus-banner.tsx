'use client';

import Link from 'next/link';
import { BellRing } from 'lucide-react';
import type { SubscriptionFocusCopy } from '@/lib/profile-focus-copy';

export default function SubscriptionFocusBanner({
  focus,
  compact = false,
}: {
  focus: SubscriptionFocusCopy;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="text-xs leading-5 text-[color:var(--ink-3)]">
        <BellRing className="mr-1 inline h-3.5 w-3.5 text-[color:var(--brand-strong)]" />
        {focus.headline}
        {' '}
        <Link href={focus.settingsHref} className="font-semibold text-[color:var(--brand-strong)] hover:underline">
          调整
        </Link>
      </p>
    );
  }

  return (
    <div className="fb-card px-3 py-2.5">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-1)]">
        <BellRing className="h-4 w-4 text-[color:var(--brand-strong)]" />
        {focus.headline}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--ink-3)]">{focus.description}</p>
      <Link
        href={focus.settingsHref}
        className="mt-2 inline-flex text-xs font-semibold text-[color:var(--brand-strong)] hover:underline"
      >
        {focus.isSet ? '调整提醒档案' : '去指定档案'}
      </Link>
    </div>
  );
}