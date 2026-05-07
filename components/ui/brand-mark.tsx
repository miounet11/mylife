// 人生 K 线 · 品牌锚 logo
// 概念：四柱 K 线（年/月/日/时）+ 判断基线 + 当前时点金菱
// 第三柱（日柱）实色 = 用户的"我"
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §2.1

import * as React from 'react';

interface BrandMarkProps {
  size?: number;
  withSignal?: boolean;
  withBaseline?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function BrandMark({
  size = 32,
  withSignal = true,
  withBaseline = true,
  className,
  ariaLabel = '人生K线',
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      className={className}
      fill="none"
    >
      {/* 四柱：年 / 月 / 日（实色）/ 时 */}
      <rect
        x="3.5"
        y="9"
        width="2.5"
        height="14"
        rx="0.5"
        stroke="var(--brand-deep, #074840)"
        strokeWidth="1.4"
      />
      <rect
        x="10"
        y="6"
        width="2.5"
        height="20"
        rx="0.5"
        stroke="var(--brand-deep, #074840)"
        strokeWidth="1.4"
      />
      <rect
        x="16.5"
        y="3.5"
        width="2.5"
        height="25"
        rx="0.5"
        fill="var(--brand-strong, #0b5f55)"
      />
      <rect
        x="23"
        y="10"
        width="2.5"
        height="13"
        rx="0.5"
        stroke="var(--brand-deep, #074840)"
        strokeWidth="1.4"
      />

      {/* 判断基线 */}
      {withBaseline && (
        <line
          x1="0"
          y1="16"
          x2="32"
          y2="16"
          stroke="var(--brand-deep, #074840)"
          strokeWidth="0.7"
          strokeDasharray="2 2"
          opacity="0.45"
        />
      )}

      {/* 当前时点金菱（仅高价值场景显示）*/}
      {withSignal && (
        <path
          d="M 28.5 19.5 L 30.5 21.5 L 28.5 23.5 L 26.5 21.5 Z"
          fill="var(--signal, #c9a14a)"
        />
      )}
    </svg>
  );
}

// 简化版（极小尺寸 / favicon / 灰阶上下文）
// 仅四柱，第三柱实色，无基线无金菱
export function BrandMarkSimple({
  size = 16,
  className,
  ariaLabel = '人生K线',
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      className={className}
      fill="none"
    >
      <rect x="3.5" y="9" width="2.5" height="14" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="6" width="2.5" height="20" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16.5" y="3.5" width="2.5" height="25" fill="currentColor" />
      <rect x="23" y="10" width="2.5" height="13" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
