// 决策台 · 报告封面
// 大尺寸 wordmark 占位 + 用户身份块 + 生成时间 + 抽象 K 线背景
// 替换报告页顶部的"普通标题 + 卡片"组合
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §3.4

import * as React from 'react';
import { BrandMark } from '@/components/ui/brand-mark';
import { Tag } from '@/components/ui/tag';
import { Eyebrow } from '@/components/ui/eyebrow';

interface ReportCoverProps {
  userName?: string;
  birthIso?: string;
  birthLocation?: string;
  pillarSummary?: string;
  reportId?: string;
  reportVersion?: string;
  pipelineVersion?: string;
  generatedAt?: string;
  qualityTier?: string;
  qualityScore?: number;
  className?: string;
}

export function ReportCover({
  userName,
  birthIso,
  birthLocation,
  pillarSummary,
  generatedAt,
  qualityTier,
  qualityScore,
  className,
}: ReportCoverProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] p-5 md:p-7 ${className || ''}`}
    >
      {/* 抽象 K 线背景图层 */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 800 240"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="120"
          x2="800"
          y2="120"
          stroke="var(--hairline)"
          strokeDasharray="3 3"
        />
        {[40, 110, 180, 250, 320, 390, 460, 530, 600, 670, 740].map((x, i) => {
          const heights = [60, 80, 100, 130, 90, 150, 120, 175, 110, 140, 95];
          const ys = [90, 80, 70, 55, 75, 45, 60, 32, 65, 50, 73];
          const isMine = i === 5;
          return (
            <rect
              key={x}
              x={x}
              y={ys[i]}
              width="6"
              height={heights[i]}
              fill={isMine ? 'var(--brand-strong)' : 'var(--hairline)'}
              opacity={isMine ? 0.85 : 0.4}
            />
          );
        })}
        {/* 当前时点金菱 */}
        <path
          d="M 700 180 L 712 192 L 700 204 L 688 192 Z"
          fill="var(--signal)"
          opacity="0.9"
        />
      </svg>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark size={44} withSignal withBaseline={false} />
            <div>
              <Eyebrow tone="brand">人生K线 · 判断报告</Eyebrow>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--ink-5)]">
                LIFE KLINE · DECISION REPORT
              </div>
            </div>
          </div>

          {qualityTier && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag tone="signal" variant="soft" size="sm">
                {qualityTier}
                {typeof qualityScore === 'number' && (
                  <span className="ml-1 font-mono">{qualityScore}</span>
                )}
              </Tag>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-end">
          <div>
            {userName && (
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                {userName}
                <span className="ml-2 font-serif text-[color:var(--brand-strong)]">的判断报告</span>
              </h1>
            )}
            {pillarSummary && (
              <div className="mt-3 font-mono text-base font-bold tracking-wider text-[color:var(--ink-2)]">
                {pillarSummary}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs md:text-right">
            {birthIso && (
              <div>
                <div className="font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                  出生时间
                </div>
                <div className="mt-1 font-mono tabular-nums text-[color:var(--ink-2)]">
                  {birthIso}
                </div>
              </div>
            )}
            {birthLocation && (
              <div>
                <div className="font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                  出生地点
                </div>
                <div className="mt-1 text-[color:var(--ink-2)]">{birthLocation}</div>
              </div>
            )}
            {generatedAt && (
              <div>
                <div className="font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                  生成时间
                </div>
                <div className="mt-1 font-mono tabular-nums text-[color:var(--ink-3)]">
                  {generatedAt}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
