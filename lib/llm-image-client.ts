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

/**
 * OpenAI-compatible POST /v1/images/generations through inping aggregate.
 */
export async function generateImageB64(input: {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
}): Promise<ImageGenResult> {
  const base = gatewayBase();
  const apiKey = gatewayKey();
  const model = input.model || defaultImageModel();
  if (!apiKey) {
    throw new Error(
      'Missing image API key: set PAGE_ILLUST_API_KEY or LLM_IMAGE_PRIMARY_API_KEY (inping aggregate)',
    );
  }

  const url = `${base}/v1/images/generations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
    throw new Error(`Image gen failed (${model}): ${msg}`);
  }

  const item = data?.data?.[0];
  let b64 = item?.b64_json || item?.b64 || '';

  // Some gateways return URL only — download
  if (!b64 && item?.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error(`Image URL download failed ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    b64 = buf.toString('base64');
  }

  if (!b64) {
    throw new Error(`Image gen empty payload (${model})`);
  }

  return {
    b64,
    provider: 'inping-aggregate',
    model,
    raw: { base, status: res.status },
  };
}

export function imageGatewayInfo() {
  return {
    base: gatewayBase(),
    model: defaultImageModel(),
    hasKey: Boolean(gatewayKey()),
    endpoint: `${gatewayBase()}/v1/images/generations`,
  };
}
