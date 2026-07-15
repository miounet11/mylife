'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  /** 兼容旧 props，忽略 */
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const points = useMemo(
    () => normalizePoints(props.data || [], props.xIsMonth),
    [props.data, props.xIsMonth]
  );
  const [visible, setVisible] = useState<Record<DimKey, boolean>>({
    overall: true,
    career: true,
    wealth: false,
    marriage: false,
    health: true,
  });

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

  const toggle = (key: DimKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // 至少保留一条线
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

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
              `${firstYear}–${lastYear} 共 ${points.length} ${isMonth ? '月' : '年'} · 综合 / 事业 / 财富 / 关系 / 健康`}
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

      <div className="mt-3 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: isMonth ? 10 : 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
              minTickGap={isMonth ? 36 : 28}
              interval={isMonth ? 'preserveStartEnd' : 0}
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
                strokeDasharray="4 3"
                label={{
                  value: '今年',
                  position: 'insideTopRight',
                  fill: '#3b5998',
                  fontSize: 11,
                }}
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
                  strokeWidth={key === 'overall' ? 2.5 : 1.6}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 高低点解读，补全“简图”之外的可读信息 */}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-[8px] border border-[rgba(47,125,82,0.22)] bg-[rgba(47,125,82,0.05)] px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">高点窗口（宜推进）</div>
          {anchors.peaks.length ? (
            <ul className="mt-1.5 space-y-1">
              {anchors.peaks.map((p) => (
                <li key={`p-${p.year}`} className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]">
                  <span className="font-semibold text-[color:var(--ink-1)]">{p.year}</span>
                  <span className="mx-1 text-[color:var(--ink-4)]">·</span>
                  综合 {Math.round(p.overall)}
                  {p.drivers?.length ? (
                    <span className="text-[color:var(--ink-4)]"> · {p.drivers[0]}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">样本内未形成明显峰值，宜稳态推进。</p>
          )}
        </div>
        <div className="rounded-[8px] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/40 px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">压力低点（宜防守）</div>
          {anchors.troughs.length ? (
            <ul className="mt-1.5 space-y-1">
              {anchors.troughs.map((p) => (
                <li key={`t-${p.year}`} className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]">
                  <span className="font-semibold text-[color:var(--ink-1)]">{p.year}</span>
                  <span className="mx-1 text-[color:var(--ink-4)]">·</span>
                  综合 {Math.round(p.overall)}
                  {p.risks?.length ? (
                    <span className="text-[color:var(--ink-4)]"> · {p.risks[0]}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">样本内未形成明显低谷，仍需按板块控风险。</p>
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">
        读法：综合线看总节奏；健康/关系/事业/财富可单独点亮。虚线为当前年。分数为引擎趋势刻度，不是吉凶判决。
      </p>
    </section>
  );
}
