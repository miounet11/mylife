import type { ReviewResult } from '@/lib/agentic-report/review/run-review';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';
import { sanitizeAdviceTiming } from '@/lib/advice-timing-filter';

export interface RepairResult {
  patchesApplied: number;
  rerunsExecuted: number;
  repairedResults: Record<string, unknown>;
  factLocksApplied: number;
}

// v5-D48 强 timing 锚契约的 agent
const TIMING_ANCHOR_AGENTS = new Set(['strategy_advisor', 'temporal_spatial_advisor']);

export function runRepair(
  agentResults: Record<string, unknown>,
  review: ReviewResult,
  context?: StructuredAgenticContext,
): RepairResult {
  let factLocksApplied = 0;

  const repairedResults = Object.entries(agentResults).reduce<Record<string, unknown>>(
    (accumulator, [key, value]) => {
      let next = normalizeAgentResult(key, value);
      if (context) {
        const locked = applyEngineFactLocks(key, next, context, review);
        factLocksApplied += locked.patches;
        next = locked.data;
      }
      accumulator[key] = next;
      return accumulator;
    },
    {},
  );

  // Strategy windows: force onto known engine labels when review flagged invent
  if (context && review.conflicts.some((c) => c.id === 'conflict_unknown_strategy_windows')) {
    const strategy = repairedResults.strategy_advisor as
      | { windows?: Array<{ label?: string; score?: number; advice?: string }> }
      | undefined;
    if (strategy?.windows?.length) {
      const allowed = collectEngineWindowLabels(context);
      strategy.windows = strategy.windows.map((w) => {
        if (w.label && allowed.has(w.label)) return w;
        factLocksApplied += 1;
        const fallback = [...allowed][0] || '关键窗口';
        return {
          ...w,
          label: fallback,
          advice: w.advice || '已对齐引擎窗口标签。',
        };
      });
      repairedResults.strategy_advisor = strategy;
    }
  }

  // Kline years off-anchor: drop offending peak/trough years
  if (context && review.conflicts.some((c) => c.id === 'conflict_kline_year_off_anchor')) {
    const kline = repairedResults.kline_narrative as
      | {
          peakYears?: Array<{ year?: number; label?: string }>;
          troughYears?: Array<{ year?: number; label?: string }>;
        }
      | undefined;
    if (kline) {
      const valid = new Set(context.engine.kline.anchorPoints.map((a) => a.year));
      const filterYears = (rows?: Array<{ year?: number; label?: string }>) =>
        (rows || []).filter((row) => typeof row.year === 'number' && valid.has(row.year as number));
      const before =
        (kline.peakYears?.length || 0) + (kline.troughYears?.length || 0);
      kline.peakYears = filterYears(kline.peakYears);
      kline.troughYears = filterYears(kline.troughYears);
      const after =
        (kline.peakYears?.length || 0) + (kline.troughYears?.length || 0);
      if (after < before) factLocksApplied += 1;
      // If emptied, rehydrate from anchors
      if (!kline.peakYears?.length) {
        kline.peakYears = context.engine.kline.anchorPoints
          .filter((a) => a.type === 'peak')
          .slice(0, 3)
          .map((a) => ({ year: a.year, label: String(a.year) }));
        factLocksApplied += 1;
      }
      if (!kline.troughYears?.length) {
        kline.troughYears = context.engine.kline.anchorPoints
          .filter((a) => a.type === 'trough')
          .slice(0, 3)
          .map((a) => ({ year: a.year, label: String(a.year) }));
        factLocksApplied += 1;
      }
      repairedResults.kline_narrative = kline;
    }
  }

  return {
    patchesApplied: Object.keys(review.patches).length + factLocksApplied,
    rerunsExecuted: 0,
    repairedResults,
    factLocksApplied,
  };
}

function collectEngineWindowLabels(context: StructuredAgenticContext): Set<string> {
  return new Set([
    ...context.engine.kline.windows.map((w) => w.label),
    ...context.engine.dayun.windows.map(
      (w) => w.ganZhi || `${w.startAge}-${w.endAge}`,
    ),
  ].filter(Boolean));
}

function applyEngineFactLocks(
  agentKey: string,
  data: Record<string, unknown>,
  context: StructuredAgenticContext,
  review: ReviewResult,
): { data: Record<string, unknown>; patches: number } {
  let patches = 0;
  const next = { ...data };
  const yong = context.engine.constitution.yongShen || [];
  const xi = context.engine.constitution.xiShen || [];
  const ji = context.engine.constitution.jiShen || [];
  const allowedFavorable = new Set([...yong, ...xi]);
  const jiSet = new Set(ji);
  const dayMaster = context.engine.constitution.dayMaster || '';

  if (agentKey === 'core_constitution') {
    const favorable = Array.isArray(next.favorableElements)
      ? (next.favorableElements as string[])
      : [];
    if (favorable.length && allowedFavorable.size) {
      const cleaned = favorable.filter((el) => allowedFavorable.has(el) && !jiSet.has(el));
      if (cleaned.length !== favorable.length) {
        next.favorableElements = cleaned.length ? cleaned : [...yong];
        patches += 1;
      }
    } else if (!favorable.length && yong.length) {
      next.favorableElements = [...yong];
      patches += 1;
    }

    const unfavorable = Array.isArray(next.unfavorableElements)
      ? (next.unfavorableElements as string[])
      : [];
    if (!unfavorable.length && ji.length) {
      next.unfavorableElements = [...ji];
      patches += 1;
    }

    // Ensure day master appears in summary fields
    const summaryKey = typeof next.constitutionSummary === 'string'
      ? 'constitutionSummary'
      : typeof next.summary === 'string'
        ? 'summary'
        : null;
    if (
      summaryKey &&
      dayMaster &&
      !String(next[summaryKey]).includes(dayMaster)
    ) {
      next[summaryKey] = `日主${dayMaster}。${next[summaryKey]}`;
      patches += 1;
    }
  }

  // Soft: if yong/ji conflict was flagged, force avoidNow alignment on strategy
  if (
    agentKey === 'strategy_advisor' &&
    review.conflicts.some((c) => c.type === 'YONG_SHEN_CONFLICT')
  ) {
    if (ji[0] && typeof next.avoidNow === 'string' && !String(next.avoidNow).includes(ji[0])) {
      next.avoidNow = `忌神「${ji.join('、')}」方向少硬推；${next.avoidNow}`;
      patches += 1;
    }
  }

  return { data: next, patches };
}

function normalizeAgentResult(agentKey: string, value: unknown) {
  const data = (value || {}) as {
    summary?: string;
    highlights?: string[];
    risks?: string[];
    actions?: string[];
    citations?: string[];
    windows?: Array<{ label?: string; score?: number; advice?: string }>;
    [key: string]: unknown;
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
