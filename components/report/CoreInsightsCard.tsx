/**
 * 核心洞察卡片组件 (v1.3.0)
 * Core Insights Card Component
 *
 * 在分析结果页面顶部展示关键结构洞察
 * 日主五行 | 用神喜忌 | 核心特质 | 人生巅峰
 */
import React from 'react';
import { Crown, Flame, Droplets, Mountain, TreePine, Coins, Sparkles, TrendingUp, ArrowDown, AlertCircle } from 'lucide-react';

interface CoreInsightsCardProps {
  bazi?: string[];
  dayMasterAnalysis?: string;
  usefulGod?: string;
  characterSummary?: string;
  peakYear?: { year: number; age: number; score: number; reason?: string };
  troughYear?: { year: number; age: number; score: number; reason?: string };
  currentAge?: number;
  className?: string;
}

// 天干五行映射
const TIANGAN_WUXING: Record<string, { element: string; emoji: string; color: string; bgColor: string }> = {
  '甲': { element: '木', emoji: '🌲', color: 'text-[color:var(--data-up)]', bgColor: 'bg-[rgba(47,125,82,0.12)]' },
  '乙': { element: '木', emoji: '🌿', color: 'text-[color:var(--data-up)]', bgColor: 'bg-[rgba(47,125,82,0.08)]' },
  '丙': { element: '火', emoji: '🔥', color: 'text-[color:var(--alert)]', bgColor: 'bg-[rgba(189,76,66,0.16)]' },
  '丁': { element: '火', emoji: '🕯️', color: 'text-[color:var(--signal-strong)]', bgColor: 'bg-[color:var(--signal-soft)]' },
  '戊': { element: '土', emoji: '⛰️', color: 'text-[color:var(--signal-strong)]', bgColor: 'bg-[rgba(201,161,74,0.16)]' },
  '己': { element: '土', emoji: '🏜️', color: 'text-[color:var(--signal-strong)]', bgColor: 'bg-[color:var(--signal-soft)]' },
  '庚': { element: '金', emoji: '⚔️', color: 'text-[color:var(--ink-4)]', bgColor: 'bg-[color:var(--bg-sunken)]' },
  '辛': { element: '金', emoji: '💎', color: 'text-[color:var(--ink-5)]', bgColor: 'bg-[color:var(--bg-elevated)]' },
  '壬': { element: '水', emoji: '🌊', color: 'text-[color:var(--env)]', bgColor: 'bg-[rgba(49,95,132,0.16)]' },
  '癸': { element: '水', emoji: '💧', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
};

// 五行颜色映射
const WUXING_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  '木': { color: 'text-[color:var(--data-up)]', bgColor: 'bg-[rgba(47,125,82,0.08)]', borderColor: 'border-[rgba(47,125,82,0.20)]' },
  '火': { color: 'text-[color:var(--alert)]', bgColor: 'bg-[color:var(--alert-soft)]', borderColor: 'border-[color:var(--alert)]' },
  '土': { color: 'text-[color:var(--signal-strong)]', bgColor: 'bg-[color:var(--signal-soft)]', borderColor: 'border-[color:var(--signal)]' },
  '金': { color: 'text-[color:var(--ink-4)]', bgColor: 'bg-[color:var(--bg-elevated)]', borderColor: 'border-[color:var(--hairline-strong)]' },
  '水': { color: 'text-[color:var(--env)]', bgColor: 'bg-[color:var(--env-soft)]', borderColor: 'border-[color:var(--env)]' },
};

// 五行图标
const WuxingIcon: React.FC<{ element: string; className?: string }> = ({ element, className = '' }) => {
  switch (element) {
    case '木':
      return <TreePine className={`w-4 h-4 ${className}`} />;
    case '火':
      return <Flame className={`w-4 h-4 ${className}`} />;
    case '土':
      return <Mountain className={`w-4 h-4 ${className}`} />;
    case '金':
      return <Coins className={`w-4 h-4 ${className}`} />;
    case '水':
      return <Droplets className={`w-4 h-4 ${className}`} />;
    default:
      return <Sparkles className={`w-4 h-4 ${className}`} />;
  }
};

// 提取日主信息
const extractDayMaster = (bazi?: string[]): { gan: string; element: string; info: typeof TIANGAN_WUXING['甲'] } | null => {
  if (!bazi || bazi.length < 3) return null;
  const dayPillar = bazi[2];
  if (!dayPillar || dayPillar.length < 1) return null;
  const gan = dayPillar[0];
  const info = TIANGAN_WUXING[gan];
  if (!info) return null;
  return { gan, element: info.element, info };
};

// 解析用神字符串
const parseUsefulGod = (usefulGod?: string): string[] => {
  if (!usefulGod) return [];
  // 支持多种分隔符: "火、土" "火,土" "火 土"
  return usefulGod.split(/[、,，\s]+/).filter(Boolean).slice(0, 3);
};

