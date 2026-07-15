import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TagTone = 'neutral' | 'brand' | 'success' | 'alert' | 'up' | 'default';

const toneClass: Record<TagTone, string> = {
  neutral: 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]',
  default: 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]',
  brand: 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]',
  success: 'border-[color:var(--success-soft)] bg-[color:var(--success-soft)] text-[color:var(--success)]',
  up: 'border-[color:var(--success-soft)] bg-[color:var(--success-soft)] text-[color:var(--success)]',
  alert: 'border-[color:var(--alert-soft)] bg-[color:var(--alert-soft)] text-[color:var(--alert)]',
};

export function Tag({
  children,
  tone = 'neutral',
  variant,
  size,
  className,
}: {
  children: ReactNode;
  tone?: TagTone;
  variant?: 'soft' | 'solid';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] border font-semibold',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variant === 'solid' ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]' : toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}