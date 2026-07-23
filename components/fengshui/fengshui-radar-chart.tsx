'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface FengshuiRadarDataPoint {
  dimension: string;
  score: number;
  fullMark: number;
}

interface FengshuiRadarChartProps {
  data: FengshuiRadarDataPoint[];
  color?: string;
}

export function FengshuiRadarChart({ data, color = 'var(--brand)' }: FengshuiRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="var(--hairline)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: 'var(--ink-2)', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: 'var(--ink-3)', fontSize: 10 }}
        />
        <Radar
          name="匹配度"
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}