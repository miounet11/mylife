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
import { buildDayunBandsFromResult } from '@/lib/kline-dayun-bands';
import { buildPersonalKlineHighlight } from '@/lib/kline-showcase';
import type { KlineCalibrationMarker } from '@/lib/kline-calibration';
import { calibrationSummaryLine } from '@/lib/kline-calibration';
import KlineShareStrip from '@/components/kline/kline-share-strip';

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-[12px] bg-[color:var(--bg-sunken)]" />
  ),
});

/** 默认焦点窗，一眼定位「我在哪」；80 年与月视图二级 */
const MODES: KlineViewMode[] = ['focus', 'life80', 'months10', 'months3'];

export default function ProKlineSection({
  klineData,
  peak,
  trough,
  birthYear,
  yongShen,
  jiShen,
  dayun,
  publicName,
  reportId,
  locale,
  calibrationMarkers,
}: {
  klineData?: FortuneAnalysisResult['klineData'] | null;
  peak: ProKlinePeak | null;
  trough?: ProKlinePeak | null;
  /** 出生公历年，用于人生焦点窗与「你在这里」 */
  birthYear?: number;
  yongShen?: string[];
  jiShen?: string[];
  /** fortune.dayun 全量，用于色带 */
  dayun?: unknown;
  publicName?: string;
  reportId?: string;
  locale?: string | null;
  calibrationMarkers?: KlineCalibrationMarker[] | null;
}) {
  const raw = Array.isArray(klineData) ? klineData : [];
  const [mode, setMode] = useState<KlineViewMode>('focus');

  const series = useMemo(
    () =>
      buildKlineViewSeries(raw as any, mode, {
        birthYear,
        yongShen,
        jiShen,
      }),
    [raw, mode, birthYear, yongShen, jiShen],
  );

  const dayunBands = useMemo(() => {
    if (!series.length) return [];
    const years = series.map((p) => p.year).filter((y) => Number.isFinite(y));
    if (!years.length) return [];
    return buildDayunBandsFromResult(dayun, {
      chartMinYear: Math.min(...years),
      chartMaxYear: Math.max(...years),
    });
  }, [dayun, series]);

  const shareHighlight = useMemo(
    () =>
      buildPersonalKlineHighlight(raw as any, {
        birthYear,
        calibrationMarkers,
      }),
    [raw, birthYear, calibrationMarkers],
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
    _isMonth: Boolean(p.month),
  }));

  const isYearMode = mode === 'focus' || mode === 'life80';
  const currentYear = new Date().getFullYear();
  const sparkline = series.map((p) => p.overall);
  const sparklineHereIndex = Math.max(
    0,
    series.findIndex((p) => p.year === currentYear),
  );
  const calibNote = calibrationSummaryLine(calibrationMarkers || []);

  return (
    <section className="border-y border-[color:var(--hairline)] py-4" aria-labelledby="pro-kline-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--brand-strong)]">
            核心功能 · Life K-Line
          </p>
          <h2
            id="pro-kline-heading"
            className="mt-0.5 text-[16px] font-bold text-[color:var(--ink-1)] md:text-[17px]"
          >
            人生 K 线
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            默认看<strong className="font-semibold text-[color:var(--ink-2)]">人生焦点</strong>
            （出生到未来十年）与综合线；需要时再展开 80 年或按月细看。
            {meta.description}
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
        {isYearMode ? ' · 年粒度 · 默认只亮综合线' : ' · 月粒度（公历月近似）'}
        {calibNote ? ` · ${calibNote}` : ''}
      </p>

      <div className="mt-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[12px] bg-[color:var(--bg-sunken)]" />}>
          <FortuneChart
            data={chartData as any}
            height={mode === 'months10' ? 320 : mode === 'focus' ? 300 : 300}
            title={
              mode === 'focus'
                ? '人生焦点 · 你在这里'
                : mode === 'life80'
                  ? '人生 80 年 · 流年大运 K 线'
                  : mode === 'months10'
                    ? '近 10 年 · 按月 K 线'
                    : '近 3 年 · 按月 K 线'
            }
            subtitle={
              mode === 'focus'
                ? birthYear
                  ? `出生 ${birthYear} → 未来十年 · 综合主线${dayunBands.length ? ' · 底色为大运段' : ''}`
                  : `出生到未来十年 · 综合主线${dayunBands.length ? ' · 底色为大运段' : ''}`
                : mode === 'life80'
                  ? peak
                    ? `巅峰参考 · ${peak.year}年`
                    : '出生起按年'
                  : '月柱干支 × 用忌修正'
            }
            xIsMonth={!isYearMode}
            birthYear={isYearMode ? birthYear : undefined}
            defaultDims={
              isYearMode
                ? { overall: true, career: false, wealth: false, marriage: false, health: false }
                : undefined
            }
            emphasizeYouAreHere
            dayunBands={isYearMode ? dayunBands : undefined}
            calibrationMarkers={isYearMode ? calibrationMarkers : undefined}
          />
        </Suspense>
      </div>

      <div className="mt-3">
        <KlineShareStrip
          highlight={shareHighlight}
          publicName={publicName}
          reportId={reportId}
          locale={locale}
          sparkline={sparkline}
          sparklineHereIndex={
            sparklineHereIndex >= 0 ? sparklineHereIndex : undefined
          }
        />
      </div>
    </section>
  );
}
