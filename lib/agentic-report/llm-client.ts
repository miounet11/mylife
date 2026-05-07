import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { resolveRuntimeLlmProviders, type RuntimeLlmProvider } from '@/lib/llm-provider-configs';
import { formatModelAttemptLabel, getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  createOpenAiCompatibleChatCompletion,
  type OpenAiCompatibleReasoningEffort,
} from '@/lib/openai-compatible-chat';
import {
  computeAttemptTimeouts,
  getDynamicModelExecutionPlan,
  recordModelAttempt,
  summarizeModelExecutionPlan,
  type LlmScope,
} from '@/lib/llm-provider-health';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function defaultReasoningEffortForScope(scope: LlmScope): OpenAiCompatibleReasoningEffort {
  if (scope === 'report') {
    return 'medium';
  }

  return 'low';
}

function uniqueModels(values: Array<string | null | undefined>) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function truncateForLog(value: string, maxLength: number = 240) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function stripMarkdownFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function repairJsonCandidate(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, '\'')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function parseJsonContent<T>(content: string): { parsed: T | null; reason?: string } {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [
    trimmed,
    stripMarkdownFence(trimmed),
    fenceMatch?.[1]?.trim(),
  ].filter((item): item is string => !!item);

  const firstBraceIndex = trimmed.indexOf('{');
  const lastBraceIndex = trimmed.lastIndexOf('}');
  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    candidates.push(trimmed.slice(firstBraceIndex, lastBraceIndex + 1));
  }

  const uniqueCandidates = [...new Set(candidates)];
  let lastError = 'JSON_NOT_FOUND';

  for (const candidate of uniqueCandidates) {
    try {
      return {
        parsed: JSON.parse(candidate) as T,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'JSON_PARSE_ERROR';
    }

    try {
      return {
        parsed: JSON.parse(repairJsonCandidate(candidate)) as T,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'JSON_REPAIR_PARSE_ERROR';
    }
  }

  return {
    parsed: null,
    reason: lastError,
  };
}

function classifyError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'abort';
    if (error.message.toLowerCase().includes('timeout')) return 'timeout';
    return error.name || 'error';
  }

  return 'unknown';
}

