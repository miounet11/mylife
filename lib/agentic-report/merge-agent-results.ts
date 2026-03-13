import type { AgentTaskResult } from '@/lib/agentic-report/types';

export function mergeAgentResults(results: Record<string, AgentTaskResult>) {
  const merged: Record<string, unknown> = {};
  const errors: Array<{ key: string; error: string }> = [];

  for (const [key, result] of Object.entries(results)) {
    if (result.ok) {
      merged[key] = result.output;
    } else {
      errors.push({
        key,
        error: result.error || 'UNKNOWN_AGENT_ERROR',
      });
    }
  }

  return {
    merged,
    errors,
    successRate: Object.keys(results).length
      ? (Object.keys(merged).length / Object.keys(results).length)
      : 0,
  };
}
