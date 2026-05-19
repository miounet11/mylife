import { runAgent } from '@/lib/agentic-report/run-agent';
import { AGENT_DEPENDENCIES, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import { getAgentParallelConcurrency, isAgentDagSchedulerEnabled } from '@/lib/env';
import type { AgentTask, AgentTaskResult, ParallelAgentRunResult } from '@/lib/agentic-report/types';

const PARALLEL_AGENT_CONCURRENCY = getAgentParallelConcurrency();

export async function runParallelAgents(tasks: AgentTask[]): Promise<ParallelAgentRunResult> {
  if (isAgentDagSchedulerEnabled()) {
    return runDagAgents(tasks);
  }
  return runFlatParallel(tasks);
}

async function runFlatParallel(tasks: AgentTask[]): Promise<ParallelAgentRunResult> {
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

/**
 * DAG 调度：按 AGENT_DEPENDENCIES 的 wave 分波执行，wave 内仍然并发。
 *
 * 不在 DAG 中的 task（治理 agent / 外部 task）走 wave 99 兜底，保持顺序行为。
 * 输出契约与 runFlatParallel 完全一致。
 */
export async function runDagAgents(tasks: AgentTask[]): Promise<ParallelAgentRunResult> {
  const startedAt = new Date();
  const buckets = new Map<number, AgentTask[]>();
  for (const task of tasks) {
    const meta = AGENT_DEPENDENCIES[task.key as CoreAgentKey];
    const wave = meta ? meta.wave : 99;
    if (!buckets.has(wave)) buckets.set(wave, []);
    buckets.get(wave)!.push(task);
  }

  const waveOrder = Array.from(buckets.keys()).sort((a, b) => a - b);
  const settled: AgentTaskResult[] = [];
  for (const wave of waveOrder) {
    const waveTasks = buckets.get(wave)!;
    const waveResults = await runWithConcurrency(waveTasks, PARALLEL_AGENT_CONCURRENCY);
    settled.push(...waveResults);
  }
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
