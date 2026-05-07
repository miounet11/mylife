// 决策台 · Eyebrow（section 上方小标签）
// 取代旧 .section-label / .product-kicker
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type EyebrowTone = 'brand' | 'signal' | 'env' | 'muted';

interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: EyebrowTone;
  icon?: React.ReactNode;
}

const toneMap: Record<EyebrowTone, string> = {
  brand:  'text-[color:var(--brand-strong)]',
  signal: 'text-[color:var(--signal-strong)]',
  env:    'text-[color:var(--env)]',
  muted:  'text-[color:var(--ink-5)]',
};

export function Eyebrow({ tone = 'brand', icon, className, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]',
        toneMap[tone],
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
