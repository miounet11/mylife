import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'sunken' | 'elevated' | 'brand';

const variantClass: Record<CardVariant, string> = {
  default: 'bg-[color:var(--paper)] border-[color:var(--hairline)]',
  sunken: 'bg-[color:var(--bg-sunken)] border-[color:var(--hairline)]',
  elevated: 'bg-[color:var(--bg-elevated)] border-[color:var(--hairline)] shadow-sm',
  brand: 'bg-[color:var(--brand-soft)] border-[color:var(--brand-soft-2)]',
};

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClass: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  padding?: CardPadding;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border',
        variantClass[variant],
        paddingClass[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** shadcn-compatible subcomponents used by legacy report/chart modules */
export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[color:var(--ink-3)]', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-0', className)} {...props}>
      {children}
    </div>
  );
}
