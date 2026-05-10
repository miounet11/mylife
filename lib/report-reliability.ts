import type { FortuneAnalysisResult } from '@/lib/user-types';

export type ReportReliabilityStatus = 'passed' | 'conservative';

export interface ReportReliabilityGuard {
  status: ReportReliabilityStatus;
  score: number;
  reasons: string[];
  conservativeDelivery: boolean;
  suppressedTimingAdvice: boolean;
  summary: string;
}

const VERIFY_FAIL_SCORE = 45;
const VERIFY_WARN_SCORE = 18;
const LOW_AGENT_SUCCESS_SCORE = 12;
const MISSING_LLM_SCORE = 10;
const BASIC_TIER_SCORE = 8;
const LOW_QUALITY_SCORE = 15;
const HARD_FAIL_THRESHOLD = 25;

export function assessReportReliability(result: FortuneAnalysisResult): ReportReliabilityGuard {
  const verifyVerdict = result.analysis?.verify?.verdict;
  const verifyScore = result.analysis?.verify?.consistencyScore ?? 0;
  const agentSuccessRate = result.analysis?.orchestration?.successRate ?? 0;
  const llmUsed = result.analysis?.llmUsed === true;
  const providerHealthDeferred = result.analysis?.providerHealthDeferred === true;
  const qualityStatus = result.analysis?.qualityAudit?.status;
  const deliveryTier = result.analysis?.qualityAudit?.deliveryTier;

  // v5-A7 (2026-05-09): llmUsed 只代表 structure phase，但 agent LLM 成功时 fortune.interaction / explanation
  // 都有真实 LLM 内容，也应视为"LLM 真用上了"。避免 structure 失败但 agent 全成功时被降级
  const agentSources = (result.analysis?.orchestration?.agentSources || {}) as Record<string, string>;
  const agentLlmHits = Object.values(agentSources).filter((v) => v === 'llm').length;
  const anyLlmUsed = llmUsed || agentLlmHits >= 2;

  let score = 100;
  const reasons: string[] = [];

  if (verifyVerdict === 'FAIL') {
    score -= VERIFY_FAIL_SCORE;
    reasons.push('一致性校验失败，短期时机与结论存在明显漂移风险。');
  } else if (verifyVerdict === 'WARN') {
    score -= VERIFY_WARN_SCORE;
    reasons.push('一致性校验处于观察级，短期窗口建议需要保守处理。');
  }

  if (!anyLlmUsed && !providerHealthDeferred) {
    score -= MISSING_LLM_SCORE;
    reasons.push('未拿到稳定增强正文，解释层可靠性偏弱。');
  }

  if (agentSuccessRate > 0 && agentSuccessRate < 0.5) {
    score -= LOW_AGENT_SUCCESS_SCORE;
    reasons.push('专家协同成功率偏低，本次主要依赖规则化回退结果。');
  }

  if (qualityStatus === 'retry') {
    score -= LOW_QUALITY_SCORE;
    reasons.push('质量审计建议重算，当前不适合直接按高置信版本交付。');
  }

  if (deliveryTier === 'basic' && verifyVerdict !== 'PASS') {
    score -= BASIC_TIER_SCORE;
    reasons.push('当前交付层级偏基础版，应避免给出过强时机判断。');
  }

  // v5-A6+A7 (2026-05-09): guard 改成"严格 FAIL 且 LLM 真未成功"双条件
  // 之前单 verify==FAIL 就降级，30 天 60% 报告被误杀；改成必须 LLM 没用上 / agent 半数失败 / score 极低 三条任一
  // v5-A7: llmTrulyUnavailable 现在用 anyLlmUsed（structure || agent ≥2 命中）
  const llmTrulyUnavailable = !anyLlmUsed && !providerHealthDeferred;
  const conservativeDelivery = score < HARD_FAIL_THRESHOLD
    || (verifyVerdict === 'FAIL' && llmTrulyUnavailable)
    || (verifyVerdict === 'FAIL' && agentSuccessRate > 0 && agentSuccessRate < 0.5)
    || (qualityStatus === 'retry' && llmTrulyUnavailable);
  // suppressedTimingAdvice 只在真正信号不全时压制 timing；之前 score<85 太松，现在 score<70 才压制
  const suppressedTimingAdvice = conservativeDelivery || (verifyVerdict === 'WARN' && verifyScore < 70);

  return {
    status: conservativeDelivery ? 'conservative' : 'passed',
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    conservativeDelivery,
    suppressedTimingAdvice,
    summary: conservativeDelivery
      ? '本次报告已切换为保守交付，只保留稳定结构判断，不直接放大短期时机建议。'
      : suppressedTimingAdvice
      ? '本次报告整体可用，但短期时机建议已按保守口径收敛。'
      : '本次报告通过可靠性交付门槛，可按正常增强版结果使用。',
  };
}

