import React from 'react';

/**
 * v1.4.0 Probability Data Types
 */
export interface ProbabilityInterval {
  center: number;
  lower: number;
  upper: number;
}

export interface ProbabilityFactor {
  name: string;
  effect: number;
  description?: string;
}

export interface FortuneWindow {
  level: 'excellent' | 'good' | 'neutral' | 'caution' | 'challenging';
  score: number;
  probability: ProbabilityInterval;
  description?: string;
  factors?: ProbabilityFactor[];
}

export interface EventProbability {
  type: string;
  probability: ProbabilityInterval;
  score: number;
  label: string;
  factors?: ProbabilityFactor[];
}

export interface ProbabilityScoreBarProps {
  fortuneWindow?: FortuneWindow | null;
  eventProbabilities?: Record<string, EventProbability | null>;
  title?: string;
  className?: string;
  compact?: boolean;
}

// Level configuration
const LEVEL_CONFIG = {
  excellent: {
    color: 'bg-gradient-to-r from-green-400 to-emerald-500',
    textColor: 'text-[color:var(--data-up)] dark:text-emerald-400',
    bgColor: 'bg-[rgba(47,125,82,0.08)] dark:bg-emerald-900/20',
    label: '大吉',
  },
  good: {
    color: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    textColor: 'text-[color:var(--env)] dark:text-blue-400',
    bgColor: 'bg-[color:var(--env-soft)] dark:bg-blue-900/20',
    label: '吉',
  },
  neutral: {
    color: 'bg-gradient-to-r from-gray-400 to-slate-500',
    textColor: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-700/20',
    label: '平',
  },
  caution: {
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: '需谨慎',
  },
  challenging: {
    color: 'bg-gradient-to-r from-red-400 to-rose-500',
    textColor: 'text-[color:var(--alert)] dark:text-rose-400',
    bgColor: 'bg-[color:var(--alert-soft)] dark:bg-rose-900/20',
    label: '需努力',
  },
};

// Event type labels
const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  marriage: { label: '婚姻', icon: '💍' },
  career_change: { label: '事业变动', icon: '📈' },
  windfall: { label: '偏财运', icon: '💰' },
  health_issue: { label: '健康风险', icon: '🏥' },
  career: { label: '事业', icon: '💼' },
  wealth: { label: '财运', icon: '💎' },
  health: { label: '健康', icon: '❤️' },
};

/**
 * Confidence Interval Bar Component
 * Displays probability with confidence interval visualization
 */
const ConfidenceBar: React.FC<{
  probability?: ProbabilityInterval | null;
  label?: string;
  size?: 'sm' | 'md';
}> = ({ probability, label, size = 'md' }) => {
  // Handle missing probability data
  if (!probability || typeof probability.center !== 'number') {
    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-xs text-gray-400">--</span>
          </div>
        )}
        <div className={`w-full ${size === 'sm' ? 'h-2' : 'h-3'} bg-gray-200 dark:bg-gray-700 rounded-full`} />
      </div>
    );
  }

  const { center, lower, upper } = probability;
  const centerPercent = center * 100;
  const lowerPercent = (lower ?? center * 0.8) * 100;
  const upperPercent = (upper ?? center * 1.2) * 100;

  const getColor = (value: number) => {
    if (value >= 0.7) return 'bg-[color:var(--data-up)]';
    if (value >= 0.5) return 'bg-[color:var(--env)]';
    if (value >= 0.3) return 'bg-yellow-500';
    return 'bg-[color:var(--alert)]';
  };

  const barHeight = size === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {centerPercent.toFixed(0)}%
            <span className="text-gray-400 dark:text-gray-500 ml-1">
              ({lowerPercent.toFixed(0)}-{upperPercent.toFixed(0)}%)
            </span>
          </span>
        </div>
      )}
      <div className={`relative w-full ${barHeight} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        {/* Confidence interval range (lighter) */}
        <div
          className="absolute h-full bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"
          style={{
            left: `${lowerPercent}%`,
            width: `${upperPercent - lowerPercent}%`,
          }}
        />
        {/* Center value (main bar) */}
        <div
          className={`absolute h-full ${getColor(center)} rounded-full transition-all duration-500`}
          style={{ width: `${centerPercent}%` }}
        />
        {/* Center marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white dark:bg-gray-200 opacity-80"
          style={{ left: `${centerPercent}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Factor Badge Component
 */
const FactorBadge: React.FC<{
  factor: ProbabilityFactor;
}> = ({ factor }) => {
  const isPositive = factor.effect > 0;
  const colorClass = isPositive
    ? 'bg-[rgba(47,125,82,0.12)] text-[color:var(--data-up)] dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-[rgba(189,76,66,0.16)] text-[color:var(--alert)] dark:bg-rose-900/30 dark:text-rose-400';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      <span>{factor.name}</span>
      <span className="opacity-75">
        {isPositive ? '+' : ''}{factor.effect}
      </span>
    </span>
  );
};

