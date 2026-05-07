// 决策台 · 品牌加载动画
// 四柱依次升起 → 横线掠过 → 金菱落定，1.4s loop
// 用于 Suspense fallback、首屏占位、按钮 loading 强化
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §3.4

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BrandLoaderProps {
  size?: number;
  label?: string;
  className?: string;
}

export function BrandLoader({ size = 56, label, className }: BrandLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)} role="status" aria-live="polite">
      <svg
        viewBox="0 0 56 56"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        {/* 四柱（依次升起） */}
        <rect className="brand-loader-pillar pillar-1" x="6"  y="40" width="4" height="0" rx="1" />
        <rect className="brand-loader-pillar pillar-2" x="16" y="40" width="4" height="0" rx="1" />
        <rect className="brand-loader-pillar pillar-3" x="26" y="40" width="4" height="0" rx="1" />
        <rect className="brand-loader-pillar pillar-4" x="38" y="40" width="4" height="0" rx="1" />

        {/* 判断基线（横向掠过） */}
        <line
          className="brand-loader-baseline"
          x1="0"
          y1="32"
          x2="0"
          y2="32"
          stroke="var(--brand-deep, #074840)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* 金菱（最后落定） */}
        <path
          className="brand-loader-signal"
          d="M 48 36 L 52 40 L 48 44 L 44 40 Z"
          fill="var(--signal, #c9a14a)"
        />
      </svg>

      {label && (
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ink-4)]">
          {label}
        </span>
      )}

      <style jsx>{`
        .brand-loader-pillar {
          fill: var(--brand-strong, #0b5f55);
          transform-origin: bottom;
          animation: brand-loader-grow 1.4s ease-in-out infinite;
        }
        .pillar-1 { animation-delay: 0s; }
        .pillar-2 { animation-delay: 0.12s; }
        .pillar-3 { animation-delay: 0.24s; fill: var(--brand-deep, #074840); }
        .pillar-4 { animation-delay: 0.36s; }

        .brand-loader-baseline {
          animation: brand-loader-sweep 1.4s ease-in-out infinite;
          animation-delay: 0.48s;
        }

        .brand-loader-signal {
          opacity: 0;
          transform-origin: 48px 40px;
          animation: brand-loader-drop 1.4s ease-in-out infinite;
          animation-delay: 0.72s;
        }

        @keyframes brand-loader-grow {
          0%, 100% { height: 0; y: 40px; }
          14%      { height: 16px; y: 24px; }
          50%      { height: 26px; y: 14px; }
        }

        .pillar-1 { animation-name: brand-loader-grow-1; }
        .pillar-2 { animation-name: brand-loader-grow-2; }
        .pillar-3 { animation-name: brand-loader-grow-3; }
        .pillar-4 { animation-name: brand-loader-grow-4; }

        @keyframes brand-loader-grow-1 {
          0%, 100% { height: 0; y: 40px; }
          15%, 80% { height: 18px; y: 22px; }
        }
        @keyframes brand-loader-grow-2 {
          0%, 100% { height: 0; y: 40px; }
          25%, 80% { height: 28px; y: 12px; }
        }
        @keyframes brand-loader-grow-3 {
          0%, 100% { height: 0; y: 40px; }
          35%, 80% { height: 36px; y: 4px; }
        }
        @keyframes brand-loader-grow-4 {
          0%, 100% { height: 0; y: 40px; }
          45%, 80% { height: 22px; y: 18px; }
        }

        @keyframes brand-loader-sweep {
          0%, 50%   { x1: 0; x2: 0; opacity: 0; }
          60%, 75%  { x1: 0; x2: 56; opacity: 0.5; }
          100%      { x1: 56; x2: 56; opacity: 0; }
        }

        @keyframes brand-loader-drop {
          0%, 70%   { opacity: 0; transform: translateY(-8px); }
          80%, 95%  { opacity: 1; transform: translateY(0); }
          100%      { opacity: 0; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-loader-pillar,
          .brand-loader-baseline,
          .brand-loader-signal {
            animation: none;
          }
          .brand-loader-pillar { fill: var(--brand-strong, #0b5f55); height: 24px; y: 16px; }
          .pillar-3 { height: 32px; y: 8px; }
          .brand-loader-signal { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
