/**
 * Bridge ChatExperienceContext → memory budget layers.
 */

import type { ChatExperienceContext } from '@/lib/chat-context';
import {
  allocateChatMemoryBudget,
  buildChatMemoryLayers,
  type MemoryBudgetResult,
} from '@/lib/experience-kernel/memory-budget';

export function allocateFromChatExperience(input: {
  context?: ChatExperienceContext | null;
  contextSummary?: string | null;
  materialSummary?: string | null;
  intentSummaryHint?: string | null;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  budgetChars?: number;
}): MemoryBudgetResult {
  const ctx = input.context;
  const report = ctx?.report;

  const layers = buildChatMemoryLayers({
    engineFactBlock: ctx?.engineFactBlock || null,
    report: report
      ? {
          dayMaster: report.dayMaster,
          yongShen: report.yongShen,
          currentDaYun: report.currentDaYun,
          patternType: report.pattern || null,
        }
      : null,
    sevenDayActions: ctx?.sevenDayActions || null,
    calibrationScore:
      typeof ctx?.calibrationScore === 'number' ? ctx.calibrationScore : null,
    calibrationDenied: ctx?.calibrationDeniedTitles || null,
    focusAreas: ctx?.focusAreas || null,
    materialSummary: input.materialSummary || null,
    intentHint: input.intentSummaryHint || null,
    unboundNote: report
      ? null
      : '【系统】本轮未绑定引擎真值。禁止编造日主/用神/大运；引导从报告页进入或先排盘。',
    // Soft extras only — structured layers preferred
    rawSummary: null,
  });

  return allocateChatMemoryBudget({
    layers,
    history: input.history,
    budgetChars: input.budgetChars,
    maxHistoryTurns: 8,
  });
}
