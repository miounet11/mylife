/**
 * Bridge ChatExperienceContext → memory budget layers.
 */

import type { ChatExperienceContext } from '@/lib/chat-context';
import {
  allocateChatMemoryBudget,
  buildChatMemoryLayers,
  type MemoryBudgetResult,
} from '@/lib/experience-kernel/memory-budget';

/** Last 3 turns as a story the teacher must continue — not just EFC lock. */
export function extractConversationStory(
  history: Array<{ role: string; content: string }>,
): string {
  const cleaned = history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && `${m.content || ''}`.trim())
    .slice(-6);
  if (cleaned.length < 2) return '';

  const lines: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const m = cleaned[i]!;
    const text = stripChatChrome(m.content);
    if (m.role === 'user') {
      lines.push(`用户问：${clip(text, 72)}`);
      continue;
    }
    const conclusion =
      text.match(/\*\*当前结论\*\*[：:\s]*([^\n*]+)/)?.[1]?.trim() ||
      text.split('\n').map((s) => s.trim()).find((s) => s && !s.startsWith('【') && !s.startsWith('**判断')) ||
      text;
    lines.push(`顾问答：${clip(conclusion, 90)}`);
    const hook =
      text.match(/\*\*还想问\*\*[：:\s]*\n[-*•]\s*([^\n]+)/)?.[1]?.trim() ||
      text.match(/还想问[：:\s]*\n[-*•]\s*([^\n]+)/)?.[1]?.trim();
    if (hook) lines.push(`未解：${clip(hook, 60)}`);
  }

  if (!lines.length) return '';
  return `请把下面当成同一场咨询的连续故事往下说，不要重开喜忌表：\n${lines.slice(-8).join('\n')}`;
}

function stripChatChrome(raw: string): string {
  return `${raw || ''}`
    .replace(/【锚定报告[\s\S]*?】\n?/g, '')
    .replace(/【引擎真值锁定[\s\S]*?】\n?/g, '')
    .trim();
}

function clip(value: string, max: number): string {
  const t = `${value || ''}`.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Pull open loops from last assistant + last-3-turn story */
export function extractWorkingMemoryFromHistory(
  history: Array<{ role: string; content: string }>,
): string {
  const story = extractConversationStory(history);
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (!lastAssistant?.content && !story) return '';
  const text = lastAssistant?.content || '';
  const parts: string[] = [];
  const verify = text.match(/\*\*验证点\*\*[：:\s]*([^\n*]+)/);
  if (verify?.[1]) parts.push(`待验证：${verify[1].trim().slice(0, 80)}`);
  const d7 = text.match(/[-*]\s*7\s*天内[：:]\s*([^\n]+)/);
  if (d7?.[1]) parts.push(`7天动作：${d7[1].trim().slice(0, 80)}`);
  const today = text.match(/[-*]\s*今天[：:]\s*([^\n]+)/);
  if (today?.[1]) parts.push(`今日动作：${today[1].trim().slice(0, 60)}`);
  const risk = text.match(/\*\*风险提醒\*\*[：:\s]*([^\n*]+)/);
  if (risk?.[1]) parts.push(`风险：${risk[1].trim().slice(0, 60)}`);
  const conc = text.match(/\*\*当前结论\*\*[：:\s]*([^\n*]+)/);
  if (conc?.[1] && parts.length < 2) {
    parts.push(`上轮结论：${conc[1].trim().slice(0, 80)}`);
  }
  const loops = parts.slice(0, 4).join('；');
  return [story, loops].filter(Boolean).join('\n');
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
