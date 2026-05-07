import React from 'react';

/**
 * v1.4.0 State Vector Data Types
 */
export interface ElementalState {
  wood?: number;
  fire?: number;
  earth?: number;
  metal?: number;
  water?: number;
  balance_score?: number;
  climate?: {
    description?: string;
    severity?: number;
  };
}

export interface TenGodState {
  dominant_role?: string;
  structure_efficiency?: number;
  conflict_index?: number;
}

export interface StructureState {
  body_strength?: {
    score?: number;
    level_info?: { name?: string; description?: string };
  };
  pattern?: {
    info?: { name?: string; description?: string };
  };
  useful_elements?: {
    yongShen?: string[];
    xiShen?: string[];
    jiShen?: string[];
    qiuShen?: string[];
  };
}

export interface ComprehensiveState {
  score?: number;
  level?: { name?: string; description?: string };
  strengths?: string[];
  weaknesses?: string[];
}

export interface StateVectorData {
  comprehensive?: ComprehensiveState;
  elemental?: ElementalState;
  tenGod?: TenGodState;
  structure?: StructureState;
}

export interface StateVectorDashboardProps {
  stateVector: StateVectorData | null;
  title?: string;
  className?: string;
  compact?: boolean;
}

// 五行颜色配置
const WUXING_COLORS = {
  wood: { bg: 'bg-[color:var(--data-up)]', text: 'text-[color:var(--data-up)]', label: '木' },
  fire: { bg: 'bg-[color:var(--alert)]', text: 'text-[color:var(--alert)]', label: '火' },
  earth: { bg: 'bg-[color:var(--signal)]', text: 'text-[color:var(--signal-strong)]', label: '土' },
  metal: { bg: 'bg-[color:var(--ink-5)]', text: 'text-[color:var(--ink-4)]', label: '金' },
  water: { bg: 'bg-[color:var(--env)]', text: 'text-[color:var(--env)]', label: '水' },
};

/**
 * 五行能量条组件
 */
const ElementBar: React.FC<{
  element: keyof typeof WUXING_COLORS;
  value: number;
  maxValue?: number;
}> = ({ element, value, maxValue = 100 }) => {
  const config = WUXING_COLORS[element];
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className={`w-6 text-sm font-medium ${config.text}`}>
        {config.label}
      </span>
      <div className="flex-1 h-3 bg-[color:var(--bg-sunken)] rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bg} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 text-xs text-[color:var(--ink-5)] text-right">
        {value.toFixed(0)}%
      </span>
    </div>
  );
};

/**
 * 评分徽章组件
 */
const ScoreBadge: React.FC<{
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, label, size = 'md' }) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'from-green-400 to-emerald-500 text-white';
    if (s >= 60) return 'from-blue-400 to-indigo-500 text-white';
    if (s >= 40) return 'from-yellow-400 to-orange-500 text-white';
    return 'from-red-400 to-rose-500 text-white';
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getScoreColor(score)} flex items-center justify-center font-bold shadow-lg`}
      >
        {score.toFixed(0)}
      </div>
      {label && (
        <span className="text-xs text-[color:var(--ink-5)]">{label}</span>
      )}
    </div>
  );
};

/**
 * 用神/忌神标签组件
 */
const ElementTags: React.FC<{
  title: string;
  elements: string[];
  variant: 'positive' | 'negative';
}> = ({ title, elements, variant }) => {
  if (!elements || elements.length === 0) return null;

  const tagClass = variant === 'positive'
    ? 'bg-[rgba(47,125,82,0.12)] text-[color:var(--data-up)]'
    : 'bg-[rgba(189,76,66,0.16)] text-[color:var(--alert)]';

  return (
    <div>
      <span className="text-xs text-[color:var(--ink-5)] block mb-1">{title}</span>
      <div className="flex flex-wrap gap-1">
        {elements.map((el, i) => (
          <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${tagClass}`}>
            {el}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * StateVectorDashboard 组件
 * 展示 v1.4.0 多维状态向量数据
 */
