import { REVIEW_SCORE_THRESHOLD } from '@/lib/agentic-report/review/constants';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

export interface VerifyResult {
  consistencyScore: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  failedRules: string[];
  /** Soft context omission only — never alone force FAIL */
  softFailedRules?: string[];
  hardFailedRules?: string[];
}

// v5-A6 (2026-05-09): bestWindow / liuNian 改成宽松匹配
// v6-Q1 (2026-08-09): soft vs hard rules — omission of geo/season/industry is WARN not FAIL
// 之前 soft 规则 100% FAIL，用户看到「草稿」却仍标增强版，信任崩塌

function extractWindowKeywords(label: string): string[] {
  if (!label) return [];
  const keywords: string[] = [label];
  const years = label.match(/\d{4}/g) || [];
  keywords.push(...years);
  if (years.length >= 2) {
    keywords.push(`${years[0]}-${years[1]}`);
    keywords.push(`${years[0]}~${years[1]}`);
    keywords.push(`${years[0]}年到${years[1]}年`);
  }
  return keywords.filter(Boolean);
}

function extractLiuNianKeywords(liuNian: string): string[] {
  if (!liuNian) return [];
  const keywords: string[] = [liuNian];
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  for (const s of stems) if (liuNian.includes(s)) keywords.push(s);
  for (const b of branches) if (liuNian.includes(b)) keywords.push(b);
  return keywords;
}

/** Soft rules: context present but agents omitted keywords (not contradiction). */
const SOFT_RULES = new Set([
  'temporal_context_consistency',
  'macro_cycle_alignment',
  'geo_place_alignment',
  'industry_signal_alignment',
  'liunian_alignment',
  'best_window_alignment',
  'geo_climate_consistency',
  'anchor_trend_consistency',
]);

