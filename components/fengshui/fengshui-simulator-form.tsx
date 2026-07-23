'use client';

import { useState, useCallback } from 'react';
import { FengshuiRadarChart, type FengshuiRadarDataPoint } from './fengshui-radar-chart';
import { ShopColorSwatch } from './shop-color-swatch';
import { analyzeShopFengshui, resolveIndustryElement } from '@/lib/fengshui';
import type { ShopFengshuiInput, ShopFengshuiOutput } from '@/lib/fengshui/types';

// No personal Bazi context is collected on this page. The engine therefore uses
// the selected industry's own element profile as a shop-level reference, rather
// than presenting it as the user's personal favorable-element conclusion.
const REFERENCE_UNFAVORABLE_ELEMENTS: string[] = [];

const ELEMENT_LABELS: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

// ---------------------------------------------------------------------------
// Form UI
// ---------------------------------------------------------------------------

const INDUSTRY_OPTIONS = ['餐饮', '零售', '科技', '教育', '美容', '医疗', '金融', '文化', '制造', '地产'] as const;
const DIRECTION_OPTIONS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'] as const;
const DECOR_OPTIONS = ['', '现代简约', '新中式', '工业风', '北欧', '轻奢'] as const;

const DIMENSION_LABELS: Record<keyof ShopFengshuiOutput['radarScores'], string> = {
  industry: '行业匹配',
  direction: '方位匹配',
  nameScore: '店名匹配',
  colorScore: '色彩匹配',
  timingScore: '择时匹配',
};

