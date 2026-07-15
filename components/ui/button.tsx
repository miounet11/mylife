import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'fb-btn-primary',
  secondary: 'fb-btn',
  ghost: 'fb-btn-ghost border-transparent',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-[13px] px-4',
  lg: 'h-11 text-sm px-5',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type="button"
      className={cn('fb-btn', variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}