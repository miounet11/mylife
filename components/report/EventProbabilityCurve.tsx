import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

/**
 * v1.4.0 Event Probability Curve Types
 */
export interface EventProbabilityPoint {
  age: number;
  year: number;
  probability: number;
  upperBound?: number;
  lowerBound?: number;
  label?: string;
}

export interface EventProbabilitySeries {
  type: string;
  label: string;
  color: string;
  data: EventProbabilityPoint[];
}

export interface EventProbabilityCurveProps {
  series: EventProbabilitySeries[];
  currentAge?: number;
  currentYear?: number;
  title?: string;
  className?: string;
  height?: number;
  showConfidenceInterval?: boolean;
}

// Event type color mapping
const EVENT_COLORS: Record<string, string> = {
  marriage: '#ec4899',      // pink
  career_change: '#3b82f6', // blue
  windfall: '#f59e0b',      // amber
  health_issue: '#ef4444',  // red
  comprehensive: '#8b5cf6', // purple
};

// Event type labels
const EVENT_LABELS: Record<string, string> = {
  marriage: '婚姻机会',
  career_change: '事业变动',
  windfall: '偏财运',
  health_issue: '健康风险',
  comprehensive: '综合运势',
};

/**
 * Custom Tooltip Component
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[color:var(--paper)] p-3 rounded-[var(--radius)] border border-[color:var(--hairline)]">
      <p className="text-sm font-medium text-[color:var(--ink-3)] mb-2">
        {label}
      </p>
      {payload.map((entry, index) => {
        // Skip confidence interval entries
        if (entry.dataKey.includes('_upper') || entry.dataKey.includes('_lower')) {
          return null;
        }
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[color:var(--ink-4)]">{entry.name}:</span>
            <span className="font-medium text-[color:var(--ink-1)]">
              {(entry.value * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Generate sample data for demonstration
 */
export const generateSampleEventData = (
  eventType: string,
  birthYear: number,
  currentAge: number
): EventProbabilityPoint[] => {
  const points: EventProbabilityPoint[] = [];
  const currentYear = birthYear + currentAge;

  // Generate data from age 20 to 60
  for (let age = 20; age <= 60; age++) {
    const year = birthYear + age;
    let baseProbability = 0.3;

    // Create realistic probability curves based on event type
    switch (eventType) {
      case 'marriage':
        // Peak probability around 25-32
        baseProbability = 0.3 + 0.4 * Math.exp(-Math.pow((age - 28) / 8, 2));
        break;
      case 'career_change':
        // Higher in early career and mid-career crisis
        baseProbability = 0.25 + 0.2 * Math.exp(-Math.pow((age - 30) / 10, 2)) +
          0.15 * Math.exp(-Math.pow((age - 45) / 5, 2));
        break;
      case 'windfall':
        // Random peaks with base probability
        baseProbability = 0.1 + 0.15 * Math.sin(age / 3) * Math.sin(age / 7);
        break;
      case 'health_issue':
        // Increases with age
        baseProbability = 0.05 + 0.3 * (1 - Math.exp(-(age - 20) / 40));
        break;
    }

    // Add some variation
    const noise = (Math.sin(age * 17 + year * 7) + 1) / 20;
    baseProbability = Math.max(0.05, Math.min(0.95, baseProbability + noise));

    points.push({
      age,
      year,
      probability: baseProbability,
      upperBound: Math.min(0.95, baseProbability + 0.1),
      lowerBound: Math.max(0.05, baseProbability - 0.1),
      label: `${year}年 (${age}岁)`,
    });
  }

  return points;
};

/**
 * EventProbabilityCurve Component
 * Displays probability trends over time with confidence intervals
 */
export const EventProbabilityCurve: React.FC<EventProbabilityCurveProps> = ({
  series,
  currentAge,
  currentYear,
  title = '事件概率曲线',
  className = '',
  height = 300,
  showConfidenceInterval = true,
}) => {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!series || series.length === 0) return [];

    // Use the first series as base for x-axis
    const baseSeries = series[0];
    return baseSeries.data.map((point, index) => {
      const dataPoint: Record<string, number | string> = {
        age: point.age,
        year: point.year,
        label: point.label || `${point.year}年`,
      };

      // Add all series data
      series.forEach((s) => {
        const seriesPoint = s.data[index];
        if (seriesPoint) {
          dataPoint[s.type] = seriesPoint.probability;
          if (showConfidenceInterval && seriesPoint.upperBound && seriesPoint.lowerBound) {
            dataPoint[`${s.type}_upper`] = seriesPoint.upperBound;
            dataPoint[`${s.type}_lower`] = seriesPoint.lowerBound;
          }
        }
      });

      return dataPoint;
    });
  }, [series, showConfidenceInterval]);

  if (!series || series.length === 0) {
    return (
      <div className={`p-4 rounded-lg bg-[color:var(--bg-elevated)] ${className}`}>
        <p className="text-[color:var(--ink-5)] text-sm text-center">
          概率曲线数据加载中...
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-[color:var(--paper)] shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">📈</span>
          {title}
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">v1.4.0</span>
        </h3>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={`gradient-${s.type}`}
                  id={`gradient-${s.type}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={s.color || EVENT_COLORS[s.type] || '#8884d8'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={s.color || EVENT_COLORS[s.type] || '#8884d8'}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

            <XAxis
              dataKey="age"
              tickFormatter={(age) => `${age}岁`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />

            <YAxis
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              domain={[0, 1]}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              formatter={(value) => EVENT_LABELS[value] || value}
              iconType="circle"
            />

            {/* Current age reference line */}
            {currentAge && (
              <ReferenceLine
                x={currentAge}
                stroke="#6366f1"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: '当前',
                  position: 'top',
                  fill: '#6366f1',
                  fontSize: 12,
                }}
              />
            )}

            {/* Confidence interval areas (if enabled) */}
            {showConfidenceInterval &&
              series.map((s) => (
                <Area
                  key={`ci-${s.type}`}
                  type="monotone"
                  dataKey={`${s.type}_upper`}
                  stroke="none"
                  fill={s.color || EVENT_COLORS[s.type] || '#8884d8'}
                  fillOpacity={0.1}
                  name={`${s.label || EVENT_LABELS[s.type]} 上界`}
                  legendType="none"
                />
              ))}

            {/* Main probability lines */}
            {series.map((s) => (
              <Area
                key={s.type}
                type="monotone"
                dataKey={s.type}
                stroke={s.color || EVENT_COLORS[s.type] || '#8884d8'}
                strokeWidth={2}
                fill={`url(#gradient-${s.type})`}
                name={s.label || EVENT_LABELS[s.type]}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend explanation */}
        <div className="mt-4 pt-3 border-t border-[color:var(--hairline)]">
          <p className="text-xs text-[color:var(--ink-5)]">
            曲线显示各类事件发生的概率趋势。阴影区域表示置信区间，虚线标记当前年龄。概率基于多维状态向量和天时因子综合计算。
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventProbabilityCurve;
