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
        embedded
          ? 'mb-0 border-b border-[color:var(--hairline)] px-4 pb-4 pt-5 md:px-5 md:pb-5 md:pt-6'
          : 'mb-6 border-b border-[color:var(--hairline)] pb-5',
        className,
      )}
    >
      {eyebrow ? (
        <div className="text-[13px] font-medium text-[color:var(--ink-4)]">{eyebrow}</div>
      ) : null}
      <h1
        className={cn(
          'text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[26px]',
          eyebrow ? 'mt-1' : '',
        )}
      >
        {title}
      </h1>
      {description ? (
        <div className="mt-2.5 max-w-2xl text-[15px] leading-[1.65] text-[color:var(--ink-3)]">
          {description}
        </div>
      ) : null}
      {actions ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
          {actions}
        </div>
      ) : null}
      {footer ? (
        <div className="mt-3 text-[13px] leading-[1.55] text-[color:var(--ink-4)]">{footer}</div>
      ) : null}
    </header>
  );
}
