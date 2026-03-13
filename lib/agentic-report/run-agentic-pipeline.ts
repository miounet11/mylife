import { CORE_AGENT_KEYS, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import { buildFallbackAgentResults } from '@/lib/agentic-report/build-fallback-agent-results';
import { createAgenticContext } from '@/lib/agentic-report/create-agentic-context';
import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import { mergeAgentResults } from '@/lib/agentic-report/merge-agent-results';
import { buildAgentPrompt } from '@/lib/agentic-report/prompts/agents';
import { runParallelAgents } from '@/lib/agentic-report/run-parallel-agents';
import { runRepair } from '@/lib/agentic-report/review/run-repair';
import { runReview } from '@/lib/agentic-report/review/run-review';
import { runVerify } from '@/lib/agentic-report/review/run-verify';
import type { BuildContextSignalsInput, BuildGroundTruthInput } from '@/lib/agentic-report/types';

export async function runAgenticPipeline(params: {
  groundTruth: BuildGroundTruthInput;
  context: Omit<BuildContextSignalsInput, 'engine'>;
  enabled?: boolean;
  agentKeys?: CoreAgentKey[];
}) {
  const context = createAgenticContext({
    groundTruth: params.groundTruth,
    context: params.context,
  });

  if (params.enabled === false) {
    const fallbackResults = buildFallbackAgentResults(context, [...(params.agentKeys || CORE_AGENT_KEYS)]);
    const review = runReview(context, fallbackResults);
    const repair = runRepair(fallbackResults, review);
    const verify = runVerify(context, repair.repairedResults);

    return {
      enabled: false,
      used: false,
      context,
      agentResults: repair.repairedResults,
      review,
      repair,
      verify,
      orchestration: {
        mode: 'deterministic-expert' as const,
        agentsRun: Object.keys(fallbackResults),
        rerunAgents: [],
        totalLlmCalls: 0,
        durationMs: 0,
        successRate: 1,
        succeeded: [],
        failed: [],
        errors: [],
        agentSources: Object.fromEntries(Object.keys(fallbackResults).map((key) => [key, 'fallback'])),
      },
    };
  }

  const keys = params.agentKeys || CORE_AGENT_KEYS;
  const startedAt = Date.now();
  let llmCalls = 0;
  const tasks = keys.map((key) => ({
    key,
    input: context,
    timeoutMs: 7000,
    execute: async () => {
      const prompt = buildAgentPrompt(key, context);
      llmCalls += 1;
      const result = await callJsonLLM<Record<string, unknown>>({
        system: prompt.system,
        user: prompt.user,
        temperature: prompt.temperature,
        timeoutMs: 6500,
        traceLabel: `agent:${key}`,
        scope: 'agent',
      });
      if (!result) {
        throw new Error(`AGENT_EMPTY_RESULT:${key}`);
      }
      return result;
    },
  }));

  const run = await runParallelAgents(tasks);
  const merged = mergeAgentResults(run.results);
  const fallbackResults = buildFallbackAgentResults(context, [...keys]);
  const hydratedResults = {
    ...fallbackResults,
    ...merged.merged,
  };
  const agentSources = Object.fromEntries(
    keys.map((key) => [key, run.results[key]?.ok ? 'llm' : 'fallback'])
  ) as Record<string, 'llm' | 'fallback'>;
  const review = runReview(context, hydratedResults);
  const repair = runRepair(hydratedResults, review);
  const verify = runVerify(context, repair.repairedResults);
  const durationMs = Date.now() - startedAt;
  const used = merged.successRate > 0;

  return {
    enabled: true,
    used,
    context,
    agentResults: repair.repairedResults,
    review,
    repair,
    verify,
    orchestration: {
      mode: 'parallel-agents' as const,
      agentsRun: Object.keys(hydratedResults),
      rerunAgents: [],
      totalLlmCalls: llmCalls,
      durationMs,
      successRate: merged.successRate,
      succeeded: run.succeeded,
      failed: run.failed,
      errors: merged.errors,
      agentSources,
    },
  };
}