export const StateVectorDashboard: React.FC<StateVectorDashboardProps> = ({
  stateVector,
  title = '多维状态总览',
  className = '',
  compact = false,
}) => {
  if (!stateVector) {
    return (
      <div className={`p-4 rounded-lg bg-[color:var(--bg-elevated)] ${className}`}>
        <p className="text-[color:var(--ink-5)] text-sm text-center">
          状态向量数据加载中...
        </p>
      </div>
    );
  }

  const { comprehensive, elemental, tenGod, structure } = stateVector;

  return (
    <div className={`rounded-xl bg-white[color:var(--bg-sunken)] shadow-lg overflow-hidden ${className}`}>
      {/* 标题栏 */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">⚛️</span>
          {title}
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">v1.4.0</span>
        </h3>
      </div>

      <div className={`p-4 ${compact ? 'space-y-3' : 'space-y-5'}`}>
        {/* 综合评分区域 */}
        {comprehensive && (
          <div className="flex items-center gap-4">
            <ScoreBadge
              score={comprehensive.score || 0}
              label="综合命状"
              size={compact ? 'sm' : 'md'}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[color:var(--ink-1)][color:var(--bg-elevated)]">
                  {comprehensive.level?.name || '未知等级'}
                </span>
              </div>
              <p className="text-xs text-[color:var(--ink-5)] line-clamp-2">
                {comprehensive.level?.description || ''}
              </p>
            </div>
          </div>
        )}

        {/* 五行能量层 */}
        {elemental && !compact && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[color:var(--ink-3)][color:var(--ink-6)]">
                五行能量分布
              </span>
              {elemental.balance_score !== undefined && (
                <span className="text-xs text-[color:var(--ink-5)]">
                  平衡度: {elemental.balance_score.toFixed(0)}分
                </span>
              )}
            </div>
            <div className="space-y-2">
              {elemental.wood !== undefined && (
                <ElementBar element="wood" value={elemental.wood} />
              )}
              {elemental.fire !== undefined && (
                <ElementBar element="fire" value={elemental.fire} />
              )}
              {elemental.earth !== undefined && (
                <ElementBar element="earth" value={elemental.earth} />
              )}
              {elemental.metal !== undefined && (
                <ElementBar element="metal" value={elemental.metal} />
              )}
              {elemental.water !== undefined && (
                <ElementBar element="water" value={elemental.water} />
              )}
            </div>
            {elemental.climate?.description && (
              <p className="mt-2 text-xs text-[color:var(--ink-5)] italic">
                调候: {elemental.climate.description}
              </p>
            )}
          </div>
        )}

        {/* 十神功能层 */}
        {tenGod && !compact && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-[color:var(--bg-elevated)] rounded-lg">
            <div className="text-center">
              <span className="text-xs text-[color:var(--ink-5)] block">主导角色</span>
              <span className="text-sm font-medium text-indigo-600">
                {tenGod.dominant_role || '无'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-[color:var(--ink-5)] block">流通效率</span>
              <span className="text-sm font-medium text-[color:var(--data-up)]">
                {tenGod.structure_efficiency?.toFixed(0) || 0}分
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-[color:var(--ink-5)] block">冲突指数</span>
              <span className="text-sm font-medium text-[color:var(--alert)]">
                {tenGod.conflict_index?.toFixed(0) || 0}
              </span>
            </div>
          </div>
        )}

        {/* 格局判定层 */}
        {structure && (
          <div>
            <div className="flex items-center justify-between mb-2">
              {structure.body_strength?.level_info?.name && (
                <span className="text-sm">
                  日主: <span className="font-medium text-[color:var(--ink-1)][color:var(--bg-elevated)]">
                    {structure.body_strength.level_info.name}
                  </span>
                </span>
              )}
              {structure.pattern?.info?.name && (
                <span className="text-xs text-[color:var(--brand-strong)] bg-[color:var(--brand-soft-2)] px-2 py-0.5 rounded">
                  {structure.pattern.info.name}
                </span>
              )}
            </div>

            {/* 用神喜忌 */}
            <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-2 mt-3`}>
              <ElementTags
                title="用神"
                elements={structure.useful_elements?.yongShen || []}
                variant="positive"
              />
              <ElementTags
                title="喜神"
                elements={structure.useful_elements?.xiShen || []}
                variant="positive"
              />
              <ElementTags
                title="忌神"
                elements={structure.useful_elements?.jiShen || []}
                variant="negative"
              />
              <ElementTags
                title="仇神"
                elements={structure.useful_elements?.qiuShen || []}
                variant="negative"
              />
            </div>
          </div>
        )}

        {/* 优劣势摘要 */}
        {comprehensive && !compact && (
          <div className="grid grid-cols-2 gap-3">
            {comprehensive.strengths && comprehensive.strengths.length > 0 && (
              <div className="p-2 bg-[rgba(47,125,82,0.08)] rounded-lg">
                <span className="text-xs text-[color:var(--data-up)] font-medium block mb-1">
                  优势
                </span>
                <ul className="text-xs text-[color:var(--ink-4)] space-y-1">
                  {comprehensive.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-[color:var(--data-up)]">✓</span>
                      <span className="line-clamp-1">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comprehensive.weaknesses && comprehensive.weaknesses.length > 0 && (
              <div className="p-2 bg-[color:var(--alert-soft)] rounded-lg">
                <span className="text-xs text-[color:var(--alert)] font-medium block mb-1">
                  弱势
                </span>
                <ul className="text-xs text-[color:var(--ink-4)] space-y-1">
                  {comprehensive.weaknesses.slice(0, 3).map((w, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-[color:var(--alert)]">!</span>
                      <span className="line-clamp-1">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StateVectorDashboard;