export function FengshuiSimulatorForm() {
  const [industry, setIndustry] = useState('');
  const [shopName, setShopName] = useState('');
  const [doorDirection, setDoorDirection] = useState('');
  const [decor, setDecor] = useState('');
  const [openingDate, setOpeningDate] = useState('');

  const [result, setResult] = useState<ShopFengshuiOutput | null>(null);
  const [calculating, setCalculating] = useState(false);

  const canSubmit = industry && shopName.trim() && doorDirection;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setCalculating(true);
      // Small delay so the user sees a brief loading state
      setTimeout(() => {
        const input: ShopFengshuiInput = {
          industryType: industry,
          shopName: shopName.trim(),
          doorDirection,
          decorPreference: decor || undefined,
          openingDate: openingDate || undefined,
        };
        const industryProfile = resolveIndustryElement(industry);
        const referenceElements = [industryProfile.element, industryProfile.subElement].filter(
          (element): element is string => Boolean(element),
        );
        const output = analyzeShopFengshui(
          input,
          referenceElements,
          REFERENCE_UNFAVORABLE_ELEMENTS,
          '行业五行结构',
        );
        setResult(output);
        setCalculating(false);
      }, 300);
    },
    [canSubmit, industry, shopName, doorDirection, decor, openingDate],
  );

  const handleReset = useCallback(() => {
    setResult(null);
    setIndustry('');
    setShopName('');
    setDoorDirection('');
    setDecor('');
    setOpeningDate('');
  }, []);

  // Build radar data from result
  const radarData: FengshuiRadarDataPoint[] = result
    ? (Object.entries(result.radarScores) as [keyof typeof result.radarScores, number][]).map(
        ([key, score]) => ({
          dimension: DIMENSION_LABELS[key],
          score,
          fullMark: 100,
        }),
      )
    : [];

  // Score color gradient
  const scoreColor =
    result
      ? result.overallScore >= 75
        ? 'var(--brand)'
        : result.overallScore >= 50
          ? '#E8A040'
          : 'var(--ink-4)'
      : 'var(--ink-4)';

  return (
    <div className="space-y-6">
      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="fb-card space-y-4 p-5">
        <h3 className="text-base font-semibold text-[color:var(--ink-1)]">商铺信息</h3>

        {/* Industry + Shop Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[color:var(--ink-2)]">
              行业类型 <span className="text-[color:var(--ink-4)]">*</span>
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2 text-[14px] text-[color:var(--ink-1)] focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
            >
              <option value="">请选择行业</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[color:var(--ink-2)]">
              商铺名称 <span className="text-[color:var(--ink-4)]">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="如：聚福楼"
              maxLength={20}
              className="block w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2 text-[14px] text-[color:var(--ink-1)] placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
            />
          </div>
        </div>

        {/* Door Direction + Decor row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[color:var(--ink-2)]">
              大门朝向 <span className="text-[color:var(--ink-4)]">*</span>
            </label>
            <select
              value={doorDirection}
              onChange={(e) => setDoorDirection(e.target.value)}
              className="block w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2 text-[14px] text-[color:var(--ink-1)] focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
            >
              <option value="">请选择朝向</option>
              {DIRECTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[color:var(--ink-2)]">
              装修风格偏好
            </label>
            <select
              value={decor}
              onChange={(e) => setDecor(e.target.value)}
              className="block w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2 text-[14px] text-[color:var(--ink-1)] focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
            >
              <option value="">不限</option>
              {DECOR_OPTIONS.filter(Boolean).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opening Date */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[color:var(--ink-2)]">
            计划开业日期
          </label>
          <input
            type="date"
            value={openingDate}
            onChange={(e) => setOpeningDate(e.target.value)}
            className="block w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2 text-[14px] text-[color:var(--ink-1)] focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)] sm:max-w-xs"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSubmit || calculating}
            className="inline-flex h-9 items-center rounded-[6px] bg-[color:var(--brand-strong)] px-4 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {calculating ? '分析中...' : '开始分析'}
          </button>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center rounded-[6px] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-4 text-[13px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
            >
              重新分析
            </button>
          )}
        </div>
      </form>

      {/* ---- Results ---- */}
      {result && (
        <div className="space-y-5">
          {/* 1. Overall Score */}
          <div className="fb-card flex flex-col items-center p-6 text-center">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
              综合匹配度
            </div>
            <div
              className="mt-2 text-5xl font-bold"
              style={{ color: scoreColor }}
            >
              {result.overallScore}
            </div>
            <div className="mt-1 text-[13px] text-[color:var(--ink-3)]">
              {result.overallScore >= 75
                ? '当前输入维度的结构协调度较高'
                : result.overallScore >= 50
                  ? '当前结构基本协调，仍有优化空间'
                  : '当前维度存在差异，可结合建议调整'}
            </div>
            <p className="mt-3 max-w-xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
              本次结果未读取个人八字，按商铺行业、门向、名称、装修与日期作通用结构分析，不代表个人喜用五行结论。
            </p>
          </div>

          {/* 2. Radar Chart */}
          <div className="fb-card p-5">
            <h4 className="mb-3 text-[13px] font-semibold text-[color:var(--ink-2)]">五维匹配雷达图</h4>
            <FengshuiRadarChart data={radarData} color={scoreColor} />
          </div>

          {/* 3. Color Scheme */}
          <div className="fb-card p-5">
            <h4 className="mb-4 text-[13px] font-semibold text-[color:var(--ink-2)]">推荐色彩方案</h4>
            <div className="space-y-4">
              <ShopColorSwatch {...result.colorScheme.primary} />
              <ShopColorSwatch {...result.colorScheme.secondary} />
              <ShopColorSwatch {...result.colorScheme.accent} />
              {result.colorScheme.avoidColors.length > 0 && (
                <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
                  <div className="text-[12px] font-medium text-[color:var(--ink-5)]">
                    建议避免使用：{result.colorScheme.avoidColors.join('、')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Name Analysis */}
          <div className="fb-card p-5">
            <h4 className="mb-3 text-[13px] font-semibold text-[color:var(--ink-2)]">店名分析</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                {result.nameAnalysis.totalScore}
              </span>
              <span className="text-[13px] text-[color:var(--ink-3)]">/ 100 分</span>
            </div>
            <p className="text-[14px] leading-relaxed text-[color:var(--ink-2)]">
              {result.nameAnalysis.summary}
            </p>
            {result.nameAnalysis.characters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.nameAnalysis.characters.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-[6px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 py-1 text-[13px]"
                  >
                    <span className="text-[color:var(--ink-1)]">{c.char}</span>
                    <span className="text-[11px] text-[color:var(--ink-4)]">
                      {ELEMENT_LABELS[c.element] ?? c.element} {c.score}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 5. Layout Advice */}
          <div className="fb-card p-5">
            <h4 className="mb-4 text-[13px] font-semibold text-[color:var(--ink-2)]">布局建议</h4>
            <div className="space-y-4">
              <AdviceBlock label="整体格局" text={result.layoutAdvice.overallLayout} />
              <AdviceBlock label="收银台" text={result.layoutAdvice.cashierAdvice} />
              <AdviceBlock label="入口设计" text={result.layoutAdvice.entranceAdvice} />
              <AdviceBlock label="动线规划" text={result.layoutAdvice.flowAdvice} />
              {result.layoutAdvice.loungeAdvice && (
                <AdviceBlock label="休息区" text={result.layoutAdvice.loungeAdvice} />
              )}
            </div>
          </div>

          {/* 6. Structural Summary */}
          <div className="fb-card p-5">
            <h4 className="mb-3 text-[13px] font-semibold text-[color:var(--ink-2)]">结构观察</h4>
            <p className="text-[14px] leading-relaxed text-[color:var(--ink-2)]">
              {result.structuralSummary}
            </p>
          </div>

          {/* Timing Window */}
          <div className="fb-card p-5">
            <h4 className="mb-3 text-[13px] font-semibold text-[color:var(--ink-2)]">开业择时参考</h4>
            <div className="space-y-2 text-[14px] text-[color:var(--ink-2)]">
              <div>
                <span className="font-medium text-[color:var(--ink-1)]">推荐季节：</span>
                {result.timingWindow.seasonPreference}
              </div>
              {result.timingWindow.recommendedDate && (
                <div>
                  <span className="font-medium text-[color:var(--ink-1)]">计划日期：</span>
                  {result.timingWindow.recommendedDate}
                </div>
              )}
              {result.timingWindow.avoidPeriods.length > 0 && (
                <div>
                  <span className="font-medium text-[color:var(--ink-1)]">建议避开：</span>
                  {result.timingWindow.avoidPeriods.join('、')}
                </div>
              )}
              <p className="text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                {result.timingWindow.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small helper for layout advice sections. */
function AdviceBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[color:var(--ink-4)]">
        {label}
      </div>
      <p className="mt-1 text-[14px] leading-relaxed text-[color:var(--ink-2)]">{text}</p>
    </div>
  );
}