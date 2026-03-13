import OpenAI from 'openai';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function normalizeApiKey(value?: string | null) {
  const key = (value || '').trim();
  if (!key || key === 'dummy_key') return null;
  return key;
}

function getApiKey() {
  return normalizeApiKey(process.env.OPENAI_API_KEY) || normalizeApiKey(process.env.API_KEY);
}

function getBaseUrl() {
  return process.env.API_BASE_URL || 'https://ttkk.inping.com/v1';
}

function getModel() {
  return process.env.DEFAULT_MODEL || 'auto';
}

export async function callJsonLLM<T>(params: {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
  model?: string;
}): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const timeoutMs = params.timeoutMs || 7000;
  const client = new OpenAI({
    apiKey,
    baseURL: getBaseUrl(),
    timeout: timeoutMs,
    maxRetries: 0,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create({
      model: params.model || getModel(),
      temperature: params.temperature ?? 0.5,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ] as ChatMessage[],
    }, {
      signal: controller.signal,
      timeout: timeoutMs,
      maxRetries: 0,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
