'use client';

import Link from 'next/link';
import type { ResumeTarget } from '@/lib/resume-target';

export default function ResumeBar({
  target,
  surface,
}: {
  target: ResumeTarget;
  surface?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[color:var(--hairline)] py-2.5">
      <div className="text-[13px] text-[color:var(--ink-2)]">{target.label}</div>
      <Link
        href={target.href}
        className="shrink-0 text-[13px] text-[color:var(--ink-1)] underline-offset-2 hover:underline"
      >
        继续{surface ? ` · ${surface}` : ''}
      </Link>
    </div>
  );
}
