// ── Merge Agent Results V6 ──
// Accepts both shapes:
//   A) AgentTaskResult[] (local / task-list pipeline)
//   B) Record<string, { ok, output } | { status, data }> (prod runParallelAgents)

import type { AgentTaskResult, MergedAgentResults } from './types';

type LooseAgentResult =
  | AgentTaskResult
  | {
      ok?: boolean;
      output?: unknown;
      data?: unknown;
      status?: string;
      error?: string;
      key?: string;
      agentKey?: string;
    };

function normalizeEntries(
  results: AgentTaskResult[] | Record<string, LooseAgentResult> | null | undefined,
): Array<{ key: string; ok: boolean; data: unknown; error?: string }> {
  if (!results) return [];

  if (Array.isArray(results)) {
    return results.map((r, index) => {
      const key = r.agentKey || (r as { key?: string }).key || `agent_${index}`;
      const ok = r.status === 'ok' || Boolean((r as { ok?: boolean }).ok);
      const data = r.data ?? (r as { output?: unknown }).output;
      return {
        key,
        ok,
        data,
        error: r.error || (ok ? undefined : r.status),
      };
    });
  }

  if (typeof results === 'object') {
    return Object.entries(results).map(([key, result]) => {
      const r = result || {};
      const ok =
        (r as { ok?: boolean }).ok === true ||
        (r as { status?: string }).status === 'ok';
      const data =
        (r as { output?: unknown }).output ??
        (r as { data?: unknown }).data;
      return {
        key,
        ok,
        data,
        error:
          (r as { error?: string }).error ||
          (ok ? undefined : (r as { status?: string }).status || 'UNKNOWN_AGENT_ERROR'),
      };
    });
  }

  return [];
}

export function mergeAgentResults(
  results: AgentTaskResult[] | Record<string, LooseAgentResult> | null | undefined,
): MergedAgentResults {
  const merged: Record<string, any> = {};
  const errors: Array<{ agentKey: string; error: string }> = [];

  const entries = normalizeEntries(results);
  for (const item of entries) {
    if (item.ok && item.data != null) {
      merged[item.key] = item.data;
    } else {
      errors.push({
        agentKey: item.key,
        error: item.error || 'UNKNOWN_AGENT_ERROR',
      });
    }
  }

  const successRate = entries.length > 0 ? Object.keys(merged).length / entries.length : 0;

  return {
    merged,
    errors,
    successRate,
    // prod pipeline historically used `key` in errors; keep agentKey as canonical
    failedAgents: errors.map((e) => e.agentKey),
  } as MergedAgentResults;
}
