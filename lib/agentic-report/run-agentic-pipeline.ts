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
import { runAgent } from '@/lib/agentic-report/run-agent';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { assessScopeProviderHealth, hasRunnableModelsForSnapshots } from '@/lib/llm-provider-health';
import { buildAutoReferenceCorpusFromKnowledgeBase } from '@/lib/reference-corpus-builder';
import type { BuildContextSignalsInput, BuildGroundTruthInput } from '@/lib/agentic-report/types';

const AGENT_LABELS: Record<CoreAgentKey, string> = {
  core_constitution: '命局核心结构',
  kline_narrative: '人生 K 线节奏',
  career_wealth: '事业与财富',
  relationship_family: '关系与家庭',
  health_lifestyle: '健康与生活方式',
  strategy_advisor: '行动策略',
  temporal_spatial_advisor: '天时地利人和',
};

const PRIORITY_RETRY_AGENT_KEYS: CoreAgentKey[] = [
  'core_constitution',
  'strategy_advisor',
];

const RETRYABLE_ERROR_PATTERNS = [
  'AGENT_EMPTY_RESULT',
  'AGENT_TIMEOUT',
  'JSON_PARSE_FAILED',
] as const;
const AGENT_MAIN_TASK_TIMEOUT_MS = 26000;
const AGENT_MAIN_LLM_TIMEOUT_MS = 25000;
const AGENT_RETRY_TASK_TIMEOUT_MS = 30000;
const AGENT_RETRY_LLM_TIMEOUT_MS = 29000;

export async function runAgenticPipeline(params: {
  groundTruth: BuildGroundTruthInput;
  context: Omit<BuildContextSignalsInput, 'engine'>;
  enabled?: boolean;
  agentKeys?: CoreAgentKey[];
  enableRetry?: boolean;
  mainTaskTimeoutMs?: number;
  mainLlmTimeoutMs?: number;
  retryTaskTimeoutMs?: number;
  retryLlmTimeoutMs?: number;
  onProgress?: (event: {
    type: 'agent-start' | 'agent-success' | 'agent-fallback' | 'agent-retry';
    agentKey: CoreAgentKey;
    detail: string;
  }) => void | Promise<void>;
  }) {
  const referenceCorpus = hasReferenceCorpus(params.context.referenceCorpus)
    ? params.context.referenceCorpus
    : buildAutoReferenceCorpusFromKnowledgeBase({
        birthPlace: params.context.birthPlace,
        currentPlace: params.context.currentPlace,
        targetPlaces: params.context.targetPlaces,
        industries: params.context.industries,
        report: params.context.report,
      });
  const context = createAgenticContext({
    groundTruth: params.groundTruth,
    context: {
      ...params.context,
      referenceCorpus,
    },
  });
  const keys = params.agentKeys || [...CORE_AGENT_KEYS];

  if (params.enabled === false) {
    return buildDeterministicFallbackPipelineResult({
      context,
      keys,
      enabled: false,
    });
  }

  const agentScopeHealth = assessScopeProviderHealth(
    getModelFallbackChain(undefined, 'agent'),
    'agent'
  );
  if (!hasRunnableModelsForSnapshots(agentScopeHealth.snapshots)) {
    for (const key of keys) {
      await params.onProgress?.({
        type: 'agent-fallback',
        agentKey: key,
        detail: `${AGENT_LABELS[key] || key}分析模块当前跳过 LLM 调用，系统直接回退到稳定专家层结果。`,
      });
    }

    return buildDeterministicFallbackPipelineResult({
      context,
      keys,
      enabled: true,
      errors: ['AGENT_SCOPE_NO_RUNNABLE_MODELS'],
    });
  }

  const startedAt = Date.now();
  let llmCalls = 0;
  const mainTaskTimeoutMs = params.mainTaskTimeoutMs || AGENT_MAIN_TASK_TIMEOUT_MS;
  const mainLlmTimeoutMs = params.mainLlmTimeoutMs || AGENT_MAIN_LLM_TIMEOUT_MS;
  const retryTaskTimeoutMs = params.retryTaskTimeoutMs || AGENT_RETRY_TASK_TIMEOUT_MS;
  const retryLlmTimeoutMs = params.retryLlmTimeoutMs || AGENT_RETRY_LLM_TIMEOUT_MS;
  const tasks = keys.map((key) => ({
    key,
    input: context,
    timeoutMs: mainTaskTimeoutMs,
    execute: async () => executeAgentTask({
      key,
      context,
      onProgress: params.onProgress,
      traceSuffix: 'main',
      timeoutMs: mainLlmTimeoutMs,
      onCall: () => {
        llmCalls += 1;
      },
    }),
  }));

  const firstRun = await runParallelAgents(tasks);
  const retryCandidates = params.enableRetry === false
    ? []
    : keys.filter((key) => (
      PRIORITY_RETRY_AGENT_KEYS.includes(key) &&
      !firstRun.results[key]?.ok &&
      isRetryableAgentError(firstRun.results[key]?.error)
    ));
  const rerunResults = await rerunPriorityAgents({
    keys: retryCandidates,
    context,
    taskTimeoutMs: retryTaskTimeoutMs,
    llmTimeoutMs: retryLlmTimeoutMs,
    onProgress: params.onProgress,
    onCall: () => {
      llmCalls += 1;
    },
  });
  const finalResults = {
    ...firstRun.results,
    ...rerunResults.results,
  };
  const succeeded = keys.filter((key) => finalResults[key]?.ok);
  const failed = keys.filter((key) => !finalResults[key]?.ok);
  const merged = mergeAgentResults(finalResults);
  const fallbackResults = buildFallbackAgentResults(context, [...keys]);
  const hydratedResults = {
    ...fallbackResults,
    ...merged.merged,
  };
  const agentSources = Object.fromEntries(
    keys.map((key) => [key, finalResults[key]?.ok ? 'llm' : 'fallback'])
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
      rerunAgents: rerunResults.rerunAgents,
      totalLlmCalls: llmCalls,
      durationMs,
      successRate: merged.successRate,
      succeeded,
      failed,
      errors: merged.errors,
      agentSources,
    },
  };
}

