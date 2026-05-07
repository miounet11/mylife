// 决策台 · 输入框
// 取代旧版紫色边框
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numeric?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, rightIcon, numeric, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-4)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-5)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'h-10 w-full rounded-[var(--radius)] border bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink-1)] outline-none transition',
              'placeholder:text-[color:var(--ink-5)]',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              numeric && 'font-mono tabular-nums',
              error
                ? 'border-[color:var(--alert)] focus:border-[color:var(--alert)] focus:ring-2 focus:ring-[color:var(--alert-soft)]'
                : 'border-[color:var(--hairline-strong)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)]',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-5)]">
              {rightIcon}
            </div>
          )}
        </div>
        {(hint || error) && (
          <p className={cn('mt-1 text-xs', error ? 'text-[color:var(--alert)]' : 'text-[color:var(--ink-5)]')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
