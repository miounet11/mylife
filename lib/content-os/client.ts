/**
 * SpaceXAI / self-hosted gateway client for Content OS.
 * Defaults: https://ttqq.inping.com  text model `auto`  image `z-image-turbo`
 * Keys from env only — never hardcode secrets.
 */

import {
  getApiBaseUrl,
  getApiKey,
  getContentGenerationModel,
  getContentGenerationTimeoutMs,
  getVisualAssetApiBaseUrl,
  getVisualAssetApiKey,
  getVisualAssetDefaultModel,
} from '@/lib/env';
import {
  buildOpenAiCompatibleChatCompletionBody,
  createOpenAiCompatibleChatCompletion,
} from '@/lib/openai-compatible-chat';
import OpenAI from 'openai';

export type ContentOsChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function normalizeBaseUrl(raw: string) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'https://ttqq.inping.com/v1';
  if (trimmed.endsWith('/v1')) return trimmed;
  if (trimmed.endsWith('/v1/chat/completions')) return trimmed.slice(0, -'/chat/completions'.length);
  return `${trimmed}/v1`;
}

export function resolveContentOsTextEndpoint() {
  return {
    baseUrl: normalizeBaseUrl(
      process.env.CONTENT_OS_API_BASE_URL ||
        process.env.API_BASE_URL ||
        getApiBaseUrl() ||
        'https://ttqq.inping.com/v1',
    ),
    apiKey:
      process.env.CONTENT_OS_API_KEY ||
      process.env.INPING_API_KEY ||
      getApiKey() ||
      '',
    model:
      process.env.CONTENT_OS_TEXT_MODEL ||
      process.env.CONTENT_GENERATION_MODEL ||
      getContentGenerationModel() ||
      'auto',
    timeoutMs: Number(process.env.CONTENT_OS_TIMEOUT_MS || getContentGenerationTimeoutMs() || 90_000),
  };
}

export function resolveContentOsImageEndpoint() {
  const text = resolveContentOsTextEndpoint();
  return {
    baseUrl: normalizeBaseUrl(
      process.env.CONTENT_OS_IMAGE_API_BASE_URL ||
        process.env.VISUAL_ASSET_API_BASE_URL ||
        getVisualAssetApiBaseUrl() ||
        text.baseUrl,
    ),
    apiKey:
      process.env.CONTENT_OS_IMAGE_API_KEY ||
      process.env.VISUAL_ASSET_API_KEY ||
      getVisualAssetApiKey() ||
      text.apiKey,
    model:
      process.env.CONTENT_OS_IMAGE_MODEL ||
      process.env.VISUAL_ASSET_DEFAULT_MODEL ||
      getVisualAssetDefaultModel() ||
      'z-image-turbo',
  };
}

export async function contentOsChatCompletion(params: {
  messages: ContentOsChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
  model?: string;
}): Promise<{ content: string; model: string; raw?: unknown }> {
  const endpoint = resolveContentOsTextEndpoint();
  if (!endpoint.apiKey) {
    throw new Error('CONTENT_OS_API_KEY_MISSING');
  }

  const model = params.model || endpoint.model;
  const openai = new OpenAI({
    apiKey: endpoint.apiKey,
    baseURL: endpoint.baseUrl,
    timeout: endpoint.timeoutMs,
  });

  const body = buildOpenAiCompatibleChatCompletionBody({
    model,
    messages: params.messages as Array<Record<string, unknown>>,
    maxTokens: params.maxTokens ?? 3200,
    temperature: params.temperature ?? 0.55,
    responseFormat: params.responseFormat?.type === 'json_object'
      ? { type: 'json_object' }
      : undefined,
  });

  const completion = await createOpenAiCompatibleChatCompletion(openai, {
    model,
    messages: body.messages as never,
    maxTokens: params.maxTokens ?? 3200,
    temperature: params.temperature ?? 0.55,
    responseFormat: params.responseFormat?.type === 'json_object'
      ? { type: 'json_object' }
      : undefined,
  });

  const content =
    completion.choices?.[0]?.message?.content?.toString()?.trim() || '';

  if (!content) {
    throw new Error('CONTENT_OS_EMPTY_COMPLETION');
  }

  return {
    content,
    model: completion.model || model,
    raw: completion,
  };
}

export async function contentOsChatJson<T>(params: {
  messages: ContentOsChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}): Promise<{ data: T; model: string }> {
  const result = await contentOsChatCompletion({
    ...params,
    responseFormat: { type: 'json_object' },
  });

  const text = result.content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  const candidate = first >= 0 && last > first ? text.slice(first, last + 1) : text;

  try {
    return { data: JSON.parse(candidate) as T, model: result.model };
  } catch {
    throw new Error(`CONTENT_OS_JSON_PARSE_FAILED: ${text.slice(0, 200)}`);
  }
}

export async function contentOsGenerateImage(params: {
  prompt: string;
  size?: string;
  model?: string;
}): Promise<{ b64?: string; url?: string; model: string }> {
  const endpoint = resolveContentOsImageEndpoint();
  if (!endpoint.apiKey) {
    throw new Error('CONTENT_OS_IMAGE_API_KEY_MISSING');
  }

  const model = params.model || endpoint.model;
  const root = endpoint.baseUrl.replace(/\/v1$/, '');
  const res = await fetch(`${root}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${endpoint.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: params.prompt,
      n: 1,
      size: params.size || '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`CONTENT_OS_IMAGE_FAILED ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const item = json.data?.[0];
  return {
    b64: item?.b64_json,
    url: item?.url,
    model,
  };
}
