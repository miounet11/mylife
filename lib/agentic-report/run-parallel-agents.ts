import { runAgent } from '@/lib/agentic-report/run-agent';
import type { AgentTask, ParallelAgentRunResult } from '@/lib/agentic-report/types';

const PARALLEL_AGENT_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.AGENT_PARALLEL_CONCURRENCY || '2', 10) || 2
);

export async function runParallelAgents(tasks: AgentTask[]): Promise<ParallelAgentRunResult> {
  const startedAt = new Date();
  const settled = await runWithConcurrency(tasks, PARALLEL_AGENT_CONCURRENCY);
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

async function runWithConcurrency(tasks: AgentTask[], concurrency: number) {
  const results: Awaited<ReturnType<typeof runAgent>>[] = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await runAgent(tasks[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  );

  return results;
}