export function applyReliabilityGuard(result: FortuneAnalysisResult): FortuneAnalysisResult {
  const guard = assessReportReliability(result);

  if (guard.status === 'passed' && !guard.suppressedTimingAdvice) {
    return {
      ...result,
      analysis: {
        ...(result.analysis || {}),
        reliabilityGuard: guard,
      },
    };
  }

  const next = {
    ...result,
    advice: {
      ...(result.advice || {}),
      career: sanitizeTimingAdvice(result.advice?.career, guard),
      wealth: sanitizeTimingAdvice(result.advice?.wealth, guard),
      marriage: sanitizeTimingAdvice(result.advice?.marriage, guard),
      health: sanitizeTimingAdvice(result.advice?.health, guard),
      timing: guard.suppressedTimingAdvice
        ? ['当前先按保守节奏处理，等更多现实反馈后再细化窗口。']
        : result.advice?.timing || [],
    },
    analysis: {
      ...(result.analysis || {}),
      opening: guard.conservativeDelivery
        ? '这份结果先按保守口径交付，更适合看稳定结构，不适合把短期窗口当成硬结论。'
        : result.analysis?.opening || '',
      summary: guard.conservativeDelivery
        ? '先看命局结构和长期代价，不放大短期时机；关键动作宜小步验证，再看反馈。'
        : `${result.analysis?.summary || ''}${result.analysis?.summary ? '\n\n' : ''}当前短期窗口建议已按保守口径收敛，请优先参考稳定结构判断。`,
      explanation: guard.conservativeDelivery
        ? buildConservativeExplanation(result, guard)
        : `${result.analysis?.explanation || ''}\n\n补充说明：当前短期时机建议已按保守口径收敛，请先用小步验证代替一次性押注。`,
      reliabilityGuard: guard,
    },
  } as FortuneAnalysisResult;

  return next;
}

function sanitizeTimingAdvice<T extends { timing?: string; specific?: string[] } | undefined>(
  advice: T,
  guard: ReportReliabilityGuard
): T {
  if (!advice) {
    return advice;
  }

  return {
    ...advice,
    timing: guard.suppressedTimingAdvice
      ? '当前先按保守节奏处理，不把单一时间窗口当成确定结论。'
      : advice.timing,
    specific: guard.conservativeDelivery
      ? (advice.specific || []).slice(0, 2)
      : advice.specific,
  };
}

function buildConservativeExplanation(result: FortuneAnalysisResult, guard: ReportReliabilityGuard) {
  const pattern = result.pattern?.type || '当前结构';
  const dayun = result.fortune?.currentDaYun || '当前大运';
  const liunian = result.fortune?.currentLiuNian || '当前流年';
  const reasonText = guard.reasons.join('；');

  return [
    '世界易判断：先看稳定结构，不放大短期窗口。',
    `主判断：当前更适合按保守版理解这份结果，重点放在 ${pattern} 下的长期秩序，而不是立刻押注某个时间点。`,
    `判断依据：目前参考的是 ${dayun}、${liunian} 与命局底座的一致部分；${reasonText}`,
    '现在先做：只推进低后悔成本、可回撤的小动作，用现实反馈验证方向。',
    '风险提醒：不要把这次报告里的短期窗口、单点时机或情绪化强建议，当成必须立刻执行的硬结论。',
  ].join('\n\n');
}
