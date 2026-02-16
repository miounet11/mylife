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
      default: 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50',
      primary: 'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700',
      secondary: 'bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700',
      outline: 'bg-white text-gray-700 border-2 border-purple-600 hover:bg-purple-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      gradient: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:shadow-lg',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    const disabledStyles = disabled || loading
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer hover:scale-105 active:scale-95 transition-all';

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-semibold flex items-center justify-center transition-all',
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
