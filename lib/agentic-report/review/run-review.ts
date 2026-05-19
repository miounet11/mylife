import { AGENT_DEPENDENCIES, CORE_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
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

/**
 * v2 review：与新版 prompt（lib/prompts/agentic/*）配套。
 *
 * 设计变化：
 * - 老版 review 把"年份/方位/城市/节气是否被引用"全部当 conflict 扣分。
 *   新版 prompt 已把这些前置为 hardConstraints，模型违反就是真错。
 * - 因此 review 拆成两层：
 *   1) HARD 兜底：与引擎真值不一致 / 输出 schema 缺字段 → HIGH 扣分。
 *   2) SOFT 提示：风格层（节气、方位、城市未引用）→ LOW 扣分，仅作信号。
 * - 保持 ReviewResult 接口不变，向后兼容 runRepair / runVerify / 测试。
 */
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

  // ===== HARD 兜底层：管道完整性 + 引擎真值一致性 =====

  if (!context.engine.kline.anchorPoints.length) {
    conflicts.push({
      id: 'conflict_missing_kline_anchors',
      type: 'PIPELINE_INCONSISTENCY',
      severity: 'MEDIUM',
      explanation: '当前报告缺少K线锚点，后续叙事无法统一对齐。',
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

  // 策略顾问的 windows.label 必须来自引擎 —— 这是 strategy_advisor v2 的硬约束 H2。
  // 若违反说明模型没有遵守 prompt，需要触发 repair。
  if (strategy.windows.length > 0 && !strategy.windows.every((item) => isKnownWindow(item.label, context))) {
    conflicts.push({
      id: 'conflict_unknown_strategy_windows',
      type: 'PIPELINE_INCONSISTENCY',
      severity: 'MEDIUM',
      explanation: '策略顾问输出了未在引擎窗口中出现的时间窗口标签（违反 strategy_advisor v2 H2）。',
    });
  }

  // K 线专家 peakYears/troughYears 的 year 必须来自锚点 —— kline_narrative v2 的硬约束 H2。
  const klineRaw = agentResults.kline_narrative as
    | { peakYears?: Array<{ year?: number }>; troughYears?: Array<{ year?: number }> }
    | undefined;
  if (klineRaw && context.engine.kline.anchorPoints.length > 0) {
    const validYears = new Set(context.engine.kline.anchorPoints.map((a) => a.year));
    const offending = [
      ...(klineRaw.peakYears || []).map((p) => p.year),
      ...(klineRaw.troughYears || []).map((p) => p.year),
    ].filter((y) => typeof y === 'number' && !validYears.has(y as number));
    if (offending.length) {
      conflicts.push({
        id: 'conflict_kline_year_off_anchor',
        type: 'KLINE_TREND_MISMATCH',
        severity: 'HIGH',
        explanation: `人生K线专家输出了非引擎锚点年份：${offending.join('、')}（违反 kline_narrative v2 H2）。`,
      });
    }
  }

  // ===== SOFT 提示层：风格信号未引用，作为 repair 输入但不致命 =====

  if (!temporal.currentSolarTerm) {
    conflicts.push({
      id: 'conflict_missing_solar_term',
      type: 'TEMPORAL_CONTEXT_MISMATCH',
      severity: 'LOW',
      explanation: '当前时序上下文缺少节气信号，时空建议完整性不足。',
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

  // ===== P3 DAG 仲裁层：下游 agent 的 windows.label 必须出现在上游或引擎窗口集合内 =====
  // 规则：对每个下游 agent，允许的窗口标签 = 引擎窗口 ∪ 它依赖的所有上游 agent 的 windows.label。
  // 违反则 MEDIUM 扣分，并在 explanation 里点名上游集合，方便 repair 收敛。
  const engineWindowLabels = new Set([
    ...context.engine.kline.windows.map((w) => w.label),
    ...context.engine.dayun.windows.map((w) => w.label),
  ]);
  for (const key of CORE_AGENT_KEYS) {
    const meta = AGENT_DEPENDENCIES[key];
    if (!meta.dependsOn.length) continue; // wave 0 不参与下游仲裁
    const own = agentResults[key] as { windows?: Array<{ label?: string }> } | undefined;
    if (!own?.windows?.length) continue;
    const allowed = new Set(engineWindowLabels);
    for (const upKey of meta.dependsOn) {
      const up = agentResults[upKey] as { windows?: Array<{ label?: string }> } | undefined;
      up?.windows?.forEach((w) => w.label && allowed.add(w.label));
    }
    const offending = own.windows
      .map((w) => w.label || '')
      .filter((label) => label && !allowed.has(label));
    if (offending.length) {
      conflicts.push({
        id: `conflict_dag_window_mismatch_${key}`,
        type: 'PIPELINE_INCONSISTENCY',
        severity: 'MEDIUM',
        explanation: `下游 ${key} 输出了不在上游 [${meta.dependsOn.join(',')}] 或引擎窗口中的标签：${offending.join('、')}。按 DAG 仲裁应以上游为准。`,
      });
    }
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
