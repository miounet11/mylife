import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 1 | 2 | 3 | 4;

const gapClass: Record<Exclude<StackGap, number>, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function Stack({
  children,
  gap = 'md',
  className,
}: {
  children: ReactNode;
  gap?: StackGap;
  className?: string;
}) {
  const resolvedGap = typeof gap === 'number' ? `gap-${gap}` : gapClass[gap];
  return <div className={cn('flex flex-col', resolvedGap, className)}>{children}</div>;
}