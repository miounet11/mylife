/**
 * Free-tool engine projector — rebind report-rehash tools onto engine facts.
 *
 * Production tools currently re-label full-report narrative. This module
 * builds theme-aware summaries from GroundTruthPack so free tools can ship
 * dimension-quality evidence without inventing 121 engines.
 */

import type { GroundTruthPack } from '@/lib/ground-truth/pack';
import { TOOL_ENGINE_CONTRACT } from '@/lib/ground-truth/hard-contract';

export type ToolThemeCategory =
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'health'
  | 'family'
  | 'migration'
  | 'timing'
  | 'application'
  | 'general';

export interface ToolEngineSummary {
  headline: string;
  summary: string;
  recommendedAction: string;
  riskReminder: string;
  whyItMatches: string;
  evidence: string[];
  confidenceLabel: string;
  engineContract: string;
  /** For optional LLM polish — same preserve tokens as dimensions */
  preserveTokens: string[];
  dimensionSlugHint?: string;
}

const CATEGORY_TO_DIM: Partial<Record<ToolThemeCategory, string>> = {
  career: 'career-industry',
  wealth: 'investment',
  relationship: 'marriage',
  health: 'health',
  family: 'living-environment',
  migration: 'living-environment',
  timing: 'fortune-rhythm',
  application: 'timing-selection',
};

const CATEGORY_KLINE_KEY: Partial<
  Record<ToolThemeCategory, 'career' | 'wealth' | 'marriage' | 'health'>
> = {
  career: 'career',
  wealth: 'wealth',
  relationship: 'marriage',
  health: 'health',
  family: 'marriage',
  migration: 'career',
  timing: 'career',
};

function currentDimScore(pack: GroundTruthPack, category: ToolThemeCategory): number | null {
  const key = CATEGORY_KLINE_KEY[category] || 'career';
  const year = pack.lockedFacts.currentYear;
  const point = pack.engine.kline.points.find((p) => p.year === year);
  if (!point) return pack.lockedFacts.currentScore;
  const val = (point as Record<string, unknown>)[key];
  return typeof val === 'number' ? Math.round(val) : pack.lockedFacts.currentScore;
}

function phaseLabel(score: number | null): string {
  if (score == null) return '观察';
  if (score >= 65) return '推进';
  if (score >= 50) return '稳健';
  if (score >= 40) return '收敛';
  return '防守';
}

/**
 * Build free-tool fields from engine pack + tool theme.
 * Prefer this over rehashing report.analysis.opening.
 */
export function projectToolEngineSummary(params: {
  pack: GroundTruthPack;
  category: ToolThemeCategory;
  toolTitle: string;
  shortTitle?: string;
  note?: string;
}): ToolEngineSummary {
  const { pack, category, toolTitle, shortTitle, note } = params;
  const f = pack.lockedFacts;
  const score = currentDimScore(pack, category);
  const phase = phaseLabel(score);
  const yong = f.yongShen.join('、') || '用神方向';
  const ji = f.jiShen.join('、') || '忌神方向';
  const dayun = f.currentDayun
    ? `${f.currentDayun.ganZhi}运（${f.currentDayun.startAge}-${f.currentDayun.endAge}岁）`
    : '当前大运';
  const best =
    pack.engine.kline.windows.find((w) => w.type === 'peak')?.label ||
    pack.engine.kline.windows[0]?.label ||
    `${f.currentYear}年`;
  const risk =
    pack.engine.kline.windows.find((w) => w.type === 'trough')?.label ||
    pack.engine.kline.windows[1]?.label ||
    '高压窗口';

  const themeLead: Record<ToolThemeCategory, string> = {
    career: `事业节奏偏「${phase}」`,
    wealth: `资源节奏偏「${phase}」`,
    relationship: `关系节奏偏「${phase}」`,
    health: `恢复节奏偏「${phase}」`,
    family: `家庭排序宜「${phase}」`,
    migration: `环境匹配宜「${phase}」`,
    timing: `时序判断偏「${phase}」`,
    application: `应用判断偏「${phase}」`,
    general: `综合节奏偏「${phase}」`,
  };

  const headline = `${shortTitle || toolTitle}：${themeLead[category]}${
    score != null ? `（参考 ${score} 分）` : ''
  }`;

  const summary = [
    `基于日主${f.dayMaster || '—'}、用神「${yong}」、${dayun}。`,
    `本工具主题对齐引擎结构，不是整份报告开场白复述。`,
    note ? `补充：${note}` : '',
  ]
    .filter(Boolean)
    .join('');

  const recommendedAction = [
    `顺着「${yong}」做一件 30 天可验证的小动作`,
    best ? `；优先窗口参考 ${best}` : '',
  ].join('');

  const riskReminder = [
    `「${ji}」方向少硬推`,
    risk ? `；${risk} 宜收敛战线` : '',
  ].join('');

  const evidence = [
    f.dayMaster ? `日主 ${f.dayMaster} · 格局 ${f.pattern || '—'}` : '',
    `用神 ${yong} · 忌神 ${ji}`,
    dayun,
    score != null ? `${f.currentYear} 主题参考分 ${score}` : '',
    f.tenGodsStem.length
      ? `十神 ${[...new Set(f.tenGodsStem)].slice(0, 4).join('、')}`
      : '',
  ].filter(Boolean);

  const whyItMatches = [
    `该判断来自引擎真值包（${pack.version}）`,
    CATEGORY_TO_DIM[category] ? `，主题可对齐维度 ${CATEGORY_TO_DIM[category]}` : '',
    '；LLM 仅可润色表达，不得改写上述字段。',
  ].join('');

  return {
    headline,
    summary,
    recommendedAction,
    riskReminder,
    whyItMatches,
    evidence,
    confidenceLabel: '引擎结构判断',
    engineContract: TOOL_ENGINE_CONTRACT,
    preserveTokens: pack.preserveTokens,
    dimensionSlugHint: CATEGORY_TO_DIM[category],
  };
}

/** Map free-tool slug prefix → theme category. */
export function toolSlugToCategory(slug: string): ToolThemeCategory {
  const s = `${slug || ''}`.toLowerCase();
  if (s.startsWith('career')) return 'career';
  if (s.startsWith('wealth')) return 'wealth';
  if (s.startsWith('relationship')) return 'relationship';
  if (s.startsWith('health')) return 'health';
  if (s.startsWith('family')) return 'family';
  if (s.startsWith('migration')) return 'migration';
  if (s.startsWith('timing') || s === 'daily-sign' || s.includes('yearly-window')) return 'timing';
  if (s.startsWith('application')) return 'application';
  return 'general';
}
