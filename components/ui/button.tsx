// Button组件 - 通用按钮组件
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref
  ) => {
    const variantStyles = {
      default: 'bg-white text-[color:var(--ink)] border border-[color:var(--line)] hover:bg-slate-50',
      primary: 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white border border-transparent hover:opacity-95 shadow-[0_16px_34px_rgba(15,118,110,0.22)]',
      secondary: 'bg-slate-700 text-white border border-slate-700 hover:bg-slate-800',
      outline: 'bg-white text-[color:var(--ink)] border border-[color:var(--line)] hover:bg-slate-50',
      ghost: 'bg-transparent text-[color:var(--ink)] hover:bg-white/70',
      gradient: 'bg-[linear-gradient(135deg,var(--ink),var(--accent-strong))] text-white border border-transparent hover:opacity-95 shadow-[0_16px_34px_rgba(23,32,51,0.18)]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    const disabledStyles = disabled || loading
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer transition-colors';

    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full font-semibold',
          variantStyles[variant],
          sizeStyles[size],
          disabledStyles,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
