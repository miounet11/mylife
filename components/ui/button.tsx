// 决策台 · 按钮
// 取代旧 utility：action-primary / action-secondary / action-main
// API：保持旧 variant 名兼容；建议新代码用 primary | secondary | ghost | signal | danger
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'primary'    // 主行动（墨绿）
  | 'secondary'  // 次行动（白底）
  | 'ghost'      // 透明（仅文字）
  | 'signal'     // 高价值行动（金色，付费/升级专用）
  | 'danger'     // 危险（赤色）
  // 旧值兼容
  | 'default' | 'outline' | 'gradient';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    'fb-btn fb-btn-primary bg-[color:var(--brand-strong)] text-white border border-[color:var(--brand-deep)] hover:bg-[color:var(--brand-deep)]',
  secondary:
    'fb-btn bg-[color:var(--paper)] text-[color:var(--ink-2)] border border-[color:var(--hairline-strong)] hover:border-[color:var(--brand)] hover:bg-[color:var(--bg-elevated)]',
  ghost:
    'fb-btn bg-transparent text-[color:var(--ink-3)] border border-transparent hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]',
  signal:
    'fb-btn bg-[color:var(--signal)] text-[color:var(--ink-1)] border border-[color:var(--signal-strong)] hover:bg-[color:var(--signal-strong)] hover:text-white',
  danger:
    'fb-btn bg-[color:var(--alert)] text-white border border-[color:var(--alert)] hover:opacity-92',
  // 旧值兼容映射
  default:
    'fb-btn bg-[color:var(--paper)] text-[color:var(--ink-2)] border border-[color:var(--hairline-strong)] hover:border-[color:var(--brand)] hover:bg-[color:var(--bg-elevated)]',
  outline:
    'fb-btn bg-transparent text-[color:var(--ink-2)] border border-[color:var(--hairline-strong)] hover:border-[color:var(--brand)]',
  gradient:
    'fb-btn fb-btn-primary bg-[linear-gradient(135deg,var(--ink-1),var(--brand-deep))] text-white border border-transparent hover:opacity-95',
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  xl: 'h-12 px-6 text-md',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold whitespace-nowrap transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2',
          variantMap[variant],
          sizeMap[size],
          fullWidth && 'w-full',
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-px',
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
