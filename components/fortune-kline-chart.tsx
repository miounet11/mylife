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

const defaultData: FortuneData[] = [
  { year: 2019, career: 60, wealth: 50, marriage: 70, health: 80 },
  { year: 2020, career: 65, wealth: 55, marriage: 72, health: 78 },
  { year: 2021, career: 70, wealth: 60, marriage: 75, health: 75 },
  { year: 2022, career: 75, wealth: 65, marriage: 73, health: 77 },
  { year: 2023, career: 80, wealth: 70, marriage: 71, health: 76 },
  { year: 2024, career: 85, wealth: 75, marriage: 70, health: 74 },
  { year: 2025, career: 88, wealth: 78, marriage: 68, health: 72 },
  { year: 2026, career: 90, wealth: 80, marriage: 65, health: 70 },
];

const series = [
  { key: 'career', label: '事业', color: '#0f766e' },
  { key: 'wealth', label: '财富', color: '#0284c7' },
  { key: 'marriage', label: '关系', color: '#e11d48' },
  { key: 'health', label: '健康', color: '#d97706' },
] as const;

export default function FortuneKLineChart({ data, showLegend = true, height = 380 }: KLineChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;
  const latest = chartData[chartData.length - 1];

  return (
    <div className="soft-card w-full rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="section-label">阶段趋势</div>
          <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">人生运势曲线</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            把一次性分析转成可回看的趋势图，帮助用户理解不同年份在事业、财富、关系和健康上的节奏变化。
          </p>
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

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
          上升更明显的曲线，通常意味着这条维度更适合主动推进；波动或下行更明显的曲线，则更适合控制节奏与降低暴露。
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
          最好的使用方式不是“看一眼”，而是把趋势图和报告结论、事件记录、后续咨询放在一起交叉验证。
        </div>
      </div>
    </div>
  );
}
