export type ToolHistoryEntry = {
  href: string;
  title: string;
  usedAt: string;
};

/** Server-persisted tool run (from /api/tools/history). */
export type ToolSessionHistoryItem = {
  id: string;
  toolSlug: string;
  title: string;
  headline?: string;
  summary?: string;
  recommendedAction?: string;
  reportId?: string;
  status: string;
  createdAt: string;
  resultHref: string;
  toolHref: string;
};

const STORAGE_KEY = 'lk_tool_history';
const MAX_ENTRIES = 12;

export function readToolHistory(): ToolHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ToolHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordToolVisit(entry: { href: string; title: string }) {
  if (typeof window === 'undefined') return;
  const existing = readToolHistory().filter((item) => item.href !== entry.href);
  const next: ToolHistoryEntry[] = [
    { ...entry, usedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function formatToolSlugTitle(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function summarizeToolResult(result: unknown): {
  headline?: string;
  summary?: string;
  recommendedAction?: string;
} {
  if (!result || typeof result !== 'object') return {};
  const r = result as Record<string, unknown>;
  const headline = typeof r.headline === 'string' ? r.headline.trim() : '';
  const summary = typeof r.summary === 'string' ? r.summary.trim() : '';
  const recommendedAction =
    typeof r.recommendedAction === 'string' ? r.recommendedAction.trim() : '';
  return {
    headline: headline || undefined,
    summary: summary || undefined,
    recommendedAction: recommendedAction || undefined,
  };
}

function readSessionField(session: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = session[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function normalizeToolSessions(payload: unknown): ToolSessionHistoryItem[] {
  const root = (payload || {}) as Record<string, unknown>;
  const list = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.sessions)
      ? root.sessions
      : Array.isArray((root.data as { sessions?: unknown })?.sessions)
        ? ((root.data as { sessions: unknown[] }).sessions)
        : [];

  return list
    .map((raw) => {
      const session = (raw || {}) as Record<string, unknown>;
      const id = readSessionField(session, 'id');
      const toolSlug = readSessionField(session, 'toolSlug', 'tool_slug');
      if (!id || !toolSlug) return null;

      const result = session.result && typeof session.result === 'object' ? session.result : {};
      const summary = summarizeToolResult(result);
      const meta = session.meta && typeof session.meta === 'object'
        ? (session.meta as Record<string, unknown>)
        : {};
      const toolTitle =
        (typeof meta.toolTitle === 'string' && meta.toolTitle)
        || (typeof meta.shortTitle === 'string' && meta.shortTitle)
        || formatToolSlugTitle(toolSlug);

      const createdAt =
        readSessionField(session, 'createdAt', 'created_at') || new Date().toISOString();
      const reportId = readSessionField(session, 'reportId', 'report_id') || undefined;
      const status = readSessionField(session, 'status') || 'completed';

      return {
        id,
        toolSlug,
        title: toolTitle,
        headline: summary.headline,
        summary: summary.summary,
        recommendedAction: summary.recommendedAction,
        reportId,
        status,
        createdAt,
        resultHref: `/tool-result/${id}?source=tool_history`,
        toolHref: `/tools/${toolSlug}?source=tool_history`,
      } satisfies ToolSessionHistoryItem;
    })
    .filter(Boolean) as ToolSessionHistoryItem[];
}

export async function fetchToolSessionHistory(limit = 40): Promise<ToolSessionHistoryItem[]> {
  try {
    const res = await fetch('/api/tools/history', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data?.success) return [];
    return normalizeToolSessions(data).slice(0, limit);
  } catch {
    return [];
  }
}
