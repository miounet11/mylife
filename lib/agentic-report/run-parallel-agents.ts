import { runAgent } from '@/lib/agentic-report/run-agent';
import type { AgentTask, ParallelAgentRunResult } from '@/lib/agentic-report/types';

export async function runParallelAgents(tasks: AgentTask[]): Promise<ParallelAgentRunResult> {
  const startedAt = new Date();
  const settled = await Promise.all(tasks.map((task) => runAgent(task)));
  const finishedAt = new Date();

  const results = settled.reduce<ParallelAgentRunResult['results']>((accumulator, item) => {
    accumulator[item.key] = item;
    return accumulator;
  }, {});

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    results,
    succeeded: settled.filter((item) => item.ok).map((item) => item.key),
    failed: settled.filter((item) => !item.ok).map((item) => item.key),
  };
}
