'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { KlineDayunBand } from '@/lib/kline-dayun-bands';
import { qualityLabelZh } from '@/lib/kline-dayun-bands';

export type FortuneKlinePoint = {
  /** 年：number；月视图可为 "2024-03" 字符串 */
  year: number | string;
  career?: number;
  wealth?: number;
  marriage?: number;
  health?: number;
  score?: number;
  evidence?: {
    drivers?: string[];
    risks?: string[];
    ganZhi?: string;
    dayunGanZhi?: string | null;
  };
  _isMonth?: boolean;
};

type DimKey = 'overall' | 'career' | 'wealth' | 'marriage' | 'health';

const DIM_META: Record<
  DimKey,
  { label: string; color: string; dataKey: string }
> = {
  overall: { label: '综合', color: '#3b5998', dataKey: 'overall' },
  career: { label: '事业', color: '#2563eb', dataKey: 'career' },
  wealth: { label: '财富', color: '#d97706', dataKey: 'wealth' },
  marriage: { label: '关系', color: '#db2777', dataKey: 'marriage' },
  health: { label: '健康', color: '#059669', dataKey: 'health' },
};

function avg(values: number[]) {
  const valid = values.filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
}

function normalizePoints(raw: FortuneKlinePoint[], xIsMonth = false) {
  return (raw || [])
    .filter((p) => p?.year != null && `${p.year}`.length > 0)
    .map((p) => {
      const career = Number(p.career) || 0;
      const wealth = Number(p.wealth) || 0;
      const marriage = Number(p.marriage) || 0;
      const health = Number(p.health) || 0;
      const overall =
        Number(p.score) > 0
          ? Number(p.score)
          : Math.round(avg([career, wealth, marriage, health]) * 10) / 10;
      const yearKey = p.year;
      const yearNum =
        typeof yearKey === 'number'
          ? yearKey
          : Number(String(yearKey).slice(0, 4)) || 0;
      return {
        year: yearKey,
        yearNum,
        career,
        wealth,
        marriage,
        health,
        overall,
        ganZhi: p.evidence?.ganZhi || '',
        drivers: (p.evidence?.drivers || []).slice(0, 2),
        risks: (p.evidence?.risks || []).slice(0, 2),
        isMonth: xIsMonth || p._isMonth || typeof yearKey === 'string',
      };
    })
    .sort((a, b) => {
      if (a.isMonth || b.isMonth) return String(a.year).localeCompare(String(b.year));
      return a.yearNum - b.yearNum;
    });
}

function findAnchors(points: ReturnType<typeof normalizePoints>) {
  if (points.length < 3) return { peaks: [], troughs: [] as typeof points };
  const peaks: typeof points = [];
  const troughs: typeof points = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!.overall;
    const curr = points[i]!.overall;
    const next = points[i + 1]!.overall;
    if (curr >= prev && curr >= next && curr >= 55) peaks.push(points[i]!);
    if (curr <= prev && curr <= next && curr <= 55) troughs.push(points[i]!);
  }
  peaks.sort((a, b) => b.overall - a.overall);
  troughs.sort((a, b) => a.overall - b.overall);
  return {
    peaks: peaks.slice(0, 3),
    troughs: troughs.slice(0, 2),
  };
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const isMonth = row.isMonth || (typeof label === 'string' && label.includes('-'));
  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 text-[12px] shadow-lg">
      <div className="font-bold text-[color:var(--ink-1)]">
        {isMonth ? label : `${label} 年`}
        {row.ganZhi ? ` · ${row.ganZhi}` : ''}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[color:var(--ink-2)]">
        <span>综合 {Number(row.overall || 0).toFixed(0)}</span>
        <span>事业 {Number(row.career || 0).toFixed(0)}</span>
        <span>财富 {Number(row.wealth || 0).toFixed(0)}</span>
        <span>关系 {Number(row.marriage || 0).toFixed(0)}</span>
        <span>健康 {Number(row.health || 0).toFixed(0)}</span>
      </div>
      {row.drivers?.length ? (
        <div className="mt-1.5 text-[11px] text-[color:var(--data-up)]">
          驱动：{row.drivers.join('、')}
        </div>
      ) : null}
      {row.risks?.length ? (
        <div className="mt-0.5 text-[11px] text-[color:var(--alert)]">
          风险：{row.risks.join('、')}
        </div>
      ) : null}
    </div>
  );
}

