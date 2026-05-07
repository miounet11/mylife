// 决策台 · 指标块（数字 + 标签 + 变化箭头）
// 取代旧 hero-stat / metric-tile（视觉版），新代码可直接用 <Stat />
// 数字一律等宽体（决策台默认），变化值带方向色
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number | string;
  deltaDirection?: 'up' | 'down' | 'flat';
  hint?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { value: 'text-lg',  label: 'text-[10px]' },
  md: { value: 'text-xl',  label: 'text-xs'    },
  lg: { value: 'text-2xl', label: 'text-xs'    },
} as const;

const deltaColor = {
  up:   'text-[color:var(--data-up)]',
  down: 'text-[color:var(--data-down)]',
  flat: 'text-[color:var(--data-flat)]',
} as const;

const deltaIcon = {
  up:   ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

export function Stat({
  label,
  value,
  unit,
  delta,
  deltaDirection,
  hint,
  align = 'left',
  size = 'md',
  className,
}: StatProps) {
  const s = sizeMap[size];
  const Icon = deltaDirection ? deltaIcon[deltaDirection] : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        align === 'center' && 'items-center text-center',
        align === 'right' && 'items-end text-right',
        className,
      )}
    >
      <div
        className={cn(
          'font-semibold uppercase tracking-wider text-[color:var(--ink-5)]',
          s.label,
        )}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-mono font-black tabular-nums text-[color:var(--ink-1)]',
            s.value,
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[color:var(--ink-4)]">{unit}</span>
        )}
        {delta !== undefined && deltaDirection && Icon && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums',
              deltaColor[deltaDirection],
            )}
          >
            <Icon className="h-3 w-3" />
            {delta}
          </span>
        )}
      </div>
      {hint && <div className="text-xs text-[color:var(--ink-4)]">{hint}</div>}
    </div>
  );
}
