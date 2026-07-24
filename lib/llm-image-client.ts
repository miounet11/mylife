/**
 * Unified image generation via aggregation gateway (OpenAI-compatible).
 * Default: https://ttqq.inping.com + grok-imagine-image-lite
 * All product image models should call this helper — do not hardcode vendor keys in UI.
 */

export type ImageGenResult = {
  b64: string;
  provider: string;
  model: string;
  raw?: unknown;
};

function gatewayBase(): string {
  return (
    process.env.PAGE_ILLUST_API_BASE ||
    process.env.LLM_IMAGE_PRIMARY_BASE_URL ||
    process.env.INPING_API_BASE ||
    'https://ttqq.inping.com'
  )
    .replace(/\/$/, '')
    .replace(/\/v1$/, '');
}

function gatewayKey(): string {
  return (
    process.env.PAGE_ILLUST_API_KEY ||
    process.env.LLM_IMAGE_PRIMARY_API_KEY ||
    process.env.VISUAL_ASSET_PRIMARY_API_KEY ||
    process.env.INPING_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  );
}

export function defaultImageModel(): string {
  return (
    process.env.FENGSHUI_TEXTURE_MODEL ||
    process.env.LLM_IMAGE_PRIMARY_MODEL ||
    process.env.PAGE_ILLUST_MODEL_TURBO ||
    process.env.GROK_IMAGINE_IMAGE_MODEL ||
    'grok-imagine-image-lite'
  );
}

function modelFallbackChain(preferred?: string): string[] {
  const chain = (
    process.env.VISUAL_ASSET_MODEL_FALLBACK_CHAIN ||
    process.env.LLM_IMAGE_MODEL_FALLBACK_CHAIN ||
    'grok-imagine-image-lite,z-image-turbo,gpt-image-2'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const first = preferred || defaultImageModel();
  return Array.from(new Set([first, ...chain]));
}

async function generateOnce(input: {
  base: string;
  apiKey: string;
  model: string;
  prompt: string;
  size?: string;
  n?: number;
}): Promise<ImageGenResult> {
  const url = `${input.base}/v1/images/generations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      n: input.n ?? 1,
      size: input.size || '1024x1024',
      response_format: 'b64_json',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; b64?: string; url?: string }>;
    error?: { message?: string; code?: string };
    message?: string;
  };

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`Image gen failed (${input.model}): ${msg}`);
  }

  const item = data?.data?.[0];
  let b64 = item?.b64_json || item?.b64 || '';

  if (!b64 && item?.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error(`Image URL download failed ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    b64 = buf.toString('base64');
  }

  if (!b64) {
    throw new Error(`Image gen empty payload (${input.model})`);
  }

  return {
    b64,
    provider: 'inping-aggregate',
    model: input.model,
    raw: { base: input.base, status: res.status },
  };
}

/**
 * OpenAI-compatible POST /v1/images/generations through inping aggregate.
 * Retries + model fallback chain for gateway flakiness.
 */
export async function generateImageB64(input: {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
}): Promise<ImageGenResult> {
  const base = gatewayBase();
  const apiKey = gatewayKey();
  if (!apiKey) {
    throw new Error(
      'Missing image API key: set PAGE_ILLUST_API_KEY or LLM_IMAGE_PRIMARY_API_KEY (inping aggregate)',
    );
  }

  const models = modelFallbackChain(input.model);
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await generateOnce({
          base,
          apiKey,
          model,
          prompt: input.prompt,
          size: input.size,
          n: input.n,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${model}#${attempt}: ${msg}`);
        // brief backoff on gateway internal errors
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  throw new Error(`All image models failed via ${base}: ${errors.join(' | ')}`);
}

export function imageGatewayInfo() {
  return {
    base: gatewayBase(),
    model: defaultImageModel(),
    hasKey: Boolean(gatewayKey()),
    endpoint: `${gatewayBase()}/v1/images/generations`,
  };
}
