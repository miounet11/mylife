// 决策台 · 通用面板
// 取代旧 utility：glass-panel / soft-card / static-card / product-panel /
// product-panel-strong / workspace-panel / workspace-panel-muted /
// interactive-card / surface-hero-rail / metric-tile
// API 保持向后兼容（CardHeader/CardTitle/CardContent/CardFooter）
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant =
  | 'default'      // 主面板（白底 + hairline）
  | 'raised'       // 提起面板（带 shadow-card）
  | 'sunken'       // 内嵌面板（更暗背景，无阴影）
  | 'interactive'  // 可点击（hover 提起 + 边框转 brand）
  | 'signal'       // 高价值（金色边框 + 金 hairline，仅升级/付费用）
  | 'terminal'     // 数据 panel（深色风格的局部卡，触发 data-mode="terminal"）
  // 旧值兼容（P5 删）
  | 'purple' | 'blue' | 'green' | 'gradient';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const paddingMap: Record<CardPadding, string> = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-4 md:p-5',
  lg:   'p-5 md:p-6',
};

const variantMap: Record<CardVariant, string> = {
  default:     'bg-[color:var(--paper)] border border-[color:var(--hairline)]',
  raised:      'bg-[color:var(--paper)] border border-[color:var(--hairline)] shadow-[var(--shadow-card)]',
  sunken:      'bg-[color:var(--bg-sunken)] border border-[color:var(--hairline)]',
  interactive: 'bg-[color:var(--bg-elevated)] border border-[color:var(--hairline-strong)] shadow-[var(--shadow-card)] cursor-pointer transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)] hover:shadow-[var(--shadow-pop)]',
  signal:      'bg-[color:var(--paper)] border border-[color:var(--signal)] shadow-[0_0_0_3px_var(--signal-soft)]',
  terminal:    'bg-[#1a2722] text-[#d8dfd9] border border-[rgba(245,247,242,0.10)]',
  // 旧值兼容
  purple:      'bg-[color:var(--brand-soft)] border border-[color:var(--brand-soft-2)]',
  blue:        'bg-[color:var(--env-soft)] border border-[color:var(--env-soft)]',
  green:       'bg-[color:var(--brand-soft)] border border-[color:var(--brand)]',
  gradient:    'bg-[linear-gradient(135deg,var(--ink-1),var(--brand-deep))] text-white border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-pop)]',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-md)]',
          variantMap[variant],
          paddingMap[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-3', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-md font-bold leading-tight text-[color:var(--ink-1)]',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm leading-6 text-[color:var(--ink-3)]', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 border-t border-[color:var(--hairline)] pt-4', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
