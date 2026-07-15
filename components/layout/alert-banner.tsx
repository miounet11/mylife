import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const toneClass: Record<AlertTone, string> = {
  error: 'border-[color:var(--alert-soft)] bg-[color:var(--alert-soft)] text-[color:var(--alert)]',
  success: 'border-[color:var(--success-soft)] bg-[color:var(--success-soft)] text-[color:var(--success)]',
  info: 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]',
  warning: 'border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]',
};

export function AlertBanner({
  children,
  tone = 'error',
  className,
}: {
  children: ReactNode;
  tone?: AlertTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border px-4 py-3 text-[13px] font-medium leading-[1.5]',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}