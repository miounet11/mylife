import OpenAI from 'openai';

export type OpenAiCompatibleReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

type ChatCompletionMessage = Record<string, unknown>;
type ChatCompletionTool = Record<string, unknown>;

export function normalizeModelId(model?: string | null) {
  return `${model || ''}`.trim().toLowerCase();
}

export function isNativeOpenAiModel(model?: string | null) {
  const normalized = normalizeModelId(model);
  return normalized === 'auto' || /^(gpt-|o[1345](?:$|[-.])|codex-)/.test(normalized);
}

export function isGpt5FamilyModel(model?: string | null) {
  return /^gpt-5(?:$|[-.])/.test(normalizeModelId(model));
}

export function resolveChatCompletionMaxTokensField(model?: string | null) {
  return isNativeOpenAiModel(model) ? 'max_completion_tokens' : 'max_tokens';
}

export function supportsTemperatureParameter(model?: string | null) {
  const normalized = normalizeModelId(model);
  return normalized !== 'auto' && !isGpt5FamilyModel(model);
}

export function resolveReasoningEffortFromBudgetTokens(budgetTokens?: number | null): OpenAiCompatibleReasoningEffort | undefined {
  if (!budgetTokens || budgetTokens <= 0) {
    return undefined;
  }

  if (budgetTokens >= 12_000) {
    return 'high';
  }

  if (budgetTokens >= 4_000) {
    return 'medium';
  }

  return 'low';
}

export function supportsReasoningEffortParameter(model?: string | null) {
  // 仅 GPT-5 / o-series 推理类模型支持 reasoning_effort。
  // gpt-4.x / gpt-3.x 等传统模型若收到该参数，上游网关会以 429/400 拒绝。
  const normalized = normalizeModelId(model);
  if (isGpt5FamilyModel(model)) return true;
  return /^o[1345](?:$|[-.])/.test(normalized);
}

export function buildOpenAiCompatibleChatCompletionBody(params: {
  model: string;
  messages: ChatCompletionMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: ChatCompletionTool[];
  toolChoice?: unknown;
  responseFormat?: Record<string, unknown>;
  reasoningEffort?: OpenAiCompatibleReasoningEffort;
}) {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
  };

  if (typeof params.maxTokens === 'number' && params.maxTokens > 0) {
    body[resolveChatCompletionMaxTokensField(params.model)] = params.maxTokens;
  }

  if (typeof params.temperature === 'number' && supportsTemperatureParameter(params.model)) {
    body.temperature = params.temperature;
  }

  if (params.tools?.length) {
    body.tools = params.tools;
  }

  if (params.toolChoice !== undefined) {
    body.tool_choice = params.toolChoice;
  }

  if (params.responseFormat) {
    body.response_format = params.responseFormat;
  }

  if (params.reasoningEffort && supportsReasoningEffortParameter(params.model)) {
    body.reasoning_effort = params.reasoningEffort;
  }

  return body;
}

export async function createOpenAiCompatibleChatCompletion(
  openai: OpenAI,
  params: {
    model: string;
    messages: ChatCompletionMessage[];
    maxTokens?: number;
    temperature?: number;
    tools?: ChatCompletionTool[];
    toolChoice?: unknown;
    responseFormat?: Record<string, unknown>;
    reasoningEffort?: OpenAiCompatibleReasoningEffort;
  },
  requestOptions?: OpenAI.RequestOptions
) {
  return openai.chat.completions.create(
    buildOpenAiCompatibleChatCompletionBody(params) as never,
    requestOptions
  );
}
