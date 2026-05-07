// 决策台 · 标签 / 信号 chip
// 取代旧 utility：signal-pill / product-chip
// 强约束：tone="signal" 只用于"高价值信号"（升级、付费、阶段警示前奏、报告高质量等级）
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §4.1

import * as React from 'react';
import { cn } from '@/lib/utils';

type TagTone =
  | 'default'  // 中性
  | 'brand'    // 墨绿
  | 'signal'   // 金色（金色铁律：仅高价值）
  | 'env'      // 冷蓝（环境变量专色）
  | 'up'       // 数据上行（绿）
  | 'down'     // 数据下行（赤）
  | 'alert';   // 警示（赤）

type TagSize = 'xs' | 'sm';
type TagVariant = 'soft' | 'outline' | 'solid';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  size?: TagSize;
  variant?: TagVariant;
  leftIcon?: React.ReactNode;
}

const sizeMap: Record<TagSize, string> = {
  xs: 'h-5 px-1.5 text-[10px] gap-1',
  sm: 'h-6 px-2 text-xs gap-1.5',
};

const toneSoft: Record<TagTone, string> = {
  default: 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)] border-[color:var(--hairline)]',
  brand:   'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)] border-[color:var(--brand-soft-2)]',
  signal:  'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)] border-[color:var(--signal-soft)]',
  env:     'bg-[color:var(--env-soft)] text-[color:var(--env)] border-[color:var(--env-soft)]',
  up:      'bg-[rgba(47,125,82,0.10)] text-[color:var(--data-up)] border-[rgba(47,125,82,0.20)]',
  down:    'bg-[rgba(189,76,66,0.08)] text-[color:var(--data-down)] border-[rgba(189,76,66,0.20)]',
  alert:   'bg-[color:var(--alert-soft)] text-[color:var(--alert)] border-[color:var(--alert-soft)]',
};

const toneOutline: Record<TagTone, string> = {
  default: 'bg-transparent text-[color:var(--ink-3)] border-[color:var(--hairline-strong)]',
  brand:   'bg-transparent text-[color:var(--brand-strong)] border-[color:var(--brand)]',
  signal:  'bg-transparent text-[color:var(--signal-strong)] border-[color:var(--signal)]',
  env:     'bg-transparent text-[color:var(--env)] border-[color:var(--env)]',
  up:      'bg-transparent text-[color:var(--data-up)] border-[color:var(--data-up)]',
  down:    'bg-transparent text-[color:var(--data-down)] border-[color:var(--data-down)]',
  alert:   'bg-transparent text-[color:var(--alert)] border-[color:var(--alert)]',
};

const toneSolid: Record<TagTone, string> = {
  default: 'bg-[color:var(--ink-3)] text-white border-[color:var(--ink-3)]',
  brand:   'bg-[color:var(--brand-strong)] text-white border-[color:var(--brand-deep)]',
  signal:  'bg-[color:var(--signal)] text-[color:var(--ink-1)] border-[color:var(--signal-strong)]',
  env:     'bg-[color:var(--env)] text-white border-[color:var(--env)]',
  up:      'bg-[color:var(--data-up)] text-white border-[color:var(--data-up)]',
  down:    'bg-[color:var(--data-down)] text-white border-[color:var(--data-down)]',
  alert:   'bg-[color:var(--alert)] text-white border-[color:var(--alert)]',
};

export function Tag({
  tone = 'default',
  size = 'sm',
  variant = 'soft',
  leftIcon,
  className,
  children,
  ...props
}: TagProps) {
  const toneCls =
    variant === 'soft' ? toneSoft[tone] : variant === 'outline' ? toneOutline[tone] : toneSolid[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] border font-semibold whitespace-nowrap',
        sizeMap[size],
        toneCls,
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </span>
  );
}
