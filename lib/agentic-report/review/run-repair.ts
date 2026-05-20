import type { ReviewResult } from '@/lib/agentic-report/review/run-review';
import { sanitizeAdviceTiming } from '@/lib/advice-timing-filter';

export interface RepairResult {
  patchesApplied: number;
  rerunsExecuted: number;
  repairedResults: Record<string, unknown>;
}

// v5-D48 强 timing 锚契约的 agent（与 prompts/agentic/{strategy,temporal-spatial}-advisor v3-2026-05-20 对齐）
// 其余 agent 的 actions 不强制时间锚（也不会被 40 字上限误伤），故只在这两个 agent 上 runtime 兜底
const TIMING_ANCHOR_AGENTS = new Set(['strategy_advisor', 'temporal_spatial_advisor']);

export function runRepair(agentResults: Record<string, unknown>, review: ReviewResult): RepairResult {
  const repairedResults = Object.entries(agentResults).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[key] = normalizeAgentResult(key, value);
    return accumulator;
  }, {});

  return {
    patchesApplied: Object.keys(review.patches).length,
    rerunsExecuted: 0,
    repairedResults,
  };
}

function normalizeAgentResult(agentKey: string, value: unknown) {
  const data = (value || {}) as {
    summary?: string;
    highlights?: string[];
    risks?: string[];
    actions?: string[];
    citations?: string[];
    windows?: Array<{ label?: string; score?: number; advice?: string }>;
  };

  const rawActions = data.actions || [];
  const actions = TIMING_ANCHOR_AGENTS.has(agentKey) ? sanitizeAdviceTiming(rawActions) : rawActions;

  return {
    ...data,
    summary: data.summary || '当前专家结果待补强。',
    highlights: data.highlights || [],
    risks: data.risks || [],
    actions,
    citations: data.citations || [],
    windows: (data.windows || []).map((item) => ({
      label: item.label || '关键窗口',
      score: typeof item.score === 'number' ? item.score : 60,
      advice: item.advice || '按当前窗口先做低风险验证。',
    })),
  };
}
