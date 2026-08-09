/**
 * Bridge ChatExperienceContext → memory budget layers.
 */

import type { ChatExperienceContext } from '@/lib/chat-context';
import {
  allocateChatMemoryBudget,
  buildChatMemoryLayers,
  type MemoryBudgetResult,
} from '@/lib/experience-kernel/memory-budget';

/** Pull open loops from last assistant message for multi-turn continuity */
export function extractWorkingMemoryFromHistory(
  history: Array<{ role: string; content: string }>,
): string {
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (!lastAssistant?.content) return '';
  const text = lastAssistant.content;
  const parts: string[] = [];
  const verify = text.match(/\*\*验证点\*\*[：:\s]*([^\n*]+)/);
  if (verify?.[1]) parts.push(`待验证：${verify[1].trim().slice(0, 80)}`);
  const d7 = text.match(/[-*]\s*7\s*天内[：:]\s*([^\n]+)/);
  if (d7?.[1]) parts.push(`7天动作：${d7[1].trim().slice(0, 80)}`);
  const today = text.match(/[-*]\s*今天[：:]\s*([^\n]+)/);
  if (today?.[1]) parts.push(`今日动作：${today[1].trim().slice(0, 60)}`);
  const risk = text.match(/\*\*风险提醒\*\*[：:\s]*([^\n*]+)/);
  if (risk?.[1]) parts.push(`风险：${risk[1].trim().slice(0, 60)}`);
  // Fallback: first line of 当前结论
  const conc = text.match(/\*\*当前结论\*\*[：:\s]*([^\n*]+)/);
  if (conc?.[1] && parts.length < 2) {
    parts.push(`上轮结论：${conc[1].trim().slice(0, 80)}`);
  }
  return parts.slice(0, 4).join('；');
}

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
  const workingMemory = extractWorkingMemoryFromHistory(input.history);

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
    workingMemory: workingMemory || null,
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