export default function FortuneKLineChart(props: {
  data?: FortuneKlinePoint[] | null;
  height?: number;
  title?: string;
  subtitle?: string;
  /** 月粒度：X 轴为 YYYY-MM */
  xIsMonth?: boolean;
  /** 出生公历年 → 「你在这里 · N 岁」 */
  birthYear?: number;
  /** 默认可见维度（焦点模式建议只开 overall） */
  defaultDims?: Partial<Record<DimKey, boolean>>;
  /** 强化「你在这里」标注 */
  emphasizeYouAreHere?: boolean;
  /** 大运色带（年视图） */
  dayunBands?: KlineDayunBand[] | null;
  /** 兼容旧 props，忽略 */
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const points = useMemo(
    () => normalizePoints(props.data || [], props.xIsMonth),
    [props.data, props.xIsMonth]
  );
  const [visible, setVisible] = useState<Record<DimKey, boolean>>(() => ({
    overall: props.defaultDims?.overall ?? true,
    career: props.defaultDims?.career ?? false,
    wealth: props.defaultDims?.wealth ?? false,
    marriage: props.defaultDims?.marriage ?? false,
    health: props.defaultDims?.health ?? false,
  }));
  const [selected, setSelected] = useState<ReturnType<typeof normalizePoints>[number] | null>(
    null,
  );

  if (!points.length) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-6 text-center text-[13px] text-[color:var(--ink-4)]">
        暂无趋势样本，无法绘制人生 K 线。可先结合结构判断与时间地图阅读。
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const isMonth = props.xIsMonth || points[0]?.isMonth;
  const anchors = findAnchors(
    points.map((p) => ({ ...p, year: p.yearNum || Number(String(p.year).slice(0, 4)) })) as any
  );
  const firstYear = points[0]!.year;
  const lastYear = points[points.length - 1]!.year;
  const current =
    (isMonth
      ? points.find((p) => String(p.year) === currentMonthKey)
      : points.find((p) => p.yearNum === currentYear)) || points[points.length - 1]!;
  const next3 = isMonth
    ? points.slice(Math.max(0, points.length - 6))
    : points.filter((p) => p.yearNum >= currentYear && p.yearNum <= currentYear + 2);
  const nextAvg = next3.length
    ? Math.round(avg(next3.map((p) => p.overall)))
    : Math.round(current.overall);
  const height = props.height || 300;
  const birthYear =
    props.birthYear && props.birthYear > 1900 && props.birthYear < currentYear
      ? props.birthYear
      : null;
  const ageNow = birthYear != null ? currentYear - birthYear : null;
  const hereLabel =
    props.emphasizeYouAreHere && ageNow != null
      ? `你在这里 · ${ageNow}岁`
      : props.emphasizeYouAreHere
        ? '你在这里'
        : '今年';

  const toggle = (key: DimKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // 至少保留一条线
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const bands = !isMonth && Array.isArray(props.dayunBands) ? props.dayunBands : [];
  const yearNums = points.map((p) => p.yearNum).filter((y) => y > 0);
  const chartMin = yearNums.length ? Math.min(...yearNums) : 0;
  const chartMax = yearNums.length ? Math.max(...yearNums) : 0;

  const selectedBand =
    selected && !isMonth
      ? bands.find(
          (b) =>
            selected.yearNum >= b.startYear && selected.yearNum <= b.endYear,
        ) || null
      : null;

  return (
    <section className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">
            运势曲线
          </div>
          <h3 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
            {props.title || '人生 K 线概览'}
          </h3>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            {props.subtitle ||
              `${firstYear}–${lastYear} 共 ${points.length} ${isMonth ? '月' : '年'} · 点亮维度查看分线`}
            {!isMonth ? ' · 点击曲线选年看原因' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(DIM_META) as DimKey[]).map((key) => {
            const meta = DIM_META[key];
            const on = visible[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition"
                style={{
                  borderColor: on ? meta.color : 'var(--hairline)',
                  color: on ? meta.color : 'var(--ink-4)',
                  background: on ? `${meta.color}14` : 'transparent',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color, opacity: on ? 1 : 0.35 }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 当前读数 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2.5 py-2">
          <div className="text-[10px] font-bold text-[color:var(--ink-4)]">
            {isMonth ? '当前月' : '当前年'}
          </div>
          <div className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)]">
            {current.year}
            <span className="ml-1 text-[12px] font-semibold text-[color:var(--brand-strong)]">
              综合 {Math.round(current.overall)}
            </span>
          </div>
        </div>
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2.5 py-2">
          <div className="text-[10px] font-bold text-[color:var(--ink-4)]">
            {isMonth ? '近段均值' : '近 3 年均值'}
          </div>
          <div className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)]">{nextAvg}</div>
        </div>
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2.5 py-2">
          <div className="text-[10px] font-bold text-[color:var(--ink-4)]">样本跨度</div>
          <div className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)]">
            {points.length} {isMonth ? '月' : '年'}
          </div>
        </div>
        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2.5 py-2">
          <div className="text-[10px] font-bold text-[color:var(--ink-4)]">当前四维</div>
          <div className="mt-0.5 text-[11px] font-semibold leading-snug text-[color:var(--ink-2)]">
            业{Math.round(current.career)} · 财{Math.round(current.wealth)} · 关
            {Math.round(current.marriage)} · 健{Math.round(current.health)}
          </div>
        </div>
      </div>

      {bands.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[color:var(--ink-5)]">
          <span className="font-semibold text-[color:var(--ink-4)]">大运底色</span>
          {bands.slice(0, 6).map((b) => (
            <span key={`${b.ganZhi}-${b.startYear}`} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[2px] border border-[color:var(--hairline)]"
                style={{ background: b.fill }}
              />
              {b.ganZhi}
              {b.isCurrent ? ' · 当前' : ''}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 w-full min-w-0" style={{ height: Math.max(height, 200), minHeight: 200 }}>
        {/* minWidth/minHeight avoid Recharts "width(-1) height(-1)" when parent is still 0 during layout */}
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            onClick={(state: any) => {
              const payload = state?.activePayload?.[0]?.payload;
              if (payload) setSelected(payload);
            }}
            style={{ cursor: isMonth ? 'default' : 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
            {/* 大运色带：分段人生节奏 */}
            {bands.map((b) => {
              // Snap band edges to nearest points present in chart data
              const x1 = yearNums.find((y) => y >= b.startYear) ?? b.startYear;
              const x2Candidates = yearNums.filter((y) => y <= b.endYear);
              const x2 = x2Candidates.length
                ? x2Candidates[x2Candidates.length - 1]!
                : b.endYear;
              if (x2 < x1 || x1 < chartMin || x2 > chartMax) return null;
              return (
                <ReferenceArea
                  key={`band-${b.ganZhi}-${b.startYear}`}
                  x1={x1}
                  x2={x2}
                  fill={b.fill}
                  strokeOpacity={0}
                  ifOverflow="hidden"
                />
              );
            })}
            <XAxis
              dataKey="year"
              tick={{ fontSize: isMonth ? 10 : 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
              minTickGap={isMonth ? 36 : 28}
              interval={isMonth ? 'preserveStartEnd' : 'preserveStartEnd'}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(value) => DIM_META[value as DimKey]?.label || value}
            />
            {(isMonth
              ? points.some((p) => String(p.year) === currentMonthKey)
              : points.some((p) => p.yearNum === currentYear)) ? (
              <ReferenceLine
                x={isMonth ? currentMonthKey : currentYear}
                stroke="#3b5998"
                strokeWidth={props.emphasizeYouAreHere ? 2 : 1}
                strokeDasharray={props.emphasizeYouAreHere ? '0' : '4 3'}
                label={{
                  value: hereLabel,
                  position: 'insideTopRight',
                  fill: '#3b5998',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            ) : null}
            {selected && !isMonth ? (
              <ReferenceLine
                x={selected.year}
                stroke="#0f172a"
                strokeDasharray="3 3"
                strokeOpacity={0.35}
              />
            ) : null}
            {(Object.keys(DIM_META) as DimKey[]).map((key) =>
              visible[key] ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={DIM_META[key].dataKey}
                  name={key}
                  stroke={DIM_META[key].color}
                  strokeWidth={key === 'overall' ? 2.8 : 1.6}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 点选年份抽屉：原因 / 大运 / 四维 */}
      {selected ? (
        <div className="mt-3 rounded-[10px] border border-[color:var(--ink-1)]/15 bg-[color:var(--bg-sunken)]/60 px-3 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
                选中{isMonth ? '月' : '年'}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)]">
                {selected.year}
                {birthYear != null && selected.yearNum > 0 ? (
                  <span className="ml-1.5 text-[12px] font-semibold text-[color:var(--ink-4)]">
                    {selected.yearNum - birthYear} 岁
                  </span>
                ) : null}
                <span className="ml-2 text-[13px] font-semibold text-[color:var(--brand-strong)]">
                  综合 {Math.round(selected.overall)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[12px] text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]"
            >
              关闭
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <div>事业 {Math.round(selected.career)}</div>
            <div>财富 {Math.round(selected.wealth)}</div>
            <div>关系 {Math.round(selected.marriage)}</div>
            <div>健康 {Math.round(selected.health)}</div>
          </div>
          <div className="mt-2 space-y-1 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
            {selected.ganZhi ? (
              <p>
                <span className="font-semibold text-[color:var(--ink-2)]">干支</span>
                {' · '}
                {selected.ganZhi}
                {selectedBand ? (
                  <span>
                    {' '}
                    · 大运 {selectedBand.ganZhi}
                    {selectedBand.quality
                      ? `（${qualityLabelZh(selectedBand.quality)}）`
                      : ''}
                  </span>
                ) : null}
              </p>
            ) : null}
            {selected.drivers?.length ? (
              <p>
                <span className="font-semibold text-[color:var(--data-up)]">驱动</span>
                {' · '}
                {selected.drivers.join('、')}
              </p>
            ) : null}
            {selected.risks?.length ? (
              <p>
                <span className="font-semibold text-[color:var(--signal-strong)]">风险</span>
                {' · '}
                {selected.risks.join('、')}
              </p>
            ) : null}
            {selectedBand?.description ? (
              <p className="text-[color:var(--ink-4)]">{selectedBand.description}</p>
            ) : null}
            {!selected.drivers?.length && !selected.risks?.length ? (
              <p className="text-[color:var(--ink-5)]">
                该点证据较少；可结合大运色带与综合线判断阶段，勿单点定论。
              </p>
            ) : null}
          </div>
        </div>
      ) : !isMonth ? (
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          提示：点击曲线上的年份，查看干支、大运与驱动/风险。
        </p>
      ) : null}

      {/* 高低点解读，补全“简图”之外的可读信息 */}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-[8px] border border-[rgba(47,125,82,0.22)] bg-[rgba(47,125,82,0.05)] px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">高点窗口（宜推进）</div>
          {anchors.peaks.length ? (
            <ul className="mt-1.5 space-y-1">
              {anchors.peaks.map((p) => {
                const age =
                  birthYear != null && Number.isFinite(p.yearNum)
                    ? p.yearNum - birthYear
                    : null;
                return (
                  <li key={`p-${p.year}`} className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]">
                    <span className="font-semibold text-[color:var(--ink-1)]">{p.year}</span>
                    {age != null ? (
                      <span className="text-[color:var(--ink-4)]"> · {age} 岁</span>
                    ) : null}
                    <span className="mx-1 text-[color:var(--ink-4)]">·</span>
                    综合 {Math.round(p.overall)}
                    {p.drivers?.length ? (
                      <span className="text-[color:var(--ink-4)]"> · {p.drivers[0]}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">样本内未形成明显峰值，宜稳态推进。</p>
          )}
        </div>
        <div className="rounded-[8px] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/40 px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">压力低点（宜防守）</div>
          {anchors.troughs.length ? (
            <ul className="mt-1.5 space-y-1">
              {anchors.troughs.map((p) => {
                const age =
                  birthYear != null && Number.isFinite(p.yearNum)
                    ? p.yearNum - birthYear
                    : null;
                return (
                  <li key={`t-${p.year}`} className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]">
                    <span className="font-semibold text-[color:var(--ink-1)]">{p.year}</span>
                    {age != null ? (
                      <span className="text-[color:var(--ink-4)]"> · {age} 岁</span>
                    ) : null}
                    <span className="mx-1 text-[color:var(--ink-4)]">·</span>
                    综合 {Math.round(p.overall)}
                    {p.risks?.length ? (
                      <span className="text-[color:var(--ink-4)]"> · {p.risks[0]}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">样本内未形成明显低谷，仍需按板块控风险。</p>
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">
        读法：先看综合线与「{hereLabel}」；点亮事业/财/关系/健康看分线。分数是趋势刻度，不是吉凶判决。
      </p>
    </section>
  );
}
