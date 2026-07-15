import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Inline({
  children,
  gap = 'sm',
  justify,
  align = 'center',
  className,
}: {
  children: ReactNode;
  gap?: 'xs' | 'sm' | 'md';
  justify?: 'start' | 'between' | 'end';
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  const gapClass = { xs: 'gap-1', sm: 'gap-2', md: 'gap-3' }[gap];
  const justifyClass = justify === 'between' ? 'justify-between' : justify === 'end' ? 'justify-end' : 'justify-start';
  const alignClass = align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center';
  return (
    <div className={cn('flex flex-wrap', justifyClass, alignClass, gapClass, className)}>{children}</div>
  );
}