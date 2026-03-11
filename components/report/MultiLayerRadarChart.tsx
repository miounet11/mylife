import React, { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

/**
 * v1.4.0 Multi-Layer Radar Chart Types
 */
export interface RadarDimension {
  key: string;
  label: string;
  score: number;
  maxScore?: number;
  description?: string;
}

export interface RadarLayer {
  id: string;
  name: string;
  color: string;
  dimensions: RadarDimension[];
  visible?: boolean;
}

export interface MultiLayerRadarChartProps {
  layers: RadarLayer[];
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  showLayerToggle?: boolean;
  animated?: boolean;
}

// Pre-defined layer configurations for v1.4.0
export const V140_LAYER_CONFIGS = {
  elemental: {
    name: '五行能量',
    color: '#10b981',
    dimensions: [
      { key: 'wood', label: '木' },
      { key: 'fire', label: '火' },
      { key: 'earth', label: '土' },
      { key: 'metal', label: '金' },
      { key: 'water', label: '水' },
    ],
  },
  tenGod: {
    name: '十神功能',
    color: '#6366f1',
    dimensions: [
      { key: 'biJie', label: '比劫' },
      { key: 'shiShang', label: '食伤' },
      { key: 'caiXing', label: '财星' },
      { key: 'guanSha', label: '官杀' },
      { key: 'yinXing', label: '印星' },
    ],
  },
  comprehensive: {
    name: '综合运势',
    color: '#f59e0b',
    dimensions: [
      { key: 'career', label: '事业' },
      { key: 'wealth', label: '财运' },
      { key: 'marriage', label: '婚姻' },
      { key: 'health', label: '健康' },
      { key: 'wisdom', label: '智慧' },
    ],
  },
};

// Size configuration
const SIZE_CONFIG = {
  sm: { height: 280, fontSize: 11, outerRadius: 80 },
  md: { height: 380, fontSize: 13, outerRadius: 110 },
  lg: { height: 480, fontSize: 15, outerRadius: 140 },
};

/**
 * Custom Tooltip Component
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload?: any }>;
  label?: string;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
        {payload[0]?.payload?.subject}
      </p>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
          </div>
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.value?.toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Layer Toggle Button
 */
const LayerToggle: React.FC<{
  layer: RadarLayer;
  isActive: boolean;
  onToggle: () => void;
}> = ({ layer, isActive, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isActive
          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: layer.color, opacity: isActive ? 1 : 0.4 }}
      />
      {layer.name}
    </button>
  );
};

/**
 * MultiLayerRadarChart Component
 * v1.4.0 Enhanced radar chart with multiple overlapping layers
 */
