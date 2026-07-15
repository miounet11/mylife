import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = '全部',
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('lk-section-header', className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="lk-section-eyebrow">{eyebrow}</div> : null}
        <h2 className={cn('lk-section-title', eyebrow ? 'mt-1' : '')}>{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.55] text-[color:var(--ink-3)]">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-[12px] font-medium text-[color:var(--ink-4)] transition hover:text-[color:var(--brand)] hover:no-underline"
        >
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
