// 决策台 · Lede（引导段落）
// 取代旧 .intro-copy / .hero-description / .hero-hint
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type LedeSize = 'sm' | 'md' | 'lg';

interface LedeProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: LedeSize;
}

const sizeMap: Record<LedeSize, string> = {
  sm: 'text-sm leading-6',
  md: 'text-sm md:text-base leading-7',
  lg: 'text-base md:text-md leading-7 md:leading-8',
};

export function Lede({ size = 'md', className, children, ...props }: LedeProps) {
  return (
    <p
      className={cn(
        sizeMap[size],
        'max-w-[44rem] text-[color:var(--ink-3)]',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
