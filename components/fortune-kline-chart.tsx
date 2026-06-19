'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface FortuneData {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
}

interface KLineChartProps {
  data?: FortuneData[];
  showLegend?: boolean;
  height?: number;
}

// 决策台四色：事业=brand / 财富=env / 关系=alert / 健康=signal
const series = [
  { key: 'career', label: '事业', color: '#0b5f55' },
  { key: 'wealth', label: '财富', color: '#315f84' },
  { key: 'marriage', label: '关系', color: '#bd4c42' },
  { key: 'health', label: '健康', color: '#a87f2c' },
] as const;

export default function FortuneKLineChart({ data, showLegend = true, height = 380 }: KLineChartProps) {
  const chartData = data && data.length > 0 ? data : [];
  const latest = chartData[chartData.length - 1];

  if (chartData.length === 0) {
    return (
      <div className="w-full rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          阶段趋势
        </div>
        <h3 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
          人生运势曲线
        </h3>
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-6 text-sm text-[color:var(--ink-4)]">
          暂无趋势图数据
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            阶段趋势
          </div>
          <h3 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            人生运势曲线
          </h3>
        </div>

        {latest && (
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
            {series.map((item) => (
              <div
                key={item.key}
                className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </div>
                <div className="mt-1 font-mono text-base font-black tabular-nums text-[color:var(--ink-1)]">
                  {latest[item.key]}
                  <span className="ml-0.5 font-mono text-xs font-semibold text-[color:var(--ink-5)]">/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 33, 29, 0.08)" />
            <XAxis dataKey="year" stroke="#8b9690" fontSize={11} tickFormatter={(value) => `${value}`} />
            <YAxis stroke="#8b9690" fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid rgba(22, 33, 29, 0.16)',
                boxShadow: '0 4px 16px rgba(22, 33, 29, 0.08)',
                fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#16211d', fontWeight: 700 }}
            />
            {showLegend && <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />}
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2.2}
                dot={{ fill: item.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
