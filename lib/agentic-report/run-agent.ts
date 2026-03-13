import type { AgentTask, AgentTaskResult } from '@/lib/agentic-report/types';

export async function runAgent<TInput, TOutput>(
  task: AgentTask<TInput, TOutput>
): Promise<AgentTaskResult<TOutput>> {
  const startedAt = new Date();
  const timeoutMs = task.timeoutMs || 6000;

  try {
    const output = await withTimeout(task.execute(task.input), timeoutMs, task.key);
    const finishedAt = new Date();

    return {
      key: task.key,
      ok: true,
      output,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } catch (error) {
    const finishedAt = new Date();
    return {
      key: task.key,
      ok: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_AGENT_ERROR',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, key: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`AGENT_TIMEOUT:${key}:${timeoutMs}`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
