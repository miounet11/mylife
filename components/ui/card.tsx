// Card组件 - 通用卡片组件
import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'purple' | 'blue' | 'green' | 'gradient';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[color:var(--surface-strong)] border border-[color:var(--line)] shadow-[var(--shadow-soft)]',
      purple: 'bg-[color:var(--accent-soft)] border border-[rgba(15,118,110,0.18)]',
      blue: 'bg-sky-50 border border-sky-100',
      green: 'bg-emerald-50 border border-emerald-100',
      gradient: 'bg-[linear-gradient(135deg,var(--ink),var(--accent-strong))] text-white border border-[rgba(255,255,255,0.08)] shadow-[0_24px_50px_rgba(23,32,51,0.18)]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[1.75rem] p-6',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref as any}
    className={cn('text-xl font-bold text-[color:var(--ink)]', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mt-6 border-t border-[color:var(--line)] pt-6', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