/**
 * Event Probability Card
 */
const EventCard: React.FC<{
  eventKey: string;
  event: EventProbability | null;
  compact?: boolean;
}> = ({ eventKey, event, compact }) => {
  if (!event) return null;

  const config = EVENT_LABELS[eventKey] || { label: event.label || eventKey, icon: '📊' };

  return (
    <div className={`${compact ? 'p-2' : 'p-3'} bg-white dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{config.icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
        <span className="ml-auto text-lg font-bold text-gray-900 dark:text-gray-100">
          {event.score ?? '--'}
        </span>
      </div>
      <ConfidenceBar probability={event.probability} size="sm" />
      {event.factors && event.factors.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-2">
          {event.factors.slice(0, 3).map((f, i) => (
            <FactorBadge key={i} factor={f} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ProbabilityScoreBar Component
 * Displays v1.4.0 Fortune Window and Event Probabilities
 */
export const ProbabilityScoreBar: React.FC<ProbabilityScoreBarProps> = ({
  fortuneWindow,
  eventProbabilities,
  title = '概率预测窗口',
  className = '',
  compact = false,
}) => {
  if (!fortuneWindow && !eventProbabilities) {
    return (
      <div className={`p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
          概率数据加载中...
        </p>
      </div>
    );
  }

  const levelConfig = fortuneWindow?.level ? LEVEL_CONFIG[fortuneWindow.level] : null;

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 ${levelConfig?.color || 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">🎯</span>
          {title}
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">v1.4.0</span>
        </h3>
      </div>

      <div className={`p-4 ${compact ? 'space-y-3' : 'space-y-5'}`}>
        {/* Fortune Window */}
        {fortuneWindow && (
          <div className={`p-4 rounded-lg ${levelConfig?.bgColor || 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full ${levelConfig?.color || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {fortuneWindow.score}
                </div>
                <div>
                  <span className={`text-lg font-semibold ${levelConfig?.textColor || 'text-gray-700'}`}>
                    {levelConfig?.label || '未知'}
                  </span>
                  {fortuneWindow.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {fortuneWindow.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Probability Bar */}
            <ConfidenceBar
              probability={fortuneWindow.probability}
              label="综合概率区间"
            />

            {/* Factors */}
            {fortuneWindow.factors && fortuneWindow.factors.length > 0 && !compact && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">影响因素</span>
                <div className="flex flex-wrap gap-1">
                  {fortuneWindow.factors.map((f, i) => (
                    <FactorBadge key={i} factor={f} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Probabilities */}
        {eventProbabilities && Object.keys(eventProbabilities).length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              事件概率分析
            </span>
            <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-2`}>
              {Object.entries(eventProbabilities)
                .filter(([_, event]) => event !== null && event !== undefined)
                .map(([key, event]) => (
                  <EventCard
                    key={key}
                    eventKey={key}
                    event={event}
                    compact={compact}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProbabilityScoreBar;
