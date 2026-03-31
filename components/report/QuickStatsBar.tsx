/**
 * 快速统计栏组件
 * Quick Stats Bar Component
 *
 * 提供可扫描的关键指标一览
 */
import React from 'react';
import { Star, TrendingUp, TrendingDown, Minus, Coins, Target } from 'lucide-react';

interface QuickStatsBarProps {
  summaryScore?: number;
  yearlyTrend?: 'up' | 'down' | 'stable';
  yearlyScore?: number;
  wealthScore?: number;
  peakAge?: number;
  currentAge?: number;
  className?: string;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-rose-500" />;
    default:
      return <Minus className="w-4 h-4 text-amber-500" />;
  }
};

const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return { text: '上升期', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'down':
      return { text: '调整期', color: 'text-rose-600', bg: 'bg-rose-50' };
    default:
      return { text: '平稳期', color: 'text-amber-600', bg: 'bg-amber-50' };
  }
};

const normalizeScore = (score: number | undefined): number => {
  if (score === undefined || score === null) return 0;
  if (score > 10) return Math.min(10, Math.round(score / 10));
  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
};

const getScoreColor = (score: number) => {
  if (score >= 8) return { text: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' };
  if (score >= 6) return { text: 'text-[#663399]', bg: 'bg-[#663399]/10' };
  if (score >= 4) return { text: 'text-neutral-600', bg: 'bg-neutral-100' };
  return { text: 'text-rose-600', bg: 'bg-rose-50' };
};

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  summaryScore,
  yearlyTrend = 'stable',
  yearlyScore,
  wealthScore,
  peakAge,
  currentAge,
  className = '',
}) => {
  const normalizedSummary = normalizeScore(summaryScore);
  const normalizedWealth = normalizeScore(wealthScore);
  const normalizedYearly = normalizeScore(yearlyScore);
  const summaryColors = getScoreColor(normalizedSummary);
  const wealthColors = getScoreColor(normalizedWealth);
  const trendInfo = getTrendLabel(yearlyTrend);

  const yearsToFeak = peakAge && currentAge ? peakAge - currentAge : null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-white via-neutral-50 to-white border border-[#d4af37]/20 ${className}`}>
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#d4af37] via-[#663399] to-[#d4af37]" />

      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6">
          {/* Overall Score */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summaryColors.bg}`}>
              <Star className={`w-5 h-5 ${summaryColors.text}`} />
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-0.5">状态总分</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold tabular-nums ${summaryColors.text}`}>
                  {normalizedSummary.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-400">/10</span>
              </div>
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />

          {/* Yearly Trend */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${trendInfo.bg}`}>
              <TrendIcon trend={yearlyTrend} />
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-0.5">本年运势</div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${trendInfo.color}`}>
                  {trendInfo.text}
                </span>
                {normalizedYearly > 0 && (
                  <span className="text-sm text-neutral-400">
                    {normalizedYearly.toFixed(0)}分
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />

          {/* Wealth Score */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${wealthColors.bg}`}>
              <Coins className={`w-5 h-5 ${wealthColors.text}`} />
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-0.5">财运指数</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold tabular-nums ${wealthColors.text}`}>
                  {normalizedWealth.toFixed(0)}
                </span>
                <span className="text-sm text-neutral-400">/10</span>
              </div>
            </div>
          </div>

          {/* Peak Age - only show if meaningful */}
          {yearsToFeak !== null && yearsToFeak > 0 && yearsToFeak < 50 && (
            <>
              {/* Divider - hidden on mobile */}
              <div className="hidden lg:block w-px h-10 bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />

              <div className="hidden lg:flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#663399]/10">
                  <Target className="w-5 h-5 text-[#663399]" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-0.5">距离巅峰</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-[#663399]">
                      {yearsToFeak}
                    </span>
                    <span className="text-sm text-neutral-400">年</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickStatsBar;
