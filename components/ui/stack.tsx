// 决策台 · 纵向间距容器
// 替代到处散落的 space-y-*、flex flex-col gap-*
// gap 只接受 4/8/12/16/24/32/48/64 八档
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type StackGap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16; // tailwind 等价：4/8/12/16/24/32/48/64

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: StackGap;
  as?: React.ElementType;
}

const gapMap: Record<StackGap, string> = {
  1:  'gap-1',
  2:  'gap-2',
  3:  'gap-3',
  4:  'gap-4',
  6:  'gap-6',
  8:  'gap-8',
  12: 'gap-12',
  16: 'gap-16',
};

export function Stack({ gap = 3, as: Tag = 'div', className, children, ...props }: StackProps) {
  return (
    <Tag className={cn('flex flex-col', gapMap[gap], className)} {...props}>
      {children}
    </Tag>
  );
}
