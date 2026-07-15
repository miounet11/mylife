// 决策台 · 区块标题（section heading / 小标签条）
// 取代重复 30+ 次的 raw className：
//   "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]"
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type SectionTitleTone = 'brand' | 'signal' | 'muted' | 'env';

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SectionTitleTone;
  icon?: React.ReactNode;
  as?: 'div' | 'h2' | 'h3' | 'h4';
}

const toneMap: Record<SectionTitleTone, string> = {
  brand:  'text-[color:var(--brand-strong)]',
  signal: 'text-[color:var(--signal-strong)]',
  muted:  'text-[color:var(--ink-5)]',
  env:    'text-[color:var(--env)]',
};

export function SectionTitle({
  tone = 'brand',
  icon,
  as: Tag = 'div',
  className,
  children,
  ...props
}: SectionTitleProps) {
  return (
    <Tag
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]',
        toneMap[tone],
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </Tag>
  );
}
