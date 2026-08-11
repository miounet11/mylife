'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { KlineCalibrationMarker } from '@/lib/kline-calibration';
import type { KlineDayunBand } from '@/lib/kline-dayun-bands';
import { qualityLabelZh } from '@/lib/kline-dayun-bands';
import {
  buildYearDeskModel,
  findYearPoint,
  type KlineYearPointLike,
  type YearDeskModel,
} from '@/lib/kline-year-detail';

const STANCE_LABEL = {
  push: '宜推进',
  steady: '宜稳态',
  conserve: '宜收敛',
} as const;

/**
 * 引擎全量工作台：选中年的证据包 + 12 月展开 + 万年历深链。
 * 全部确定性引擎数据，无 LLM。
 */
export default function KlineEngineDesk({
  year,
  klineData,
  yongShen,
  jiShen,
  dayunBands,
  calibrationMarkers,
  onSelectYear,
}: {
  year: number;
  /** 原始报告 klineData（保留 full evidence） */
  klineData?: unknown;
  yongShen?: string[];
  jiShen?: string[];
  dayunBands?: KlineDayunBand[] | null;
  calibrationMarkers?: KlineCalibrationMarker[] | null;
  onSelectYear?: (year: number) => void;
}) {
  const [openBlocks, setOpenBlocks] = useState(true);
  const yearPoint = useMemo(
    () => findYearPoint(klineData, year),
    [klineData, year],
  );

  const desk: YearDeskModel | null = useMemo(() => {
    if (!yearPoint) {
      // Fallback synthetic year point so UI still shows month grid
      const fallback: KlineYearPointLike = {
        year,
        career: 60,
        wealth: 60,
        marriage: 60,
        health: 60,
        overall: 60,
      };
      return buildYearDeskModel(fallback, { yongShen, jiShen });
    }
    return buildYearDeskModel(yearPoint, { yongShen, jiShen });
  }, [yearPoint, year, yongShen, jiShen]);

  if (!desk) return null;

  const band =
    (dayunBands || []).find((b) => year >= b.startYear && year <= b.endYear) ||
    null;
  const calib = (calibrationMarkers || []).filter((m) => m.year === year);
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const currentMonth = isCurrentYear ? now.getMonth() + 1 : null;

  return (
    <section
      id="kline-engine-desk"
      className="mt-3 space-y-3 rounded-[12px] border border-[color:var(--ink-1)]/12 bg-[color:var(--paper)] p-3 md:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--brand-strong)]">
            引擎全量 · {year} 年
          </p>
          <h3 className="mt-0.5 text-[16px] font-bold text-[color:var(--ink-1)]">
            {desk.ganZhi} 流年
            {desk.dayunGanZhi ? (
              <span className="ml-2 text-[13px] font-semibold text-[color:var(--ink-3)]">
                · 大运 {desk.dayunGanZhi}
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
            确定性引擎输出（非 LLM）。下方 12 月可点进万年历通书 + 个人日运。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={desk.almanacYearHref}
            className="rounded-full bg-[color:var(--ink-1)] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            打开万年历 {year}
          </Link>
          <Link
            href="/almanac"
            className="rounded-full border border-[color:var(--hairline-strong)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            通书首页
          </Link>
        </div>
      </div>

      {/* 四维总览 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="综合" value={desk.overall} strong />
        <Stat label="事业" value={desk.career} />
        <Stat label="财富" value={desk.wealth} />
        <Stat label="关系" value={desk.marriage} />
        <Stat label="健康" value={desk.health} />
      </div>

      {band ? (
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2 text-[12px] text-[color:var(--ink-3)]">
          <span className="font-semibold text-[color:var(--ink-1)]">所在大运段</span>
          {' · '}
          {band.ganZhi}（{band.startYear}–{band.endYear}）
          {band.quality ? ` · ${qualityLabelZh(band.quality)}` : ''}
          {band.isCurrent ? ' · 当前大运' : ''}
          {band.description ? (
            <span className="mt-1 block text-[11px] text-[color:var(--ink-4)]">
              {band.description}
            </span>
          ) : null}
        </div>
      ) : null}

      {calib.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-[12px]">
          {calib.map((m) => (
            <span
              key={`${m.kind}-${m.year}-${m.title}`}
              className={
                m.kind === 'confirmed'
                  ? 'rounded-full bg-[rgba(47,125,82,0.1)] px-2.5 py-1 font-medium text-[color:var(--data-up)]'
                  : 'rounded-full bg-[rgba(217,119,6,0.1)] px-2.5 py-1 font-medium text-amber-800'
              }
            >
              {m.kind === 'confirmed' ? '✓ 确认' : '× 未发生'} · {m.title}
            </span>
          ))}
        </div>
      ) : null}

      {/* 引擎证据全量 */}
      <div className="rounded-[10px] border border-[color:var(--hairline)]">
        <button
          type="button"
          onClick={() => setOpenBlocks((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        >
          <span className="text-[13px] font-semibold text-[color:var(--ink-1)]">
            引擎证据包（原局 / 大运 / 流年 / 五行）
          </span>
          <span className="text-[12px] text-[color:var(--ink-5)]">
            {openBlocks ? '收起' : '展开'} · {desk.evidenceBlocks.length} 组
          </span>
        </button>
        {openBlocks ? (
          <div className="grid gap-2 border-t border-[color:var(--hairline)] p-3 sm:grid-cols-2">
            {desk.evidenceBlocks.map((block) => (
              <div
                key={block.label}
                className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2"
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
                  {block.label}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {block.items.map((item, i) => (
                    <li
                      key={`${block.label}-${i}`}
                      className="text-[12px] leading-relaxed text-[color:var(--ink-2)]"
                    >
                      · {item.text}
                      {typeof item.impact === 'number' ? (
                        <span className="ml-1 tabular-nums text-[color:var(--ink-5)]">
                          ({item.impact > 0 ? '+' : ''}
                          {item.impact})
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 月度精选 */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[rgba(47,125,82,0.2)] bg-[rgba(47,125,82,0.05)] px-3 py-2">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">较好月份（引擎）</div>
          <ul className="mt-1 space-y-0.5 text-[12px] text-[color:var(--ink-2)]">
            {desk.bestMonths.map((m) => (
              <li key={`b-${m.key}`}>
                {m.month}月 · {m.monthGanZhi} · 综合 {m.overall}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[8px] border border-[color:var(--signal)]/30 bg-[color:var(--signal-soft)]/30 px-3 py-2">
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">
            承压月份（引擎）
          </div>
          <ul className="mt-1 space-y-0.5 text-[12px] text-[color:var(--ink-2)]">
            {desk.toughMonths.map((m) => (
              <li key={`t-${m.key}`}>
                {m.month}月 · {m.monthGanZhi} · 综合 {m.overall}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 12 月网格 → 万年历 */}
      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[13px] font-semibold text-[color:var(--ink-1)]">
            {year} 年 · 12 月节奏（引擎）
          </h4>
          <p className="text-[11px] text-[color:var(--ink-5)]">点击月份打开万年历</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
          {desk.months.map((m) => {
            const isNow = currentMonth === m.month;
            return (
              <Link
                key={m.key}
                href={`/almanac/${m.almanacDate}`}
                className={`rounded-[8px] border px-2 py-2 transition hover:border-[color:var(--ink-1)] hover:bg-white ${
                  isNow
                    ? 'border-[color:var(--brand-strong)] bg-[color:var(--brand-soft)]/40'
                    : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/30'
                }`}
                title={`${m.key} ${m.monthGanZhi} · 打开万年历`}
              >
                <div className="flex items-center justify-between text-[11px] text-[color:var(--ink-5)]">
                  <span className="font-semibold text-[color:var(--ink-2)]">{m.month}月</span>
                  {isNow ? <span className="text-[color:var(--brand-strong)]">本月</span> : null}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-[color:var(--ink-3)]">
                  {m.monthGanZhi}
                </div>
                <div className="mt-1 text-[15px] font-bold tabular-nums text-[color:var(--ink-1)]">
                  {m.overall}
                </div>
                <div className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">
                  {STANCE_LABEL[m.stance]}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums text-[color:var(--ink-4)]">
                  业{m.career} 财{m.wealth}
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">{desk.note}</p>
      </div>

      {/* 邻近年快捷 */}
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--hairline)] pt-3 text-[12px]">
        <span className="text-[color:var(--ink-5)]">切换年份</span>
        {[year - 1, year, year + 1, year + 2].map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelectYear?.(y)}
            className={
              y === year
                ? 'font-semibold text-[color:var(--ink-1)]'
                : 'text-[color:var(--ink-4)] underline-offset-2 hover:underline'
            }
          >
            {y}
          </button>
        ))}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-[8px] border border-[color:var(--hairline)] px-2.5 py-2 ${
        strong ? 'bg-[color:var(--bg-sunken)]' : 'bg-white'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
        {label}
      </div>
      <div className="mt-0.5 text-[16px] font-bold tabular-nums text-[color:var(--ink-1)]">
        {value}
      </div>
    </div>
  );
}