export function runVerify(
  context: StructuredAgenticContext,
  agentResults: Record<string, unknown>,
): VerifyResult {
  const hardFailedRules: string[] = [];
  const softFailedRules: string[] = [];
  const pushSoft = (rule: string) => {
    if (!softFailedRules.includes(rule)) softFailedRules.push(rule);
  };
  const pushHard = (rule: string) => {
    if (!hardFailedRules.includes(rule)) hardFailedRules.push(rule);
  };

  const temporalSpatial = asAgentResult(agentResults.temporal_spatial_advisor);
  const klineNarrative = asAgentResult(agentResults.kline_narrative);
  const strategyAdvisor = asAgentResult(agentResults.strategy_advisor);
  const careerWealth = asAgentResult(agentResults.career_wealth);
  const bestWindow = context.engine.kline.windows[0]?.label || '';
  const leadIndustry = context.context.macroCycles.industryCycle?.[0]?.industry || '';
  const currentPlace =
    context.context.geoClimate.currentPlace || context.context.geoClimate.birthPlace || '';

  const pointAvg = (item: {
    career?: number;
    wealth?: number;
    marriage?: number;
    health?: number;
    score?: number;
  }) => {
    if (typeof item.score === 'number' && Number.isFinite(item.score)) return item.score;
    return (
      (Number(item.career) || 0) +
      (Number(item.wealth) || 0) +
      (Number(item.marriage) || 0) +
      (Number(item.health) || 0)
    ) / 4;
  };
  const points = context.engine.kline.points || [];
  if (
    points.length > 0 &&
    !points.every((item) => {
      const s = pointAvg(item as any);
      return s >= 20 && s <= 95;
    })
  ) {
    pushHard('score_bounds');
  }

  const coreConstitution = asAgentResult(agentResults.core_constitution);
  if (
    !context.engine.kline.anchorPoints.length ||
    (klineNarrative.summary &&
      !context.engine.kline.anchorPoints.some((item) =>
        klineNarrative.summary.includes(String(item.year)),
      ))
  ) {
    if (klineNarrative.summary && /\d{4}/.test(klineNarrative.summary)) {
      pushSoft('anchor_trend_consistency');
    }
  }

  if (!context.context.geoClimate.climateBias?.length) {
    // Missing climate data in context is soft (not agent fault)
    pushSoft('geo_climate_consistency');
  }

  if (!Object.keys(agentResults).length) {
    pushHard('pipeline_consistency');
  }

  // ── Soft context alignment (omission → soft only) ──
  if (
    context.context.temporal.currentSolarTerm &&
    temporalSpatial.summary &&
    !containsAny(temporalSpatial.summary, [
      String(context.context.temporal.currentSolarTerm),
      '立春',
      '节气',
    ])
  ) {
    pushSoft('temporal_context_consistency');
  }

  if (
    context.context.macroCycles.industryCycle?.length &&
    `${strategyAdvisor.summary}${careerWealth.summary}` &&
    !containsAny(
      `${strategyAdvisor.summary}${careerWealth.summary}`,
      context.context.macroCycles.industryCycle.map((item) => item.industry),
    )
  ) {
    pushSoft('macro_cycle_alignment');
  }

  const allAgentText = [
    klineNarrative.summary,
    strategyAdvisor.summary,
    careerWealth.summary,
    asAgentResult(agentResults.relationship_family).summary,
    asAgentResult(agentResults.health_lifestyle).summary,
    asAgentResult(agentResults.core_constitution).summary,
    temporalSpatial.summary,
  ].join(' ');

  if (bestWindow && !containsAny(allAgentText, extractWindowKeywords(bestWindow))) {
    pushSoft('best_window_alignment');
  }

  if (context.context.temporal.currentLiuNian) {
    const liuNian = String(context.context.temporal.currentLiuNian);
    const currentYear = new Date().getFullYear();
    const keywords = [
      ...extractLiuNianKeywords(liuNian),
      String(currentYear),
      String(currentYear + 1),
      '流年',
    ];
    if (!containsAny(allAgentText, keywords)) {
      pushSoft('liunian_alignment');
    }
  }

  if (currentPlace && temporalSpatial.summary && !containsAny(temporalSpatial.summary, [currentPlace])) {
    // Place name omitted — soft (agents often use province/region synonyms)
    pushSoft('geo_place_alignment');
  }

  if (leadIndustry && !containsAny(`${strategyAdvisor.summary}${careerWealth.summary}`, [leadIndustry])) {
    pushSoft('industry_signal_alignment');
  }

  // ── Hard engine fact locks ──
  const constitution = context.engine.constitution;
  const dayMaster = constitution?.dayMaster || '';
  const yongShen = constitution?.yongShen || [];
  const jiShen = constitution?.jiShen || [];
  const coreText = coreConstitution.summary;

  if (dayMaster && coreText && !coreText.includes(dayMaster)) {
    pushHard('day_master_alignment');
  }

  if (yongShen.length && coreText) {
    const yongHit = yongShen.some((el) => el && coreText.includes(el));
    if (!yongHit) pushHard('yong_shen_alignment');
  }

  if (jiShen.length && yongShen.length && coreText) {
    const mentionsJiAsYong = jiShen.some(
      (ji) =>
        ji &&
        (coreText.includes(`用神${ji}`) ||
          coreText.includes(`用神为${ji}`) ||
          coreText.includes(`用神是${ji}`)),
    );
    if (mentionsJiAsYong) pushHard('ji_shen_as_yong_conflict');
  }

  const knownDayun = new Set(
    (context.engine.dayun?.windows || []).map((w) => w.ganZhi).filter(Boolean),
  );
  // 流年 / 四柱 干支不算「编造大运」
  const allowedStemBranch = new Set<string>([
    ...knownDayun,
    ...context.engine.pillars.map((p) => p.ganZhi).filter(Boolean),
    String(context.context.temporal.currentLiuNian || ''),
  ].filter(Boolean));
  if (knownDayun.size > 0) {
    const dayunText = `${careerWealth.summary}${strategyAdvisor.summary}`;
    const claimed =
      dayunText.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g) || [];
    const invented = claimed.filter((gz) => !allowedStemBranch.has(gz));
    // 仅当出现多个未知干支且像大运叙事时才 hard fail（避免流年注入误杀）
    if (invented.length >= 2) {
      pushHard('dayun_invention');
    }
  }

  // Soft-only must not tank score to hard FAIL (was max(50, 100-n*12) → 5 soft = 50 FAIL forever)
  const consistencyScore = Math.max(
    58,
    Math.min(100, 100 - hardFailedRules.length * 14 - softFailedRules.length * 4),
  );

  let verdict: VerifyResult['verdict'];
  if (hardFailedRules.length === 0 && softFailedRules.length === 0) {
    verdict = 'PASS';
  } else if (hardFailedRules.length === 0) {
    // Omission-only → PASS if few soft, else WARN (never FAIL)
    verdict = softFailedRules.length <= 2 && consistencyScore >= 88 ? 'PASS' : 'WARN';
  } else if (consistencyScore >= REVIEW_SCORE_THRESHOLD) {
    verdict = 'WARN';
  } else {
    verdict = 'FAIL';
  }

  // Expose all for UI transparency; soft rules still listed
  const failedRules = [...hardFailedRules, ...softFailedRules];

  return {
    consistencyScore,
    verdict,
    failedRules,
    softFailedRules,
    hardFailedRules,
  };
}

function asAgentResult(value: unknown) {
  const data = (value || {}) as {
    summary?: string;
    constitutionSummary?: string;
    plainReading?: string;
    phasePlain?: string;
    favorableElements?: string[];
    unfavorableElements?: string[];
    highlights?: string[];
    windows?: Array<{ label?: string }>;
  };
  return {
    summary: [
      data.summary || '',
      data.constitutionSummary || '',
      data.plainReading || '',
      data.phasePlain || '',
      ...(data.favorableElements || []),
      ...(data.unfavorableElements || []),
      ...(data.highlights || []),
      ...(data.windows || []).map((item) => item.label || ''),
    ].join(' '),
  };
}

function containsAny(text: string, fragments: string[]) {
  return fragments.some((fragment) => fragment && text.includes(fragment));
}
