'use client';

import { useMemo, useState } from 'react';
import { Suspense } from 'react';
import NextDynamic from 'next/dynamic';
import type { ProKlinePeak } from '@/lib/report-pro-view';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import {
  buildKlineViewSeries,
  KLINE_VIEW_META,
  type KlineViewMode,
} from '@/lib/kline-views';

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-[12px] bg-[color:var(--bg-sunken)]" />
  ),
});

const MODES: KlineViewMode[] = ['life80', 'months10', 'months3'];

export default function ProKlineSection({
  klineData,
  peak,
  trough,
  birthYear,
  yongShen,
  jiShen,
}: {
  klineData?: FortuneAnalysisResult['klineData'] | null;
  peak: ProKlinePeak | null;
  trough?: ProKlinePeak | null;
  /** 出生公历年，用于人生 80 年轴 */
  birthYear?: number;
  yongShen?: string[];
  jiShen?: string[];
}) {
  const raw = Array.isArray(klineData) ? klineData : [];
  const [mode, setMode] = useState<KlineViewMode>('life80');

  const series = useMemo(
    () =>
      buildKlineViewSeries(raw as any, mode, {
        birthYear,
        yongShen,
        jiShen,
      }),
    [raw, mode, birthYear, yongShen, jiShen]
  );

  if (!raw.length && !series.length) return null;

  const meta = KLINE_VIEW_META[mode];
  const chartData = series.map((p) => ({
    year: p.month ? p.key : p.year,
    career: p.career,
    wealth: p.wealth,
    marriage: p.marriage,
    health: p.health,
    score: p.overall,
    evidence: {
      ganZhi: p.ganZhi,
      drivers: p.drivers,
      risks: p.risks,
    },
    // month chart uses string keys in `year` field for XAxis
    _isMonth: Boolean(p.month),
  }));

  return (
    <section id="pro-kline" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">人生 K 线</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            大运 / 流年 / 用神加权。{meta.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-5)]">
          {peak ? <span>高点 · {peak.label}</span> : null}
          {trough ? <span>低点 · {trough.label}</span> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-2.5 text-[13px]">
        {MODES.map((m) => {
          const on = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                on
                  ? 'font-medium text-[color:var(--ink-1)]'
                  : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]'
              }
              aria-current={on ? 'true' : undefined}
            >
              {KLINE_VIEW_META[m].short}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
        {meta.label} · {series.length} 个点
        {mode === 'life80'
          ? ' · 年粒度'
          : ' · 月粒度（公历月近似，节气交界可对照专业点盘）'}
      </p>

      <div className="mt-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[12px] bg-[color:var(--bg-sunken)]" />}>
          <FortuneChart
            data={chartData as any}
            height={mode === 'months10' ? 320 : 300}
            title={
              mode === 'life80'
                ? '人生 80 年 · 流年大运 K 线'
                : mode === 'months10'
                  ? '近 10 年 · 按月 K 线'
                  : '近 3 年 · 按月 K 线'
            }
            subtitle={
              mode === 'life80'
                ? peak
                  ? `巅峰参考 · ${peak.year}年`
                  : '出生起按年'
                : '月柱干支 × 用忌修正'
            }
            xIsMonth={mode !== 'life80'}
          />
        </Suspense>
      </div>
    </section>
  );
}