export async function callJsonLLM<T>(params: {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
  maxTokens?: number;
  model?: string;
  modelChain?: string[];
  traceLabel?: string;
  scope?: LlmScope;
  disableHealthReorder?: boolean;
  reasoningEffort?: OpenAiCompatibleReasoningEffort;
}): Promise<T | null> {
  const traceLabel = params.traceLabel || 'agent';
  const timeoutMs = params.timeoutMs || 8000;
  const scope = params.scope || 'agent';
  const configuredProviders = scope === 'content' ? resolveRuntimeLlmProviders('article') : [];
  const envApiKey = getApiKey();
  const providers: RuntimeLlmProvider[] = configuredProviders.length
    ? configuredProviders.map((provider) => ({ ...provider, timeoutMs }))
    : envApiKey
      ? [{
          id: 'env_agentic',
          name: 'Env Agentic Provider',
          purpose: 'article',
          baseUrl: getApiBaseUrl(),
          apiKey: envApiKey,
          model: params.model || getDefaultModel(),
          priority: 10_000,
          timeoutMs,
          maxRetries: 0,
          source: 'env',
        }]
      : [];

  if (providers.length === 0) {
    console.warn(`[Agentic LLM] ${traceLabel} missing API key, skip request.`);
    return null;
  }

  const baseModelChain = params.modelChain?.length
    ? uniqueModels(params.modelChain)
    : getModelFallbackChain(params.model || getDefaultModel());
  const plan = params.disableHealthReorder
    ? {
        orderedModels: baseModelChain,
        snapshots: [],
      }
    : getDynamicModelExecutionPlan(baseModelChain, scope);
  const modelCandidates = configuredProviders.length && scope === 'content'
    ? uniqueModels(providers.map((provider) => provider.model))
    : plan.orderedModels;
  const planSummary = params.disableHealthReorder
    ? {
        ordered: baseModelChain,
        skipped: [],
        label: `ordered=${baseModelChain.join(' -> ')}`,
      }
    : summarizeModelExecutionPlan(plan);
  const attemptTimeouts = computeAttemptTimeouts(timeoutMs, modelCandidates.length);
  const deadlineAt = Date.now() + timeoutMs;
  console.log(
    `[Agentic LLM] ${traceLabel} planner ${planSummary.label} ` +
    `(base=${formatModelAttemptLabel(baseModelChain)})`
  );
  if (modelCandidates.length === 0) {
    console.warn(
      `[Agentic LLM] ${traceLabel} no runnable models after health planning, skip request.`
    );
    return null;
  }

  try {
    let lastError: unknown = null;

    const attempts = configuredProviders.length && scope === 'content'
      ? providers.map((provider) => ({ provider, model: provider.model }))
      : modelCandidates.map((model) => ({ provider: providers[0], model }));

    for (const [index, attempt] of attempts.entries()) {
      const { provider, model } = attempt;
      const remainingBudget = deadlineAt - Date.now();
      if (remainingBudget < 900) {
        break;
      }

      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl,
        timeout: timeoutMs,
        maxRetries: provider.maxRetries,
      });
      const controller = new AbortController();
      const attemptTimeoutMs = Math.max(900, Math.min(remainingBudget, attemptTimeouts[index] || remainingBudget));
      const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);
      const startedAt = Date.now();
      try {
        const completion = await createOpenAiCompatibleChatCompletion(client, {
          model,
          temperature: params.temperature ?? 0.5,
          maxTokens: params.maxTokens ?? 900,
          reasoningEffort: params.reasoningEffort || defaultReasoningEffortForScope(scope),
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ] as ChatMessage[],
        }, {
          signal: controller.signal,
          timeout: attemptTimeoutMs,
          maxRetries: 0,
        });

        const content = completion.choices?.[0]?.message?.content?.trim();
        if (!content) {
          console.error(`[Agentic LLM] ${traceLabel} model=${model} returned empty content.`);
          recordModelAttempt({
            model,
            scope,
            success: false,
            latencyMs: Date.now() - startedAt,
            errorType: 'empty',
            errorMessage: 'EMPTY_CONTENT',
            traceLabel,
          });
          lastError = new Error(`EMPTY_CONTENT:${model}`);
          continue;
        }

        const parsed = parseJsonContent<T>(content);
        if (!parsed.parsed) {
          console.error(
            `[Agentic LLM] ${traceLabel} model=${model} JSON parse failed: ${parsed.reason || 'UNKNOWN'} | preview=${JSON.stringify(truncateForLog(content))}`
          );
          recordModelAttempt({
            model,
            scope,
            success: false,
            latencyMs: Date.now() - startedAt,
            errorType: `parse:${parsed.reason || 'unknown'}`,
            errorMessage: parsed.reason || 'JSON_PARSE_FAILED',
            traceLabel,
          });
          lastError = new Error(`JSON_PARSE_FAILED:${model}:${parsed.reason || 'UNKNOWN'}`);
          continue;
        }

        recordModelAttempt({
          model,
          scope,
          success: true,
          latencyMs: Date.now() - startedAt,
          traceLabel,
        });
        if (model !== modelCandidates[0]) {
          console.warn(`[Agentic LLM] ${traceLabel} succeeded after model fallback to ${model}.`);
        }
        return parsed.parsed;
      } catch (error) {
        lastError = error;
        recordModelAttempt({
          model,
          scope,
          success: false,
          latencyMs: Date.now() - startedAt,
          errorType: classifyError(error),
          errorMessage: (error as Error).message,
          traceLabel,
        });
        console.error(
          `[Agentic LLM] ${traceLabel} provider=${provider.id} model=${model} request failed: ${classifyError(error)}`
          + `${typeof (error as Error & { status?: number }).status === 'number' ? ` status=${(error as Error & { status?: number }).status}` : ''}`
          + `${(error as Error & { code?: string }).code ? ` code=${(error as Error & { code?: string }).code}` : ''}`
          + `${(error as Error).message ? ` message=${truncateForLog((error as Error).message, 180)}` : ''}`
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    console.error(
      `[Agentic LLM] ${traceLabel} all model attempts failed: ${formatModelAttemptLabel(modelCandidates)}`
    );
    if (lastError) {
      return null;
    }
    return null;
  } catch (error) {
    const anyError = error as Error & { status?: number; code?: string };
    console.error(
      `[Agentic LLM] ${traceLabel} request failed: ${classifyError(error)}${typeof anyError.status === 'number' ? ` status=${anyError.status}` : ''}${anyError.code ? ` code=${anyError.code}` : ''}${anyError.message ? ` message=${truncateForLog(anyError.message, 180)}` : ''}`
    );
    return null;
  }
}
