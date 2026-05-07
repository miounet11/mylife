import type { FortuneRecord, ToolSessionRecord } from '@/lib/user-types';

export interface ToolMemorySummary {
  summary: string;
  focusAreas: string[];
  evidence: string[];
  recentSessions: Array<{
    id: string;
    toolSlug: string;
    toolTitle: string;
    category: string;
    headline: string;
    recommendedAction: string;
    createdAt?: string;
  }>;
}

export function summarizeToolSessions(
  sessions: Array<ToolSessionRecord<unknown> | null | undefined>,
  _report?: FortuneRecord | null,
  limit = 5
): ToolMemorySummary | null {
  const recentSessions = (sessions || [])
    .filter((item): item is ToolSessionRecord<unknown> => !!item && !!item.toolSlug)
    .slice(0, limit)
    .map((item) => {
      const meta = (item.meta || {}) as Record<string, unknown>;
      return {
        id: item.id,
        toolSlug: item.toolSlug,
        toolTitle: `${meta.toolTitle || item.toolSlug}`,
        category: `${meta.category || 'unknown'}`,
        headline: `${(item.result as Record<string, unknown> | undefined)?.headline || ''}`.trim(),
        recommendedAction: `${(item.result as Record<string, unknown> | undefined)?.recommendedAction || ''}`.trim(),
        createdAt: item.createdAt,
      };
    })
    .filter((item) => item.toolTitle);

  if (recentSessions.length === 0) {
    return null;
  }

  const focusAreas = Array.from(new Set(recentSessions.map((item) => item.category))).slice(0, 4);
  const evidence = recentSessions
    .map((item) => item.headline || item.recommendedAction)
    .filter(Boolean)
    .slice(0, 4);

  const summary = `你最近已经做过 ${recentSessions.length} 个单项工具，主要集中在 ${focusAreas.join('、')}。后续判断应优先继承这些已确认的问题切片，避免每次重新从泛问题开始。`;

  return {
    summary,
    focusAreas,
    evidence,
    recentSessions,
  };
}

export function appendToolMemoryToNarrative(baseText: string, memory: ToolMemorySummary | null) {
  if (!memory) {
    return baseText;
  }

  const details = memory.recentSessions
    .slice(0, 3)
    .map((item) => `${item.toolTitle}：${item.recommendedAction || item.headline}`)
    .filter(Boolean)
    .join('；');

  return [baseText, `历史工具上下文：${details}。`].filter(Boolean).join('\n\n');
}
