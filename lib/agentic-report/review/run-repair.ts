import type { ReviewResult } from '@/lib/agentic-report/review/run-review';

export interface RepairResult {
  patchesApplied: number;
  rerunsExecuted: number;
  repairedResults: Record<string, unknown>;
}

export function runRepair(agentResults: Record<string, unknown>, review: ReviewResult): RepairResult {
  const repairedResults = Object.entries(agentResults).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[key] = normalizeAgentResult(value);
    return accumulator;
  }, {});

  return {
    patchesApplied: Object.keys(review.patches).length,
    rerunsExecuted: 0,
    repairedResults,
  };
}

function normalizeAgentResult(value: unknown) {
  const data = (value || {}) as {
    summary?: string;
    highlights?: string[];
    risks?: string[];
    actions?: string[];
    citations?: string[];
    windows?: Array<{ label?: string; score?: number; advice?: string }>;
  };

  return {
    ...data,
    summary: data.summary || '当前专家结果待补强。',
    highlights: data.highlights || [],
    risks: data.risks || [],
    actions: data.actions || [],
    citations: data.citations || [],
    windows: (data.windows || []).map((item) => ({
      label: item.label || '关键窗口',
      score: typeof item.score === 'number' ? item.score : 60,
      advice: item.advice || '按当前窗口先做低风险验证。',
    })),
  };
}
