'use client';

// 决策台 · 报告深读模式（terminal mode）切换
// 触发 [data-mode="terminal"]，作用于其 scope 内的 CSS token
// 状态保存在 localStorage（按用户记忆偏好）
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §1.4 §5.2

import * as React from 'react';
import { Eye, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lk:report-mode';

interface ReportModeToggleProps {
  /** 容器 ref，toggle 会修改其 data-mode 属性 */
  scopeRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function ReportModeToggle({ scopeRef, className }: ReportModeToggleProps) {
  const [mode, setMode] = React.useState<'light' | 'terminal'>('light');

  // 从 localStorage 恢复
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'terminal' || saved === 'light') {
        setMode(saved);
      }
    } catch {
      /* noop */
    }
  }, []);

  // 应用到 scope
  React.useEffect(() => {
    const el = scopeRef.current;
    if (!el) return;
    if (mode === 'terminal') {
      el.setAttribute('data-mode', 'terminal');
    } else {
      el.removeAttribute('data-mode');
    }
  }, [mode, scopeRef]);

  const toggle = () => {
    const next = mode === 'light' ? 'terminal' : 'light';
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'terminal' ? '切换到亮色阅读' : '切换到深色读盘'}
      title={mode === 'terminal' ? '切换到亮色阅读' : '切换到深色读盘'}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border px-3 text-xs font-semibold transition',
        mode === 'terminal'
          ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
          : 'border-[color:var(--hairline-strong)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]',
        className,
      )}
    >
      {mode === 'terminal' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      {mode === 'terminal' ? '读盘模式' : '阅读模式'}
    </button>
  );
}
