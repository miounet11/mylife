import { CORE_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

export interface ReviewConflict {
  id: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface ReviewResult {
  conflicts: ReviewConflict[];
  repairPlan: {
    totalConflicts: number;
    actions: Array<{ order: number; action: string; reason: string }>;
  };
  patches: Record<string, unknown>;
  consistencyScore: number;
}

export function runReview(context: StructuredAgenticContext, agentResults: Record<string, unknown>): ReviewResult {
  const conflicts: ReviewConflict[] = [];
  const temporal = context.context.temporal;
  const resultKeys = Object.keys(agentResults);
  const missingAgents = CORE_AGENT_KEYS.filter((key) => !resultKeys.includes(key));
  const temporalSpatial = asAgentResult(agentResults.temporal_spatial_advisor);
  const strategy = asAgentResult(agentResults.strategy_advisor);
  const kline = asAgentResult(agentResults.kline_narrative);
  const careerWealth = asAgentResult(agentResults.career_wealth);
  const leadIndustry = context.context.macroCycles.industryCycle?.[0]?.industry || '';
  const currentPlace = context.context.geoClimate.currentPlace || context.context.geoClimate.birthPlace || '';
  const bestWindow = context.engine.kline.windows[0]?.label || '';

  if (!context.engine.kline.anchorPoints.length) {
    conflicts.push({
      id: 'conflict_missing_kline_anchors',
      type: 'PIPELINE_INCONSISTENCY',
      severity: 'MEDIUM',
      explanation: '当前报告缺少K线锚点，后续叙事无法统一对齐。',
    });
  }

  if (!temporal.currentSolarTerm) {
    conflicts.push({
      id: 'conflict_missing_solar_term',
      type: 'TEMPORAL_CONTEXT_MISMATCH',
      severity: 'LOW',
      explanation: '当前时序上下文缺少节气信号，时空建议完整性不足。',
    });
  }

  if (!Object.keys(agentResults).length) {
    conflicts.push({
      id: 'conflict_missing_agent_results',
      type: 'PIPELINE_INCONSISTENCY',
      severity: 'MEDIUM',
      explanation: '并发专家输出为空，只能退回基础引擎解释。',
    });
  }

  if (missingAgents.length > 0) {
    conflicts.push({
      id: 'conflict_missing_agents',
      type: 'PIPELINE_INCONSISTENCY',
      severity: missingAgents.length >= 3 ? 'MEDIUM' : 'LOW',
      explanation: `缺少以下专家层输出：${missingAgents.join('、')}。`,
    });
  }

  if (temporal.currentSolarTerm && temporalSpatial.summary && !containsAny(temporalSpatial.summary, [String(temporal.currentSolarTerm), '立春', '节气'])) {
    conflicts.push({
      id: 'conflict_temporal_signal_omitted',
      type: 'TEMPORAL_CONTEXT_MISMATCH',
      severity: 'LOW',
      explanation: '天时地利人和顾问没有显式引用当前节气或立春边界。',
    });
  }

  if (context.context.spatialFactors.favorableDirections.length > 0 && temporalSpatial.summary) {
    const hasDirection = context.context.spatialFactors.favorableDirections.some((direction) => temporalSpatial.summary.includes(direction));
    if (!hasDirection) {
      conflicts.push({
        id: 'conflict_spatial_signal_omitted',
        type: 'GEO_ENVIRONMENT_MISMATCH',
        severity: 'LOW',
        explanation: '天时地利人和顾问没有显式引用当前有利方位。',
      });
    }
  }

  if (currentPlace && temporalSpatial.summary && !temporalSpatial.summary.includes(currentPlace)) {
    conflicts.push({
      id: 'conflict_geo_place_omitted',
      type: 'GEO_ENVIRONMENT_MISMATCH',
      severity: 'LOW',
      explanation: '天时地利人和顾问没有显式引用当前所在城市或地理环境。',
    });
  }

  if (context.engine.kline.anchorPoints.length > 0 && kline.summary) {
    const years = context.engine.kline.anchorPoints.map((item) => String(item.year));
    if (!containsAny(kline.summary, years)) {
      conflicts.push({
        id: 'conflict_kline_anchor_not_used',
        type: 'KLINE_TREND_MISMATCH',
        severity: 'MEDIUM',
        explanation: '人生K线专家没有显式引用任何关键锚点年份。',
      });
    }
  }

  if (bestWindow && !containsAny(strategy.summary, [bestWindow]) && !strategy.windows.some((item) => item.label === bestWindow)) {
    conflicts.push({
      id: 'conflict_best_window_not_used',
      type: 'KLINE_TREND_MISMATCH',
      severity: 'MEDIUM',
      explanation: '策略顾问没有显式对齐当前 K 线最高优先窗口。',
    });
  }

  if (strategy.windows.length > 0 && !strategy.windows.every((item) => isKnownWindow(item.label, context))) {
    conflicts.push({
      id: 'conflict_unknown_strategy_windows',
      type: 'PIPELINE_INCONSISTENCY',
      severity: 'MEDIUM',
      explanation: '策略顾问输出了未在引擎窗口中出现的时间窗口标签。',
    });
  }

  if (leadIndustry && !containsAny(`${strategy.summary}${careerWealth.summary}`, [leadIndustry])) {
    conflicts.push({
      id: 'conflict_macro_cycle_omitted',
      type: 'TEMPORAL_CONTEXT_MISMATCH',
      severity: 'LOW',
      explanation: '事业财富或策略顾问没有显式引用当前行业周期信号。',
    });
  }

  if (temporal.currentLiuNian && !containsAny(strategy.summary, [String(temporal.currentLiuNian)])) {
    conflicts.push({
      id: 'conflict_liunian_not_used',
      type: 'TEMPORAL_CONTEXT_MISMATCH',
      severity: 'LOW',
      explanation: '策略顾问没有显式引用当前流年信号。',
    });
  }

  const consistencyScore = Math.max(55, 100 - conflicts.reduce((sum, item) => {
    if (item.severity === 'HIGH') return sum + 18;
    if (item.severity === 'MEDIUM') return sum + 10;
    return sum + 4;
  }, 0));

  return {
    conflicts,
    repairPlan: {
      totalConflicts: conflicts.length,
      actions: conflicts.map((conflict, index) => ({
        order: index + 1,
        action: conflict.type === 'PIPELINE_INCONSISTENCY' ? 'APPLY_PATCH' : 'NORMALIZE_STYLE',
        reason: conflict.explanation,
      })),
    },
    patches: {},
    consistencyScore,
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
    windows: (data.windows || []).map((item) => ({ label: item.label || '' })),
  };
}

function containsAny(text: string, fragments: string[]) {
  return fragments.some((fragment) => fragment && text.includes(fragment));
}

function isKnownWindow(label: string, context: StructuredAgenticContext) {
  const labels = [
    ...context.engine.kline.windows.map((item) => item.label),
    ...context.engine.dayun.windows.map((item) => item.label),
  ];
  return labels.includes(label);
}
