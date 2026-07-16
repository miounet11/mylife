import { REVIEW_SCORE_THRESHOLD } from '@/lib/agentic-report/review/constants';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

export interface VerifyResult {
  consistencyScore: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  failedRules: string[];
}

// v5-A6 (2026-05-09): bestWindow / liuNian 改成宽松匹配
// 之前用算法生成的 "2016-2020阶段" 严格 includes 验 LLM 自然语言，30 天 78% 报告必 fail
// 现在按 (1) 4位年份 (2) 天干地支字面 (3) 阶段关键词 任一命中即算对齐
function extractWindowKeywords(label: string): string[] {
  if (!label) return [];
  const keywords: string[] = [label];
  // 抽取 4 位年份范围 "2016-2020阶段" → ["2016", "2020"]
  const years = label.match(/\d{4}/g) || [];
  keywords.push(...years);
  // 部分阶段关键词
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
  // 天干地支 "丙午" → ["丙", "午", "丙午"]
  const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  for (const s of stems) if (liuNian.includes(s)) keywords.push(s);
  for (const b of branches) if (liuNian.includes(b)) keywords.push(b);
  return keywords;
}

export function runVerify(context: StructuredAgenticContext, agentResults: Record<string, unknown>) : VerifyResult {
  const failedRules: string[] = [];
  const temporalSpatial = asAgentResult(agentResults.temporal_spatial_advisor);
  const klineNarrative = asAgentResult(agentResults.kline_narrative);
  const strategyAdvisor = asAgentResult(agentResults.strategy_advisor);
  const careerWealth = asAgentResult(agentResults.career_wealth);
  const bestWindow = context.engine.kline.windows[0]?.label || '';
  const leadIndustry = context.context.macroCycles.industryCycle?.[0]?.industry || '';
  const currentPlace = context.context.geoClimate.currentPlace || context.context.geoClimate.birthPlace || '';

  // KlinePointV6 has career/wealth/marriage/health — not a single `score` field
  const pointAvg = (item: { career?: number; wealth?: number; marriage?: number; health?: number; score?: number }) => {
    if (typeof item.score === 'number' && Number.isFinite(item.score)) return item.score;
    return (
      (Number(item.career) || 0) +
      (Number(item.wealth) || 0) +
      (Number(item.marriage) || 0) +
      (Number(item.health) || 0)
    ) / 4;
  };
  const points = context.engine.kline.points || [];
  if (points.length > 0 && !points.every((item) => {
    const s = pointAvg(item as any);
    return s >= 20 && s <= 95;
  })) {
    failedRules.push('score_bounds');
  }

  const coreConstitution = asAgentResult(agentResults.core_constitution);
  if (
    !context.engine.kline.anchorPoints.length ||
    (klineNarrative.summary &&
      !context.engine.kline.anchorPoints.some((item) => klineNarrative.summary.includes(String(item.year))))
  ) {
    // Only fail when narrative claims years but none match anchors
    if (klineNarrative.summary && /\d{4}/.test(klineNarrative.summary)) {
      failedRules.push('anchor_trend_consistency');
    }
  }

  if (!context.context.geoClimate.climateBias?.length) {
    failedRules.push('geo_climate_consistency');
  }

  if (!Object.keys(agentResults).length) {
    failedRules.push('pipeline_consistency');
  }

  if (
    context.context.temporal.currentSolarTerm &&
    temporalSpatial.summary &&
    !containsAny(temporalSpatial.summary, [String(context.context.temporal.currentSolarTerm), '立春', '节气'])
  ) {
    failedRules.push('temporal_context_consistency');
  }

  if (
    context.context.macroCycles.industryCycle?.length &&
    `${strategyAdvisor.summary}${careerWealth.summary}` &&
    !containsAny(
      `${strategyAdvisor.summary}${careerWealth.summary}`,
      context.context.macroCycles.industryCycle.map((item) => item.industry)
    )
  ) {
    failedRules.push('macro_cycle_alignment');
  }

  // v5-A6 (2026-05-09): 拼接所有 agent summary 作为大检查池，避免单 agent 漏关键词就 fail
  const allAgentText = [
    klineNarrative.summary,
    strategyAdvisor.summary,
    careerWealth.summary,
    asAgentResult(agentResults.relationship_family).summary,
    asAgentResult(agentResults.health_lifestyle).summary,
    asAgentResult(agentResults.core_constitution).summary,
    temporalSpatial.summary,
  ].join(' ');

  // v5-A6: 宽松匹配 — 提取年份/范围作为关键词集合
  if (bestWindow && !containsAny(allAgentText, extractWindowKeywords(bestWindow))) {
    failedRules.push('best_window_alignment');
  }

  // v5-A6: 流年宽松匹配 — 干支或字面或对应年份任一命中即算
  if (context.context.temporal.currentLiuNian) {
    const liuNian = String(context.context.temporal.currentLiuNian);
    const currentYear = new Date().getFullYear();
    const keywords = [...extractLiuNianKeywords(liuNian), String(currentYear), String(currentYear + 1)];
    if (!containsAny(allAgentText, keywords)) {
      failedRules.push('liunian_alignment');
    }
  }

  if (currentPlace && temporalSpatial.summary && !containsAny(temporalSpatial.summary, [currentPlace])) {
    failedRules.push('geo_place_alignment');
  }

  if (leadIndustry && !containsAny(`${strategyAdvisor.summary}${careerWealth.summary}`, [leadIndustry])) {
    failedRules.push('industry_signal_alignment');
  }

  // ── Engine fact locks (yongShen / dayMaster / dayun) ──
  const constitution = context.engine.constitution;
  const dayMaster = constitution?.dayMaster || '';
  const yongShen = constitution?.yongShen || [];
  const jiShen = constitution?.jiShen || [];
  const coreText = coreConstitution.summary;

  if (dayMaster && coreText && !coreText.includes(dayMaster)) {
    failedRules.push('day_master_alignment');
  }

  if (yongShen.length && coreText) {
    const yongHit = yongShen.some((el) => el && coreText.includes(el));
    if (!yongHit) failedRules.push('yong_shen_alignment');
  }

  // 忌神不得被核心结构说成主用方向
  if (jiShen.length && yongShen.length && coreText) {
    const mentionsJiAsYong = jiShen.some(
      (ji) =>
        ji &&
        (coreText.includes(`用神${ji}`) ||
          coreText.includes(`用神为${ji}`) ||
          coreText.includes(`用神是${ji}`)),
    );
    if (mentionsJiAsYong) failedRules.push('ji_shen_as_yong_conflict');
  }

  const knownDayun = new Set(
    (context.engine.dayun?.windows || []).map((w) => w.ganZhi).filter(Boolean),
  );
  if (knownDayun.size > 0) {
    const dayunText = `${careerWealth.summary}${strategyAdvisor.summary}`;
    // Extract 干支 pairs from agent text and flag invented ones that look like 大运 claims
    const claimed = dayunText.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g) || [];
    const invented = claimed.filter((gz) => !knownDayun.has(gz) && !context.engine.pillars.some((p) => p.ganZhi === gz));
    // Only fail when agents invent multiple unknown stems that aren't pillars either
    if (invented.length >= 2) {
      failedRules.push('dayun_invention');
    }
  }

  const consistencyScore = Math.max(50, 100 - failedRules.length * 12);
  const verdict = failedRules.length === 0
    ? 'PASS'
    : consistencyScore >= REVIEW_SCORE_THRESHOLD
      ? 'WARN'
      : 'FAIL';

  return {
    consistencyScore,
    verdict,
    failedRules,
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