export const MultiLayerRadarChart: React.FC<MultiLayerRadarChartProps> = ({
  layers,
  title = '多维状态雷达图',
  className = '',
  size = 'md',
  showLegend = true,
  showLayerToggle = true,
  animated = true,
}) => {
  // Track visible layers
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(layers.map((l) => l.id))
  );

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Build unified chart data from all layers
  const chartData = useMemo(() => {
    if (!layers || layers.length === 0) return [];

    // Get all unique dimension keys from all layers
    const allDimensions = new Map<string, string>();
    layers.forEach((layer) => {
      layer.dimensions.forEach((dim) => {
        if (!allDimensions.has(dim.key)) {
          allDimensions.set(dim.key, dim.label);
        }
      });
    });

    // Build data points
    return Array.from(allDimensions.entries()).map(([key, label]) => {
      const point: Record<string, number | string> = {
        subject: label,
        key,
        fullMark: 100,
      };

      // Add each layer's score for this dimension
      layers.forEach((layer) => {
        const dim = layer.dimensions.find((d) => d.key === key);
        point[layer.id] = dim?.score ?? 0;
      });

      return point;
    });
  }, [layers]);

  const sizeConfig = SIZE_CONFIG[size];

  // Generate gradient definitions for each layer
  const gradientDefs = useMemo(() => {
    return layers.map((layer) => (
      <linearGradient
        key={`gradient-${layer.id}`}
        id={`gradient-${layer.id}`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="5%" stopColor={layer.color} stopOpacity={0.6} />
        <stop offset="95%" stopColor={layer.color} stopOpacity={0.1} />
      </linearGradient>
    ));
  }, [layers]);

  if (!layers || layers.length === 0) {
    return (
      <div className={`p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
          雷达图数据加载中...
        </p>
      </div>
    );
  }

  // Custom legend renderer
  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <div className="flex justify-center items-center flex-wrap gap-4 mt-4">
        {layers
          .filter((layer) => visibleLayers.has(layer.id))
          .map((layer) => (
            <div key={layer.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {layer.name}
              </span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">🎯</span>
          {title}
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">v1.4.0</span>
        </h3>
      </div>

      <div className="p-4">
        {/* Layer Toggle Controls */}
        {showLayerToggle && layers.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {layers.map((layer) => (
              <LayerToggle
                key={layer.id}
                layer={layer}
                isActive={visibleLayers.has(layer.id)}
                onToggle={() => toggleLayer(layer.id)}
              />
            ))}
          </div>
        )}

        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={sizeConfig.height}>
          <RechartsRadarChart
            data={chartData}
            outerRadius={sizeConfig.outerRadius}
          >
            <defs>{gradientDefs}</defs>

            {/* Polar Grid */}
            <PolarGrid
              stroke="#e5e7eb"
              strokeDasharray="3 3"
              className="dark:stroke-gray-600"
            />

            {/* Angle Axis (Dimension Labels) */}
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: '#6b7280',
                fontSize: sizeConfig.fontSize,
                fontWeight: 500,
              }}
              className="dark:fill-gray-400"
            />

            {/* Radius Axis (Score Scale) */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: '#9ca3af',
                fontSize: sizeConfig.fontSize - 2,
              }}
              tickCount={5}
              className="dark:fill-gray-500"
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Radar Areas for Each Layer */}
            {layers.map((layer) => (
              <Radar
                key={layer.id}
                name={layer.name}
                dataKey={layer.id}
                stroke={layer.color}
                fill={`url(#gradient-${layer.id})`}
                fillOpacity={visibleLayers.has(layer.id) ? 0.5 : 0}
                strokeOpacity={visibleLayers.has(layer.id) ? 1 : 0}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: layer.color,
                  strokeWidth: 0,
                  opacity: visibleLayers.has(layer.id) ? 1 : 0,
                }}
                activeDot={{
                  r: 6,
                  fill: layer.color,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                isAnimationActive={animated}
              />
            ))}

            {/* Legend */}
            {showLegend && <Legend content={renderLegend} />}
          </RechartsRadarChart>
        </ResponsiveContainer>

        {/* Footer Description */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />
              <span>多维状态向量分析 · v1.4.0</span>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper function to create layers from v1.4.0 state vector data
 */
export const createLayersFromStateVector = (stateVector: {
  elemental?: Record<string, number>;
  tenGod?: {
    dominant_role?: string;
    structure_efficiency?: number;
    conflict_index?: number;
  };
  comprehensive?: {
    score?: number;
    strengths?: string[];
    weaknesses?: string[];
  };
  structure?: {
    body_strength?: { score?: number };
    useful_elements?: {
      yongShen?: string[];
      xiShen?: string[];
      jiShen?: string[];
      qiuShen?: string[];
    };
  };
}): RadarLayer[] => {
  const layers: RadarLayer[] = [];

  // Elemental layer (五行)
  if (stateVector.elemental) {
    const el = stateVector.elemental;
    layers.push({
      id: 'elemental',
      name: '五行能量',
      color: '#10b981',
      dimensions: [
        { key: 'wood', label: '木', score: el.wood || 0 },
        { key: 'fire', label: '火', score: el.fire || 0 },
        { key: 'earth', label: '土', score: el.earth || 0 },
        { key: 'metal', label: '金', score: el.metal || 0 },
        { key: 'water', label: '水', score: el.water || 0 },
      ],
    });
  }

  // Structure layer (格局)
  if (stateVector.structure) {
    const st = stateVector.structure;
    const bodyStrength = st.body_strength?.score || 50;
    const yongShenCount = st.useful_elements?.yongShen?.length || 0;
    const jiShenCount = st.useful_elements?.jiShen?.length || 0;

    layers.push({
      id: 'structure',
      name: '格局结构',
      color: '#8b5cf6',
      dimensions: [
        { key: 'bodyStrength', label: '日主强度', score: bodyStrength },
        { key: 'yongShen', label: '用神力', score: Math.min(100, yongShenCount * 30 + 40) },
        { key: 'xiShen', label: '喜神力', score: Math.min(100, (st.useful_elements?.xiShen?.length || 0) * 25 + 35) },
        { key: 'jiShen', label: '忌神压', score: Math.max(0, 100 - jiShenCount * 25) },
        { key: 'qiuShen', label: '仇神压', score: Math.max(0, 100 - (st.useful_elements?.qiuShen?.length || 0) * 20) },
      ],
    });
  }

  // Comprehensive layer
  if (stateVector.comprehensive) {
    const comp = stateVector.comprehensive;
    const baseScore = comp.score || 60;
    const strengthBonus = (comp.strengths?.length || 0) * 5;
    const weaknessPenalty = (comp.weaknesses?.length || 0) * 5;

    layers.push({
      id: 'comprehensive',
      name: '综合能力',
      color: '#f59e0b',
      dimensions: [
        { key: 'overall', label: '综合', score: baseScore },
        { key: 'potential', label: '潜力', score: Math.min(100, baseScore + strengthBonus) },
        { key: 'stability', label: '稳定', score: Math.max(0, baseScore - weaknessPenalty) },
        { key: 'growth', label: '成长', score: Math.min(100, baseScore + Math.random() * 15 - 5) },
        { key: 'fortune', label: '运势', score: Math.min(100, baseScore + Math.random() * 20 - 10) },
      ],
    });
  }

  return layers;
};

export default MultiLayerRadarChart;
