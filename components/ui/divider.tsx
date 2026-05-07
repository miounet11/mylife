// 决策台 · 细线分隔
// 取代散落的 border-t border-[color:var(--line)] 等手写
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type DividerOrientation = 'horizontal' | 'vertical';
type DividerStrength = 'hair' | 'strong';
type DividerLineStyle = 'solid' | 'dashed';

interface DividerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  orientation?: DividerOrientation;
  strength?: DividerStrength;
  lineStyle?: DividerLineStyle;
  label?: string;
}

const colorMap: Record<DividerStrength, string> = {
  hair:   'border-[color:var(--hairline)]',
  strong: 'border-[color:var(--hairline-strong)]',
};

export function Divider({
  orientation = 'horizontal',
  strength = 'hair',
  lineStyle = 'solid',
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          'h-full w-px self-stretch border-l',
          colorMap[strength],
          lineStyle === 'dashed' && 'border-dashed',
          className,
        )}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className={cn('h-px flex-1 border-t', colorMap[strength], lineStyle === 'dashed' && 'border-dashed')} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
          {label}
        </span>
        <div className={cn('h-px flex-1 border-t', colorMap[strength], lineStyle === 'dashed' && 'border-dashed')} />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        'h-px w-full border-t',
        colorMap[strength],
        lineStyle === 'dashed' && 'border-dashed',
        className,
      )}
    />
  );
}
