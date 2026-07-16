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

function dayunQualityLabel(quality?: string): string {
  const q = `${quality || ''}`.toLowerCase();
  if (q.includes('good') || q.includes('favorable') || q === '顺') return '偏顺';
  if (q.includes('bad') || q.includes('unfavorable') || q === '逆') return '偏紧';
  if (q.includes('mixed') || q.includes('neutral')) return '中平';
  return quality ? `${quality}` : '中平';
}

function themeAction(params: {
  category: ToolThemeCategory;
  phase: string;
  yong: string;
  ji: string;
  best: string;
  risk: string;
  dayunLabel: string;
  dayunTone: string;
  score: number | null;
  tenGods: string;
}): { action: string; risk: string; lead: string; body: string } {
  const { category, phase, yong, ji, best, risk, dayunLabel, dayunTone, score, tenGods } = params;
  const scoreBit = score != null ? `主题参考分 ${score}` : '主题分待补';

  const table: Record<
    ToolThemeCategory,
    { lead: string; body: string; action: string; risk: string }
  > = {
    career: {
      lead: `事业节奏偏「${phase}」`,
      body: `岗位推进宜对齐用神「${yong}」，结合${dayunLabel}（${dayunTone}）。${tenGods ? `十神重心 ${tenGods}。` : ''}${scoreBit}。`,
      action: `本月只做一件可验证的事：顺着「${yong}」补一份成果材料或谈一次资源方；优先窗口参考 ${best}`,
      risk: `「${ji}」方向少硬推硬顶；${risk} 宜收敛战线，少同时开多条主线`,
    },
    wealth: {
      lead: `资源节奏偏「${phase}」`,
      body: `现金流与仓位节奏跟着用神「${yong}」走，忌神「${ji}」方向控制敞口。${dayunLabel}（${dayunTone}）。${scoreBit}。`,
      action: `30 天内把「一笔钱/一个项目」压成可复盘指标：顺着「${yong}」做轻仓试探；窗口参考 ${best}`,
      risk: `忌「${ji}」方向加杠杆；${risk} 先保流动性，不追求一次性重仓`,
    },
    relationship: {
      lead: `关系节奏偏「${phase}」`,
      body: `沟通与边界以用神「${yong}」为基调，减少「${ji}」式消耗战。${dayunLabel}。${scoreBit}。`,
      action: `选一次高质量对话（而非连发信息）：围绕「${yong}」表达需求与边界；节点参考 ${best}`,
      risk: `高压窗口 ${risk} 少做终局表态；忌神「${ji}」方向避免情绪对冲`,
    },
    health: {
      lead: `恢复节奏偏「${phase}」`,
      body: `作息与负荷管理对齐用神「${yong}」，忌「${ji}」式透支。${dayunLabel}。${scoreBit}。非医疗诊断。`,
      action: `连续 14 天固定一件恢复动作（睡眠/步行/复查节奏之一），用神方向「${yong}」；窗口 ${best}`,
      risk: `${risk} 少叠加高强度；「${ji}」式熬夜/硬撑先停`,
    },
    family: {
      lead: `家庭排序宜「${phase}」`,
      body: `家务与角色分工跟着用神「${yong}」减负，忌「${ji}」式对抗。${dayunLabel}。${scoreBit}。`,
      action: `本周只定一条家庭共识（时间/金钱/分工其一），顺着「${yong}」；节点 ${best}`,
      risk: `${risk} 少开多线程争吵；忌神「${ji}」话题先降温`,
    },
    migration: {
      lead: `环境匹配宜「${phase}」`,
      body: `城市/岗位环境宜补用神「${yong}」、避忌神「${ji}」过重场域。${dayunLabel}。${scoreBit}。`,
      action: `先列「城市/岗位/通勤」三列对比，对齐「${yong}」；重大搬迁窗口参考 ${best}`,
      risk: `${risk} 不宜一次性重迁；「${ji}」环境先短访再决定`,
    },
    timing: {
      lead: `时序判断偏「${phase}」`,
      body: `阶段窗口以引擎 K 线与${dayunLabel}为准，用神「${yong}」决定推进强度。${scoreBit}。`,
      action: `把接下来 90 天压成「推进 / 观察 / 防守」三段；优先推进窗口 ${best}`,
      risk: `高压窗 ${risk} 只做维护不扩面；忌神「${ji}」年少开终局动作`,
    },
    application: {
      lead: `应用判断偏「${phase}」`,
      body: `择时与落地动作对齐用神「${yong}」与${dayunLabel}。${scoreBit}。`,
      action: `选定一个真实场景（面试/签约/启程）做窗口对照：优先 ${best}`,
      risk: `${risk} 改为备选日；「${ji}」日少做不可逆决定`,
    },
    general: {
      lead: `综合节奏偏「${phase}」`,
      body: `结构锚：日主用神「${yong}」、忌神「${ji}」、${dayunLabel}（${dayunTone}）。${scoreBit}。`,
      action: `30 天只做一个可验证小动作，顺着「${yong}」；窗口参考 ${best}`,
      risk: `「${ji}」方向少硬推；${risk} 宜收敛`,
    },
  };

  return table[category] || table.general;
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
  const dayunTone = dayunQualityLabel(f.currentDayun?.quality);
  const best =
    pack.engine.kline.windows.find((w) => w.type === 'peak')?.label ||
    pack.engine.kline.windows[0]?.label ||
    `${f.currentYear}年`;
  const risk =
    pack.engine.kline.windows.find((w) => w.type === 'trough')?.label ||
    pack.engine.kline.windows[1]?.label ||
    '高压窗口';
  const tenGods = f.tenGodsStem.length
    ? [...new Set(f.tenGodsStem)].slice(0, 4).join('、')
    : '';

  const themed = themeAction({
    category,
    phase,
    yong,
    ji,
    best,
    risk,
    dayunLabel: dayun,
    dayunTone,
    score,
    tenGods,
  });

  const headline = `${shortTitle || toolTitle}：${themed.lead}${
    score != null ? `（参考 ${score} 分）` : ''
  }`;

  const summary = [
    `基于日主${f.dayMaster || '—'}、用神「${yong}」、${dayun}。`,
    themed.body,
    '本工具按主题投影引擎真值，不是整份报告开场白复述。',
    note ? `补充：${note}` : '',
  ]
    .filter(Boolean)
    .join('');

  const evidence = [
    f.dayMaster ? `日主 ${f.dayMaster} · 格局 ${f.pattern || '—'}` : '',
    `用神 ${yong} · 忌神 ${ji}`,
    dayun,
    score != null ? `${f.currentYear} 主题参考分 ${score}` : '',
    tenGods ? `十神 ${tenGods}` : '',
    best ? `推进窗 ${best}` : '',
    risk ? `谨慎窗 ${risk}` : '',
  ].filter(Boolean);

  const whyItMatches = [
    `该判断来自引擎真值包（${pack.version}）`,
    CATEGORY_TO_DIM[category] ? `，主题可对齐维度 ${CATEGORY_TO_DIM[category]}` : '',
    '；LLM 仅可润色表达，不得改写上述字段。',
  ].join('');

  return {
    headline,
    summary,
    recommendedAction: themed.action,
    riskReminder: themed.risk,
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
  if (s.startsWith('career') || s.includes('job') || s.includes('role-fit')) return 'career';
  if (s.startsWith('wealth') || s.includes('money') || s.includes('invest')) return 'wealth';
  if (s.startsWith('relationship') || s.includes('marriage') || s.includes('love')) {
    return 'relationship';
  }
  if (s.startsWith('health') || s.includes('body') || s.includes('recover')) return 'health';
  if (s.startsWith('family') || s.includes('parent') || s.includes('child')) return 'family';
  if (s.startsWith('migration') || s.includes('city') || s.includes('relocat') || s.includes('move')) {
    return 'migration';
  }
  if (
    s.startsWith('timing') ||
    s === 'daily-sign' ||
    s.includes('yearly-window') ||
    s.includes('window') ||
    s.includes('liunian')
  ) {
    return 'timing';
  }
  if (s.startsWith('application') || s.includes('择日') || s.includes('selection')) {
    return 'application';
  }
  return 'general';
}
