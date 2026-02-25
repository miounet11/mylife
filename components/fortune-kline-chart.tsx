// 命理K线图组件
'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

export default function FortuneKLineChart({ data, showLegend = true, height = 400 }: KLineChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full bg-white rounded-xl p-6 border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          命理K线图（人生运势走势）
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(value) => `${value}年`}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '12px',
            }}
            labelStyle={{ color: '#334155', fontSize: '12px' }}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
            />
          )}
          <Line
            type="monotone"
            dataKey="career"
            name="事业"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ fill: '#4f46e5', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="wealth"
            name="财富"
            stroke="#0284c7"
            strokeWidth={2}
            dot={{ fill: '#0284c7', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="marriage"
            name="婚姻"
            stroke="#e11d48"
            strokeWidth={2}
            dot={{ fill: '#e11d48', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="health"
            name="健康"
            stroke="#059669"
            strokeWidth={2}
            dot={{ fill: '#059669', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 图表解读 */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">命理K线解读</h4>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-start">
            <span className="text-indigo-600 mr-2">•</span>
            <span><strong>事业线</strong>：呈稳步上升趋势，2019-2026年持续增长，从60分上升到90分，预示着事业发展前景良好。</span>
          </div>
          <div className="flex items-start">
            <span className="text-indigo-600 mr-2">•</span>
            <span><strong>财富线</strong>：2019-2026年稳步上升，从50分上升到80分，财运逐渐改善，但增速较为平缓。</span>
          </div>
          <div className="flex items-start">
            <span className="text-indigo-600 mr-2">•</span>
            <span><strong>婚姻线</strong>：整体呈下降趋势，从70分下降到65分，需要注意感情经营，宜多沟通。</span>
          </div>
          <div className="flex items-start">
            <span className="text-indigo-600 mr-2">•</span>
            <span><strong>健康线</strong>：波动较大，2022年达到最低点（75分），之后有所回升，需要持续关注身体健康。</span>
          </div>
        </div>
      </div>
    </div>
  );
}
