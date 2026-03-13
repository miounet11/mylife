import { REVIEW_SCORE_THRESHOLD } from '@/lib/agentic-report/review/constants';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

export interface VerifyResult {
  consistencyScore: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  failedRules: string[];
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

  if (!context.engine.kline.points.every((item) => item.score >= 20 && item.score <= 95)) {
    failedRules.push('score_bounds');
  }

  if (
    !context.engine.kline.anchorPoints.length ||
    (klineNarrative.summary &&
      !context.engine.kline.anchorPoints.some((item) => klineNarrative.summary.includes(String(item.year))))
  ) {
    failedRules.push('anchor_trend_consistency');
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

  if (bestWindow && !containsAny(strategyAdvisor.summary, [bestWindow])) {
    failedRules.push('best_window_alignment');
  }

  if (context.context.temporal.currentLiuNian && !containsAny(strategyAdvisor.summary, [String(context.context.temporal.currentLiuNian)])) {
    failedRules.push('liunian_alignment');
  }

  if (currentPlace && temporalSpatial.summary && !containsAny(temporalSpatial.summary, [currentPlace])) {
    failedRules.push('geo_place_alignment');
  }

  if (leadIndustry && !containsAny(`${strategyAdvisor.summary}${careerWealth.summary}`, [leadIndustry])) {
    failedRules.push('industry_signal_alignment');
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
    highlights?: string[];
    windows?: Array<{ label?: string }>;
  };
  return {
    summary: [data.summary || '', ...(data.highlights || []), ...(data.windows || []).map((item) => item.label || '')].join(' '),
  };
}

function containsAny(text: string, fragments: string[]) {
  return fragments.some((fragment) => fragment && text.includes(fragment));
}
