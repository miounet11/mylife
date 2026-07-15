import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Page intro: title + muted description + text actions. No card chrome. */
export function FocusHero({
  eyebrow,
  title,
  description,
  actions,
  footer,
  embedded = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  /** 嵌入工作台时收紧间距 */
  embedded?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        embedded ? 'mb-4' : 'mb-6 border-b border-[color:var(--hairline)] pb-5',
        className,
      )}
    >
      {eyebrow ? (
        <div className="text-[12px] font-medium text-[color:var(--ink-5)]">{eyebrow}</div>
      ) : null}
      <h1
        className={cn(
          'text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[24px]',
          eyebrow ? 'mt-1' : '',
        )}
      >
        {title}
      </h1>
      {description ? (
        <div className="mt-2 max-w-2xl text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
          {description}
        </div>
      ) : null}
      {actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          {actions}
        </div>
      ) : null}
      {footer ? (
        <div className="mt-3 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{footer}</div>
      ) : null}
    </header>
  );
}
