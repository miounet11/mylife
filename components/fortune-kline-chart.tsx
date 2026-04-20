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

const series = [
  { key: 'career', label: '事业', color: '#b2955d' },
  { key: 'wealth', label: '财富', color: '#0284c7' },
  { key: 'marriage', label: '关系', color: '#e11d48' },
  { key: 'health', label: '健康', color: '#d97706' },
] as const;

export default function FortuneKLineChart({ data, showLegend = true, height = 380 }: KLineChartProps) {
  const chartData = data && data.length > 0 ? data : [];
  const latest = chartData[chartData.length - 1];

  if (chartData.length === 0) {
    return (
      <div className="soft-card w-full rounded-[2rem] p-6 md:p-8">
        <div className="section-label">阶段趋势</div>
        <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">人生运势曲线</h3>
        <div className="mt-6 rounded-[1.5rem] bg-slate-50 px-5 py-8 text-sm text-[color:var(--ink)]">
          暂无趋势图数据
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card w-full rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="section-label">阶段趋势</div>
          <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">人生运势曲线</h3>
        </div>

        {latest && (
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
            {series.map((item) => (
              <div key={item.key} className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-1 text-lg font-bold text-[color:var(--ink)]">
                  {latest[item.key]}
                  <span className="ml-1 text-sm font-medium text-[color:var(--muted)]">/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 h-[380px]">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
            <XAxis dataKey="year" stroke="#60708c" fontSize={12} tickFormatter={(value) => `${value}`} />
            <YAxis stroke="#60708c" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fffdf9',
                borderRadius: '18px',
                border: '1px solid rgba(96, 112, 140, 0.16)',
                boxShadow: '0 18px 40px rgba(23, 32, 51, 0.08)',
              }}
            />
            {showLegend && <Legend verticalAlign="top" height={36} iconType="circle" />}
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={3}
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