export const CoreInsightsCard: React.FC<CoreInsightsCardProps> = ({
  bazi,
  dayMasterAnalysis,
  usefulGod,
  characterSummary,
  peakYear,
  troughYear,
  currentAge,
  className = '',
}) => {
  const dayMasterInfo = extractDayMaster(bazi);
  const usefulElements = parseUsefulGod(usefulGod);

  // 计算距离巅峰/低谷的年数
  const yearsToPeak = peakYear && currentAge ? peakYear.age - currentAge : null;
  const yearsToTrough = troughYear && currentAge ? troughYear.age - currentAge : null;

  // 没有足够数据时不渲染
  if (!dayMasterInfo && !usefulElements.length && !characterSummary && !peakYear) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e] to-[#1a1a2e]/95 ${className}`}>
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4af37] via-[#663399] to-[#d4af37]" />

      {/* 光效装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#663399]/20 to-transparent rounded-full blur-2xl" />

      <div className="relative p-5">
        {/* 标题行 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-[#d4af37]/20 rounded-lg">
            <Crown className="w-4 h-4 text-[#d4af37]" />
          </div>
          <h3 className="text-sm font-medium text-white/90 font-display tracking-wide">核心结构洞察</h3>
        </div>

        {/* 四格洞察 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 日主五行 */}
          {dayMasterInfo && (
            <div className={`rounded-xl p-3 border ${dayMasterInfo.info.bgColor} ${WUXING_COLORS[dayMasterInfo.element]?.borderColor || 'border-neutral-200'}`}>
              <div className="text-xs text-neutral-500 mb-1.5">日主五行</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{dayMasterInfo.info.emoji}</span>
                <div>
                  <div className={`text-lg font-bold ${dayMasterInfo.info.color}`}>
                    {dayMasterInfo.gan}{dayMasterInfo.element}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {dayMasterInfo.element === '木' && '生机勃勃'}
                    {dayMasterInfo.element === '火' && '热情奔放'}
                    {dayMasterInfo.element === '土' && '稳重厚实'}
                    {dayMasterInfo.element === '金' && '刚毅果断'}
                    {dayMasterInfo.element === '水' && '智慧灵动'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 用神喜忌 */}
          {usefulElements.length > 0 && (
            <div className="rounded-xl p-3 bg-gradient-to-br from-[#663399]/10 to-[#663399]/5 border border-[#663399]/20">
              <div className="text-xs text-neutral-500 mb-1.5">用神五行</div>
              <div className="flex flex-wrap gap-1.5">
                {usefulElements.map((element, idx) => {
                  const colors = WUXING_COLORS[element];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${colors?.bgColor || 'bg-neutral-100'} ${colors?.color || 'text-neutral-600'} border ${colors?.borderColor || 'border-neutral-200'}`}
                    >
                      <WuxingIcon element={element} className={colors?.color} />
                      <span>{element}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1.5">
                喜用五行 助运开运
              </div>
            </div>
          )}

          {/* 核心特质 */}
          {characterSummary && (
            <div className="rounded-xl p-3 bg-gradient-to-br from-white to-neutral-50 border border-neutral-200">
              <div className="text-xs text-neutral-500 mb-1.5">核心特质</div>
              <div className="text-sm font-medium text-[#1a1a2e] leading-snug line-clamp-2">
                {characterSummary.slice(0, 30)}
                {characterSummary.length > 30 && '...'}
              </div>
            </div>
          )}

          {/* 人生巅峰 */}
          {peakYear && yearsToPeak !== null && (
            <div className={`rounded-xl p-3 border ${
              yearsToPeak > 0
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-[rgba(47,125,82,0.20)]'
                : yearsToPeak < 0
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-[color:var(--signal)]'
                  : 'bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 border-[#d4af37]/30'
            }`}>
              <div className="text-xs text-neutral-500 mb-1.5">
                {yearsToPeak > 0 ? '距离巅峰' : yearsToPeak < 0 ? '已过巅峰' : '正值巅峰'}
              </div>
              <div className="flex items-center gap-2">
                {yearsToPeak > 0 ? (
                  <TrendingUp className="w-5 h-5 text-[color:var(--data-up)]" />
                ) : yearsToPeak < 0 ? (
                  <ArrowDown className="w-5 h-5 text-[color:var(--signal-strong)]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#d4af37]" />
                )}
                <div>
                  <div className={`text-lg font-bold ${
                    yearsToPeak > 0 ? 'text-[color:var(--data-up)]' : yearsToPeak < 0 ? 'text-[color:var(--signal-strong)]' : 'text-[#d4af37]'
                  }`}>
                    {yearsToPeak === 0 ? '今年' : `${Math.abs(yearsToPeak)}年`}
                    {yearsToPeak > 0 && <span className="text-xs ml-1">后</span>}
                    {yearsToPeak < 0 && <span className="text-xs ml-1">前</span>}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {peakYear.year}年 ({peakYear.score}分)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 如果没有巅峰数据但有低谷数据 */}
          {!peakYear && troughYear && yearsToTrough !== null && yearsToTrough > 0 && yearsToTrough < 10 && (
            <div className="rounded-xl p-3 bg-gradient-to-br from-rose-50 to-orange-50 border border-[color:var(--alert)]">
              <div className="text-xs text-neutral-500 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[color:var(--alert)]" />
                注意调整期
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-[color:var(--alert)]" />
                <div>
                  <div className="text-lg font-bold text-[color:var(--alert)]">
                    {yearsToTrough}年<span className="text-xs ml-1">后</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {troughYear.year}年 需谨慎
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 日主分析简要 */}
        {dayMasterAnalysis && (
          <div className="mt-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
              {dayMasterAnalysis.slice(0, 100)}
              {dayMasterAnalysis.length > 100 && '...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoreInsightsCard;
