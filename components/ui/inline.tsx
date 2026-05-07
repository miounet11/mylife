// 决策台 · 横向间距容器（含对齐）
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type InlineGap = 1 | 2 | 3 | 4 | 6 | 8;
type InlineAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type InlineJustify = 'start' | 'center' | 'end' | 'between' | 'around';

interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: InlineGap;
  align?: InlineAlign;
  justify?: InlineJustify;
  wrap?: boolean;
  as?: React.ElementType;
}

const gapMap: Record<InlineGap, string> = {
  1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8',
};
const alignMap: Record<InlineAlign, string> = {
  start: 'items-start', center: 'items-center', end: 'items-end',
  baseline: 'items-baseline', stretch: 'items-stretch',
};
const justifyMap: Record<InlineJustify, string> = {
  start: 'justify-start', center: 'justify-center', end: 'justify-end',
  between: 'justify-between', around: 'justify-around',
};

export function Inline({
  gap = 2, align = 'center', justify = 'start', wrap = false,
  as: Tag = 'div', className, children, ...props
}: InlineProps) {
  return (
    <Tag
      className={cn(
        'flex',
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
