// 决策台 · 键盘按键样式
// 用于工作台快捷键提示，强化"专业工具"感
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] px-1.5 font-mono text-xs font-semibold text-[color:var(--ink-3)] shadow-[0_1px_0_var(--hairline)]',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
