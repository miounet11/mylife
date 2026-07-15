import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EyebrowTone = 'brand' | 'muted' | 'signal';

const toneClass: Record<EyebrowTone, string> = {
  brand: 'text-[color:var(--brand)]',
  muted: 'text-[color:var(--ink-4)]',
  signal: 'text-[color:var(--signal-strong)]',
};

export function Eyebrow({
  children,
  tone = 'brand',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: EyebrowTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]',
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {children}
    </div>
  );
}