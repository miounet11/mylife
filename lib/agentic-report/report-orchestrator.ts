import { CORE_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
import { createAgenticContext } from '@/lib/agentic-report/create-agentic-context';
import { mergeAgentResults } from '@/lib/agentic-report/merge-agent-results';
import { runParallelAgents } from '@/lib/agentic-report/run-parallel-agents';
import type {
  AgentTask,
  BuildContextSignalsInput,
  BuildGroundTruthInput,
  ParallelAgentRunResult,
  StructuredAgenticContext,
} from '@/lib/agentic-report/types';

export interface AgenticReportOrchestrationResult {
  context: StructuredAgenticContext;
  run: ParallelAgentRunResult;
  merged: ReturnType<typeof mergeAgentResults>;
}

export async function orchestrateAgenticReport(params: {
  groundTruth: BuildGroundTruthInput;
  context: Omit<BuildContextSignalsInput, 'engine'>;
  tasks?: AgentTask[];
}) : Promise<AgenticReportOrchestrationResult> {
  const context = createAgenticContext({
    groundTruth: params.groundTruth,
    context: params.context,
  });

  const tasks = params.tasks || CORE_AGENT_KEYS.map((key) => createPlaceholderTask(key, context));
  const run = await runParallelAgents(tasks);

  return {
    context,
    run,
    merged: mergeAgentResults(run.results),
  };
}

function createPlaceholderTask(key: string, context: StructuredAgenticContext): AgentTask {
  return {
    key,
    input: context,
    execute: async () => ({
      status: 'stub',
      key,
      message: `${key} 真实执行器尚未接入，这里返回 orchestration 骨架占位结果。`,
    }),
    timeoutMs: 1200,
  };
}