function buildDeterministicFallbackPipelineResult(params: {
  context: ReturnType<typeof createAgenticContext>;
  keys: CoreAgentKey[];
  enabled: boolean;
  errors?: string[];
}) {
  const fallbackResults = buildFallbackAgentResults(params.context, [...params.keys]);
  const review = runReview(params.context, fallbackResults);
  const repair = runRepair(fallbackResults, review);
  const verify = runVerify(params.context, repair.repairedResults);

  return {
    enabled: params.enabled,
    used: false,
    context: params.context,
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
      errors: params.errors || [],
      agentSources: Object.fromEntries(Object.keys(fallbackResults).map((key) => [key, 'fallback'])),
    },
  };
}

function hasReferenceCorpus(input?: BuildContextSignalsInput['referenceCorpus']) {
  if (!input) return false;
  return Boolean(
    (input.sourceDocuments && input.sourceDocuments.length > 0) ||
    (input.bibliographyEntries && input.bibliographyEntries.length > 0) ||
    (input.entities && input.entities.length > 0)
  );
}

async function executeAgentTask(params: {
  key: CoreAgentKey;
  context: ReturnType<typeof createAgenticContext>;
  timeoutMs: number;
  traceSuffix: 'main' | 'retry';
  onCall: () => void;
  onProgress?: (event: {
    type: 'agent-start' | 'agent-success' | 'agent-fallback' | 'agent-retry';
    agentKey: CoreAgentKey;
    detail: string;
  }) => void | Promise<void>;
}) {
  const agentLabel = AGENT_LABELS[params.key] || params.key;
  const isRetry = params.traceSuffix === 'retry';
  await params.onProgress?.({
    type: isRetry ? 'agent-retry' : 'agent-start',
    agentKey: params.key,
    detail: isRetry
      ? `${agentLabel}分析模块正在进行第二次增强尝试，优先争取专家版结果。`
      : `${agentLabel}分析模块已启动，正在生成这一维度的判断。`,
  });
  const prompt = buildAgentPrompt(params.key, params.context);
  params.onCall();
  const result = await callJsonLLM<Record<string, unknown>>({
    system: prompt.system,
    user: prompt.user,
    temperature: isRetry ? Math.min(prompt.temperature, 0.35) : prompt.temperature,
    timeoutMs: params.timeoutMs,
    maxTokens: 900,
    traceLabel: `agent:${params.key}:${params.traceSuffix}`,
    scope: 'agent',
  });
  if (!result) {
    await params.onProgress?.({
      type: 'agent-fallback',
      agentKey: params.key,
      detail: `${agentLabel}分析模块暂未稳定返回，当前会回退到结构化专家层结果。`,
    });
    throw new Error(`AGENT_EMPTY_RESULT:${params.key}`);
  }
  await params.onProgress?.({
    type: 'agent-success',
    agentKey: params.key,
    detail: `${agentLabel}分析模块已返回结果，正在参与主报告融合。`,
  });
  return result;
}

async function rerunPriorityAgents(params: {
  keys: CoreAgentKey[];
  context: ReturnType<typeof createAgenticContext>;
  taskTimeoutMs: number;
  llmTimeoutMs: number;
  onCall: () => void;
  onProgress?: (event: {
    type: 'agent-start' | 'agent-success' | 'agent-fallback' | 'agent-retry';
    agentKey: CoreAgentKey;
    detail: string;
  }) => void | Promise<void>;
}) {
  if (params.keys.length === 0) {
    return {
      results: {} as Record<string, Awaited<ReturnType<typeof runAgent>>>,
      rerunAgents: [] as CoreAgentKey[],
    };
  }

  const results: Record<string, Awaited<ReturnType<typeof runAgent>>> = {};
  const rerunAgents: CoreAgentKey[] = [];

  for (const key of params.keys) {
    rerunAgents.push(key);
    results[key] = await runAgent({
      key,
      input: params.context,
      timeoutMs: params.taskTimeoutMs,
      execute: async () => executeAgentTask({
        key,
        context: params.context,
        timeoutMs: params.llmTimeoutMs,
        traceSuffix: 'retry',
        onCall: params.onCall,
        onProgress: params.onProgress,
      }),
    });
  }

  return {
    results,
    rerunAgents,
  };
}

function isRetryableAgentError(error?: string) {
  if (!error) return false;
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => error.includes(pattern));
}
