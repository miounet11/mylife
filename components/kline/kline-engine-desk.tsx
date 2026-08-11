'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import type { KlineCalibrationMarker } from '@/lib/kline-calibration';
import type { KlineDayunBand } from '@/lib/kline-dayun-bands';
import { qualityLabelZh } from '@/lib/kline-dayun-bands';
import {
  buildNeighborYearStrip,
  buildYearDeskModel,
  findYearPoint,
  listAllYearSummaries,
  type KlineYearPointLike,
  type YearDeskModel,
} from '@/lib/kline-year-detail';

const STANCE_LABEL = {
  push: '宜推进',
  steady: '宜稳态',
  conserve: '宜收敛',
} as const;

const STANCE_TONE = {
  push: 'text-[color:var(--data-up)]',
  steady: 'text-[color:var(--ink-3)]',
  conserve: 'text-[color:var(--signal-strong)]',
} as const;

/**
 * 引擎全量工作台 — 疯狂堆料版
 * 年证据包 + 邻年对比 + 大运全表 + 四维月热力 + 12 月万年历深链 + 公式栈
 * 全部确定性引擎，无 LLM。
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
  klineData?: unknown;
  yongShen?: string[];
  jiShen?: string[];
  dayunBands?: KlineDayunBand[] | null;
  calibrationMarkers?: KlineCalibrationMarker[] | null;
  onSelectYear?: (year: number) => void;
}) {
  const [showAllYears, setShowAllYears] = useState(false);
  const [showFormula, setShowFormula] = useState(true);
  const [dimHeat, setDimHeat] = useState<'overall' | 'career' | 'wealth' | 'marriage' | 'health'>(
    'overall',
  );

  const yearPoint = useMemo(() => findYearPoint(klineData, year), [klineData, year]);

  const desk: YearDeskModel | null = useMemo(() => {
    if (!yearPoint) {
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

  const neighbors = useMemo(
    () => buildNeighborYearStrip(klineData, year, 5),
    [klineData, year],
  );

  const allYears = useMemo(() => listAllYearSummaries(klineData), [klineData]);

  const prevYear = useMemo(() => findYearPoint(klineData, year - 1), [klineData, year]);
  const nextYear = useMemo(() => findYearPoint(klineData, year + 1), [klineData, year]);

  if (!desk) return null;

  const band =
    (dayunBands || []).find((b) => year >= b.startYear && year <= b.endYear) || null;
  const calib = (calibrationMarkers || []).filter((m) => m.year === year);
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const currentMonth = isCurrentYear ? now.getMonth() + 1 : null;
  const bands = dayunBands || [];

  const vsPrev =
    prevYear != null
      ? desk.overall -
        Math.round(
          (prevYear.career + prevYear.wealth + prevYear.marriage + prevYear.health) / 4,
        )
      : null;
  const vsNext =
    nextYear != null
      ? Math.round(
          (nextYear.career + nextYear.wealth + nextYear.marriage + nextYear.health) / 4,
        ) - desk.overall
      : null;

  const maxImpact = Math.max(
    1,
    ...desk.impactStack.map((r) => Math.abs(r.impact)),
  );

  return (
    <section
      id="kline-engine-desk"
      className="mt-3 space-y-4 rounded-[12px] border border-[color:var(--ink-1)]/12 bg-[color:var(--paper)] p-3 md:p-5"
    >
      {/* ── 标题条 ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            引擎全量工作台 · Engine Desk · 非 LLM
          </p>
          <h3 className="mt-1 text-[18px] font-bold tracking-tight text-[color:var(--ink-1)] md:text-[20px]">
            {desk.year} · {desk.ganZhi} 流年
            {desk.dayunGanZhi ? (
              <span className="ml-2 text-[14px] font-semibold text-[color:var(--ink-3)]">
                / {desk.dayunGanZhi} 大运
              </span>
            ) : null}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {desk.yongShenMatch ? (
              <Badge>{desk.yongShenMatch}</Badge>
            ) : null}
            {desk.yearElement ? <Badge>流年五行 · {desk.yearElement}</Badge> : null}
            {desk.relationSummary ? (
              <Badge>原局 · {desk.relationSummary}</Badge>
            ) : null}
            {isCurrentYear ? <Badge tone="brand">今年</Badge> : null}
            {calib.map((m) => (
              <Badge key={`${m.kind}-${m.title}`} tone={m.kind === 'confirmed' ? 'up' : 'warn'}>
                {m.kind === 'confirmed' ? '✓' : '×'} {m.title}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={desk.almanacYearHref}
            className="rounded-full bg-[color:var(--ink-1)] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            万年历 {year}
          </Link>
          <Link
            href={desk.almanacTodayHref}
            className="rounded-full border border-[color:var(--hairline-strong)] px-3.5 py-1.5 text-[12px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            今日通书
          </Link>
          <Link
            href="/almanac"
            className="rounded-full border border-[color:var(--hairline)] px-3.5 py-1.5 text-[12px] text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]"
          >
            通书首页
          </Link>
        </div>
      </div>

      {/* ── 核心数字墙 ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="综合" value={desk.overall} strong />
        <Stat label="事业" value={desk.career} />
        <Stat label="财富" value={desk.wealth} />
        <Stat label="关系" value={desk.marriage} />
        <Stat label="健康" value={desk.health} />
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2.5 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
            较邻年
          </div>
          <div className="mt-0.5 text-[12px] font-semibold leading-snug text-[color:var(--ink-2)]">
            {vsPrev != null ? (
              <span>
                vs{year - 1}{' '}
                <span className={vsPrev >= 0 ? 'text-[color:var(--data-up)]' : 'text-[color:var(--signal-strong)]'}>
                  {vsPrev >= 0 ? '+' : ''}
                  {vsPrev}
                </span>
              </span>
            ) : (
              '—'
            )}
            <br />
            {vsNext != null ? (
              <span>
                vs{year + 1}{' '}
                <span className={vsNext >= 0 ? 'text-[color:var(--data-up)]' : 'text-[color:var(--signal-strong)]'}>
                  {vsNext >= 0 ? '将' : '将'}
                  {vsNext >= 0 ? '+' : ''}
                  {vsNext}
                </span>
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* ── 四维排名 ── */}
      <div className="rounded-[10px] border border-[color:var(--hairline)] px-3 py-2.5">
        <div className="text-[11px] font-bold text-[color:var(--ink-5)]">四维强弱排序（本流年）</div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
          {desk.dimRanks.map((d) => (
            <div
              key={d.key}
              className="flex items-center gap-2 rounded-[6px] bg-[color:var(--bg-sunken)]/50 px-2 py-1.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--ink-1)] text-[10px] font-bold text-white">
                {d.rank}
              </span>
              <span className="text-[12px] font-medium text-[color:var(--ink-2)]">{d.label}</span>
              <span className="ml-auto text-[13px] font-bold tabular-nums text-[color:var(--ink-1)]">
                {d.score}
              </span>
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[color:var(--hairline)]">
                <div
                  className="h-full rounded-full bg-[color:var(--brand-strong)]"
                  style={{ width: `${Math.min(100, d.score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 邻年对比条 ── */}
      <div>
        <div className="mb-1.5 text-[12px] font-semibold text-[color:var(--ink-1)]">
          邻年对比 · 前后各 5 年（点年切换）
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {neighbors.map((n) => (
            <button
              key={n.year}
              type="button"
              onClick={() => onSelectYear?.(n.year)}
              className={`min-w-[4.5rem] shrink-0 rounded-[8px] border px-2 py-2 text-left transition ${
                n.isFocus
                  ? 'border-[color:var(--ink-1)] bg-[color:var(--ink-1)] text-white'
                  : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 hover:border-[color:var(--ink-1)]'
              }`}
            >
              <div className={`text-[10px] ${n.isFocus ? 'text-white/70' : 'text-[color:var(--ink-5)]'}`}>
                {n.ganZhi}
              </div>
              <div className="text-[12px] font-bold">{n.year}</div>
              <div className="text-[14px] font-bold tabular-nums">{n.overall}</div>
              <div
                className={`text-[10px] tabular-nums ${
                  n.isFocus
                    ? 'text-white/80'
                    : n.deltaVsFocus >= 0
                      ? 'text-[color:var(--data-up)]'
                      : 'text-[color:var(--signal-strong)]'
                }`}
              >
                {n.isFocus ? '焦点' : n.deltaVsFocus >= 0 ? `+${n.deltaVsFocus}` : n.deltaVsFocus}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 大运全表 ── */}
      {bands.length > 0 ? (
        <div className="rounded-[10px] border border-[color:var(--hairline)]">
          <div className="border-b border-[color:var(--hairline)] px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-1)]">
            大运全表 · 点击段内年份跳转
          </div>
          <div className="divide-y divide-[color:var(--hairline)]">
            {bands.map((b) => {
              const active = year >= b.startYear && year <= b.endYear;
              const mid = Math.round((b.startYear + b.endYear) / 2);
              return (
                <button
                  key={`${b.ganZhi}-${b.startYear}`}
                  type="button"
                  onClick={() => onSelectYear?.(active ? year : mid)}
                  className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left text-[12px] ${
                    active ? 'bg-[color:var(--bg-sunken)]' : 'hover:bg-[color:var(--bg-sunken)]/40'
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-[2px] border border-[color:var(--hairline)]"
                    style={{ background: b.fill }}
                  />
                  <span className="font-mono font-bold text-[color:var(--ink-1)]">{b.ganZhi}</span>
                  <span className="text-[color:var(--ink-4)]">
                    {b.startYear}–{b.endYear}
                    {b.startAge != null ? ` · ${b.startAge}–${b.endAge}岁` : ''}
                  </span>
                  {b.quality ? (
                    <span className="text-[color:var(--ink-3)]">{qualityLabelZh(b.quality)}</span>
                  ) : null}
                  {b.yongShenMatch ? (
                    <span className="text-[color:var(--ink-5)]">用忌:{b.yongShenMatch}</span>
                  ) : null}
                  {b.isCurrent ? (
                    <span className="rounded-full bg-[color:var(--brand-soft)] px-1.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
                      当前
                    </span>
                  ) : null}
                  {active ? (
                    <span className="rounded-full bg-[color:var(--ink-1)] px-1.5 text-[10px] font-bold text-white">
                      本段
                    </span>
                  ) : null}
                  {b.description ? (
                    <span className="w-full text-[11px] text-[color:var(--ink-4)]">{b.description}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-[color:var(--ink-5)]">
          本报告暂无大运列表；色带与段描述将在有 dayun 数据时显示。
        </p>
      )}

      {/* ── 所在大运强调 ── */}
      {band ? (
        <div
          className="rounded-[8px] border border-[color:var(--hairline)] px-3 py-2 text-[12px] text-[color:var(--ink-3)]"
          style={{ background: band.fill }}
        >
          <span className="font-semibold text-[color:var(--ink-1)]">焦点年所在大运</span>
          {' · '}
          {band.ganZhi}（{band.startYear}–{band.endYear}）
          {band.quality ? ` · ${qualityLabelZh(band.quality)}` : ''}
        </div>
      ) : null}

      {/* ── 影响栈 ── */}
      {desk.impactStack.length > 0 ? (
        <div className="rounded-[10px] border border-[color:var(--hairline)] p-3">
          <div className="text-[12px] font-semibold text-[color:var(--ink-1)]">
            影响栈 · 原局 / 大运 / 流年（impact）
          </div>
          <ul className="mt-2 space-y-1.5">
            {desk.impactStack.map((row, i) => (
              <li key={`${row.layer}-${i}`} className="flex items-center gap-2 text-[12px]">
                <span className="w-10 shrink-0 text-[10px] font-bold text-[color:var(--ink-5)]">
                  {row.layer}
                </span>
                <span className="min-w-0 flex-1 truncate text-[color:var(--ink-2)]">{row.text}</span>
                <span
                  className={`w-10 text-right font-mono text-[11px] font-bold tabular-nums ${
                    row.impact >= 0 ? 'text-[color:var(--data-up)]' : 'text-[color:var(--signal-strong)]'
                  }`}
                >
                  {row.impact >= 0 ? '+' : ''}
                  {row.impact}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--hairline)]">
                  <div
                    className={`h-full rounded-full ${
                      row.impact >= 0 ? 'bg-[color:var(--data-up)]' : 'bg-[color:var(--signal)]'
                    }`}
                    style={{
                      width: `${Math.min(100, (Math.abs(row.impact) / maxImpact) * 100)}%`,
                      marginLeft: row.impact < 0 ? 'auto' : undefined,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── 证据包全展开 ── */}
      <div className="rounded-[10px] border border-[color:var(--hairline)] p-3">
        <div className="text-[12px] font-semibold text-[color:var(--ink-1)]">
          引擎证据包 · 全量字段（{desk.evidenceBlocks.length} 组）
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* ── 用忌标签 ── */}
      <div className="flex flex-wrap gap-2 text-[12px]">
        <span className="text-[color:var(--ink-5)]">用忌设定</span>
        {(yongShen || []).map((y) => (
          <Badge key={`y-${y}`} tone="up">
            用 {y}
          </Badge>
        ))}
        {(jiShen || []).map((j) => (
          <Badge key={`j-${j}`} tone="warn">
            忌 {j}
          </Badge>
        ))}
        {!yongShen?.length && !jiShen?.length ? (
          <span className="text-[color:var(--ink-5)]">未传入用忌列表</span>
        ) : null}
      </div>

      {/* ── 月姿态统计 ── */}
      <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
        <div className="rounded-[8px] border border-[rgba(47,125,82,0.2)] bg-[rgba(47,125,82,0.06)] px-2 py-2">
          <div className="text-[10px] text-[color:var(--ink-5)]">宜推进月</div>
          <div className="text-[18px] font-bold text-[color:var(--data-up)]">{desk.pushMonthCount}</div>
        </div>
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-2 py-2">
          <div className="text-[10px] text-[color:var(--ink-5)]">宜稳态月</div>
          <div className="text-[18px] font-bold text-[color:var(--ink-2)]">{desk.steadyMonthCount}</div>
        </div>
        <div className="rounded-[8px] border border-[color:var(--signal)]/25 bg-[color:var(--signal-soft)]/25 px-2 py-2">
          <div className="text-[10px] text-[color:var(--ink-5)]">宜收敛月</div>
          <div className="text-[18px] font-bold text-[color:var(--signal-strong)]">
            {desk.conserveMonthCount}
          </div>
        </div>
      </div>

      {/* ── 较好/承压月 ── */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[rgba(47,125,82,0.2)] bg-[rgba(47,125,82,0.05)] px-3 py-2">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">较好月份 Top3</div>
          <ul className="mt-1 space-y-0.5 text-[12px] text-[color:var(--ink-2)]">
            {desk.bestMonths.map((m) => (
              <li key={`b-${m.key}`}>
                <Link href={`/almanac/${m.almanacDate}`} className="hover:underline">
                  {m.month}月 · {m.monthGanZhi} · 综合 {m.overall} · 业{m.career} 财{m.wealth}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[8px] border border-[color:var(--signal)]/30 bg-[color:var(--signal-soft)]/30 px-3 py-2">
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">承压月份 Top3</div>
          <ul className="mt-1 space-y-0.5 text-[12px] text-[color:var(--ink-2)]">
            {desk.toughMonths.map((m) => (
              <li key={`t-${m.key}`}>
                <Link href={`/almanac/${m.almanacDate}`} className="hover:underline">
                  {m.month}月 · {m.monthGanZhi} · 综合 {m.overall} · 业{m.career} 财{m.wealth}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 四维月热力 ── */}
      <div className="rounded-[10px] border border-[color:var(--hairline)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-semibold text-[color:var(--ink-1)]">
            12 月四维热力（点月份 → 万年历）
          </div>
          <div className="flex flex-wrap gap-1 text-[11px]">
            {(['overall', 'career', 'wealth', 'marriage', 'health'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setDimHeat(k)}
                className={
                  dimHeat === k
                    ? 'rounded-full bg-[color:var(--ink-1)] px-2 py-0.5 font-medium text-white'
                    : 'rounded-full px-2 py-0.5 text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]'
                }
              >
                {{ overall: '综合', career: '事业', wealth: '财富', marriage: '关系', health: '健康' }[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex h-24 items-end gap-1">
          {desk.months.map((m) => {
            const val =
              dimHeat === 'overall'
                ? m.overall
                : dimHeat === 'career'
                  ? m.career
                  : dimHeat === 'wealth'
                    ? m.wealth
                    : dimHeat === 'marriage'
                      ? m.marriage
                      : m.health;
            const h = Math.max(8, Math.round(((val - 25) / 73) * 100));
            const isNow = currentMonth === m.month;
            return (
              <Link
                key={`heat-${m.key}`}
                href={`/almanac/${m.almanacDate}`}
                className="group flex flex-1 flex-col items-center gap-0.5"
                title={`${m.month}月 ${m.monthGanZhi} ${val}`}
              >
                <span className="text-[9px] tabular-nums text-[color:var(--ink-5)] opacity-0 group-hover:opacity-100">
                  {val}
                </span>
                <div
                  className={`w-full rounded-t-[3px] ${
                    isNow ? 'bg-[color:var(--brand-strong)]' : 'bg-[color:var(--ink-1)]/70'
                  }`}
                  style={{ height: `${h}%`, opacity: 0.35 + (val / 100) * 0.65 }}
                />
                <span className="text-[10px] text-[color:var(--ink-5)]">{m.month}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 12 月卡片墙 ── */}
      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[13px] font-semibold text-[color:var(--ink-1)]">
            {year} · 12 月引擎分卡
          </h4>
          <p className="text-[11px] text-[color:var(--ink-5)]">
            月柱 · 综合 · 业财关健 · 姿态 → 万年历
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[color:var(--ink-1)]">{m.month}月</span>
                  <span className={STANCE_TONE[m.stance]}>{STANCE_LABEL[m.stance]}</span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-[color:var(--ink-3)]">
                  {m.monthGanZhi}
                  <span className="ml-1 text-[color:var(--ink-5)]">
                    Δ{m.delta >= 0 ? '+' : ''}
                    {m.delta}
                  </span>
                </div>
                <div className="mt-1 text-[18px] font-bold tabular-nums text-[color:var(--ink-1)]">
                  {m.overall}
                </div>
                <div className="mt-0.5 grid grid-cols-2 gap-x-1 text-[10px] tabular-nums text-[color:var(--ink-4)]">
                  <span>业{m.career}</span>
                  <span>财{m.wealth}</span>
                  <span>关{m.marriage}</span>
                  <span>健{m.health}</span>
                </div>
                {isNow ? (
                  <div className="mt-1 text-[10px] font-bold text-[color:var(--brand-strong)]">本月</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 公式与口径 ── */}
      <div className="rounded-[10px] border border-dashed border-[color:var(--hairline-strong)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => setShowFormula((v) => !v)}
          className="flex w-full items-center justify-between text-left text-[12px] font-semibold text-[color:var(--ink-1)]"
        >
          计算口径与公式栈
          <span className="text-[color:var(--ink-5)]">{showFormula ? '收起' : '展开'}</span>
        </button>
        {showFormula ? (
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
            {desk.formulaLines.map((line) => (
              <li key={line}>· {line}</li>
            ))}
            <li className="text-[color:var(--ink-5)]">· {desk.note}</li>
          </ul>
        ) : null}
      </div>

      {/* ── 全样本年表 ── */}
      {allYears.length > 0 ? (
        <div className="rounded-[10px] border border-[color:var(--hairline)]">
          <button
            type="button"
            onClick={() => setShowAllYears((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold text-[color:var(--ink-1)]"
          >
            全样本年表 · {allYears.length} 年引擎点
            <span className="text-[color:var(--ink-5)]">
              {showAllYears ? '收起' : '展开全部'}
            </span>
          </button>
          {showAllYears ? (
            <div className="max-h-72 overflow-auto border-t border-[color:var(--hairline)]">
              <table className="w-full min-w-[640px] text-left text-[11px]">
                <thead className="sticky top-0 bg-[color:var(--bg-sunken)] text-[color:var(--ink-5)]">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">年</th>
                    <th className="px-2 py-1.5 font-medium">干支</th>
                    <th className="px-2 py-1.5 font-medium">大运</th>
                    <th className="px-2 py-1.5 font-medium">综</th>
                    <th className="px-2 py-1.5 font-medium">业</th>
                    <th className="px-2 py-1.5 font-medium">财</th>
                    <th className="px-2 py-1.5 font-medium">关</th>
                    <th className="px-2 py-1.5 font-medium">健</th>
                    <th className="px-2 py-1.5 font-medium">驱动</th>
                    <th className="px-2 py-1.5 font-medium">风险</th>
                  </tr>
                </thead>
                <tbody>
                  {allYears.map((r) => (
                    <tr
                      key={r.year}
                      className={`cursor-pointer border-t border-[color:var(--hairline)] hover:bg-[color:var(--bg-sunken)]/50 ${
                        r.year === year ? 'bg-[color:var(--brand-soft)]/30' : ''
                      }`}
                      onClick={() => onSelectYear?.(r.year)}
                    >
                      <td className="px-2 py-1 font-semibold tabular-nums">{r.year}</td>
                      <td className="px-2 py-1 font-mono">{r.ganZhi}</td>
                      <td className="px-2 py-1 font-mono text-[color:var(--ink-4)]">
                        {r.dayunGanZhi || '—'}
                      </td>
                      <td className="px-2 py-1 font-bold tabular-nums">{r.overall}</td>
                      <td className="px-2 py-1 tabular-nums">{r.career}</td>
                      <td className="px-2 py-1 tabular-nums">{r.wealth}</td>
                      <td className="px-2 py-1 tabular-nums">{r.marriage}</td>
                      <td className="px-2 py-1 tabular-nums">{r.health}</td>
                      <td className="max-w-[8rem] truncate px-2 py-1 text-[color:var(--ink-4)]">
                        {r.drivers.join('、') || '—'}
                      </td>
                      <td className="max-w-[8rem] truncate px-2 py-1 text-[color:var(--ink-4)]">
                        {r.risks.join('、') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── 快捷年 ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--hairline)] pt-3 text-[12px]">
        <span className="text-[color:var(--ink-5)]">快速切换</span>
        {[year - 2, year - 1, year, year + 1, year + 2, year + 3, year + 5].map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelectYear?.(y)}
            className={
              y === year
                ? 'rounded-full bg-[color:var(--ink-1)] px-2.5 py-0.5 font-semibold text-white'
                : 'rounded-full px-2.5 py-0.5 text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]'
            }
          >
            {y}
          </button>
        ))}
        <Link
          href={`/almanac/${year}-01-01`}
          className="ml-auto text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          全年通书入口 →
        </Link>
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
      <div className="mt-0.5 text-[18px] font-bold tabular-nums text-[color:var(--ink-1)]">
        {value}
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'up' | 'warn' | 'brand';
}) {
  const cls =
    tone === 'up'
      ? 'border-[rgba(47,125,82,0.25)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'brand'
          ? 'border-[color:var(--brand-strong)]/30 bg-[color:var(--brand-soft)]/50 text-[color:var(--brand-strong)]'
          : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
