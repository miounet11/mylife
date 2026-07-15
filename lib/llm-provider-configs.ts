import { db } from '@/lib/database';
import {
  getApiBaseUrl,
  getApiKey,
  getContentGenerationModel,
  getVisualAssetApiBaseUrl,
  getVisualAssetApiKey,
  getVisualAssetDefaultModel,
  getVisualAssetFallbackModel,
  getVisualAssetGenerationTimeoutMs,
  getVisualAssetModelFallbackChainRaw,
  normalizeApiKey,
} from '@/lib/env';

export type LlmProviderPurpose = 'image' | 'article';

export type LlmProviderConfigInput = {
  id?: string;
  purpose: LlmProviderPurpose;
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string | null;
  priority?: number;
  enabled?: boolean;
  timeoutMs?: number | null;
  maxRetries?: number | null;
  meta?: Record<string, unknown>;
};

export type LlmProviderConfig = Required<Omit<LlmProviderConfigInput, 'apiKey' | 'timeoutMs' | 'maxRetries' | 'meta'>> & {
  apiKey: string | null;
  timeoutMs: number | null;
  maxRetries: number;
  meta: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

type RawLlmProviderConfigRow = Record<string, any>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? {});
}

export function normalizeProviderBaseUrl(value: string) {
  const trimmed = `${value || ''}`.trim().replace(/\/+$/g, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('/v1')) return trimmed;
  if (trimmed.endsWith('/v1/chat/completions')) return trimmed.slice(0, -'/chat/completions'.length);
  if (trimmed.endsWith('/chat/completions')) return trimmed.slice(0, -'/chat/completions'.length);
  return `${trimmed}/v1`;
}

function maskApiKey(value?: string | null) {
  const key = `${value || ''}`.trim();
  if (!key) return '';
  if (key.length <= 12) return `${key.slice(0, 3)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function stableConfigId(input: Pick<LlmProviderConfigInput, 'purpose' | 'name' | 'model'>) {
  return `llm_provider_${input.purpose}_${input.name}_${input.model}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

function mapRow(row: RawLlmProviderConfigRow): LlmProviderConfig {
  return {
    id: row.id,
    purpose: row.purpose,
    name: row.name,
    baseUrl: row.base_url,
    model: row.model,
    apiKey: normalizeApiKey(row.api_key),
    priority: Number(row.priority || 100),
    enabled: row.enabled === 1,
    timeoutMs: row.timeout_ms === null || row.timeout_ms === undefined ? null : Number(row.timeout_ms),
    maxRetries: Number(row.max_retries || 0),
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listLlmProviderConfigs(params?: { purpose?: LlmProviderPurpose; includeDisabled?: boolean }) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  if (params?.purpose) {
    clauses.push('purpose = ?');
    values.push(params.purpose);
  }
  if (!params?.includeDisabled) {
    clauses.push('enabled = 1');
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT * FROM llm_provider_configs
    ${where}
    ORDER BY priority ASC, datetime(updated_at) DESC, id ASC
  `).all(...values) as RawLlmProviderConfigRow[];

  return rows.map(mapRow);
}

export function listMaskedLlmProviderConfigs() {
  return listLlmProviderConfigs({ includeDisabled: true }).map((config) => ({
    ...config,
    apiKey: undefined,
    apiKeyMasked: maskApiKey(config.apiKey),
    hasApiKey: Boolean(config.apiKey),
  }));
}

export function saveLlmProviderConfig(input: LlmProviderConfigInput, userId = 'system_llm_provider_config') {
  const now = new Date().toISOString();
  const id = input.id?.trim() || stableConfigId(input);
  const existing = db.prepare(`SELECT * FROM llm_provider_configs WHERE id = ?`).get(id) as RawLlmProviderConfigRow | undefined;
  const existingConfig = existing ? mapRow(existing) : null;
  const apiKey = input.apiKey === undefined
    ? existingConfig?.apiKey || null
    : normalizeApiKey(input.apiKey);
  const payload = {
    id,
    purpose: input.purpose,
    name: input.name.trim(),
    baseUrl: normalizeProviderBaseUrl(input.baseUrl),
    model: input.model.trim(),
    apiKey,
    priority: Number.isFinite(input.priority) ? Number(input.priority) : 100,
    enabled: input.enabled !== false,
    timeoutMs: input.timeoutMs === null || input.timeoutMs === undefined ? null : Math.max(1000, Number(input.timeoutMs)),
    maxRetries: Math.max(0, Number(input.maxRetries || 0)),
    meta: input.meta || {},
  };

  if (!payload.purpose || !payload.name || !payload.baseUrl || !payload.model) {
    throw new Error('LLM_PROVIDER_CONFIG_INVALID');
  }

  if (existing) {
    db.prepare(`
      UPDATE llm_provider_configs
      SET purpose = ?, name = ?, base_url = ?, model = ?, api_key = ?, priority = ?, enabled = ?,
          timeout_ms = ?, max_retries = ?, meta = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(
      payload.purpose,
      payload.name,
      payload.baseUrl,
      payload.model,
      payload.apiKey,
      payload.priority,
      payload.enabled ? 1 : 0,
      payload.timeoutMs,
      payload.maxRetries,
      stringifyJson(payload.meta),
      userId,
      now,
      payload.id
    );
  } else {
    db.prepare(`
      INSERT INTO llm_provider_configs (
        id, purpose, name, base_url, model, api_key, priority, enabled, timeout_ms, max_retries,
        meta, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.id,
      payload.purpose,
      payload.name,
      payload.baseUrl,
      payload.model,
      payload.apiKey,
      payload.priority,
      payload.enabled ? 1 : 0,
      payload.timeoutMs,
      payload.maxRetries,
      stringifyJson(payload.meta),
      userId,
      userId,
      now,
      now
    );
  }

  const row = db.prepare(`SELECT * FROM llm_provider_configs WHERE id = ?`).get(payload.id) as RawLlmProviderConfigRow | undefined;
  return row ? mapRow(row) : null;
}

export function deleteLlmProviderConfig(id: string) {
  return db.prepare(`DELETE FROM llm_provider_configs WHERE id = ?`).run(id);
}

export type RuntimeLlmProvider = {
  id: string;
  name: string;
  purpose: LlmProviderPurpose;
  baseUrl: string;
  apiKey: string;
  model: string;
  priority: number;
  timeoutMs: number;
  maxRetries: number;
  source: 'admin' | 'env';
};

function parseImageModelFallbackChain(): string[] {
  const raw = getVisualAssetModelFallbackChainRaw()
    || `${getVisualAssetDefaultModel()},${getVisualAssetFallbackModel()}`;
  const seen = new Set<string>();
  const models: string[] = [];
  for (const part of raw.split(',')) {
    const model = part.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push(model);
  }
  if (models.length === 0) {
    models.push(getVisualAssetDefaultModel() || 'z-image-turbo');
  }
  return models;
}

export function resolveRuntimeLlmProviders(purpose: LlmProviderPurpose): RuntimeLlmProvider[] {
  const configured = listLlmProviderConfigs({ purpose })
    .filter((config) => config.enabled && Boolean(config.apiKey))
    .map((config) => ({
      id: config.id,
      name: config.name,
      purpose: config.purpose,
      baseUrl: normalizeProviderBaseUrl(config.baseUrl),
      apiKey: config.apiKey!,
      model: config.model,
      priority: config.priority,
      timeoutMs: config.timeoutMs || (purpose === 'image' ? getVisualAssetGenerationTimeoutMs() : 45_000),
      maxRetries: config.maxRetries,
      source: 'admin' as const,
    }));

  const envApiKey = purpose === 'image' ? getVisualAssetApiKey() : getApiKey();
  const envBaseUrl = purpose === 'image' ? getVisualAssetApiBaseUrl() : getApiBaseUrl();
  const envTimeout = purpose === 'image' ? getVisualAssetGenerationTimeoutMs() : 45_000;
  const envProviders: RuntimeLlmProvider[] = [];

  if (envApiKey) {
    if (purpose === 'image') {
      // Expand chain so requestVisualAssetImage can try z-image-turbo then gpt-image-2.
      parseImageModelFallbackChain().forEach((model, index) => {
        envProviders.push({
          id: index === 0 ? `env_${purpose}` : `env_${purpose}_fallback_${index}`,
          name: index === 0
            ? `Env Visual Asset (${model})`
            : `Env Visual Asset fallback (${model})`,
          purpose,
          baseUrl: normalizeProviderBaseUrl(envBaseUrl),
          apiKey: envApiKey,
          model,
          priority: 10_000 + index,
          timeoutMs: envTimeout,
          maxRetries: 0,
          source: 'env',
        });
      });
    } else {
      envProviders.push({
        id: `env_${purpose}`,
        name: 'Env Article Provider',
        purpose,
        baseUrl: normalizeProviderBaseUrl(envBaseUrl),
        apiKey: envApiKey,
        model: getContentGenerationModel(),
        priority: 10_000,
        timeoutMs: envTimeout,
        maxRetries: 0,
        source: 'env',
      });
    }
  }

  return [...configured, ...envProviders]
    .filter((provider) => provider.baseUrl && provider.model && provider.apiKey)
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function ensureDefaultLlmProviderConfigs(userId = 'system_llm_provider_seed') {
  const primaryModel = process.env.LLM_IMAGE_PRIMARY_MODEL || getVisualAssetDefaultModel() || 'z-image-turbo';
  const fallbackModel = process.env.LLM_IMAGE_FALLBACK_MODEL || getVisualAssetFallbackModel() || 'gpt-image-2';
  const primaryBase = process.env.LLM_IMAGE_PRIMARY_BASE_URL || 'https://ttqq.inping.com/v1';
  const primaryKey = process.env.LLM_IMAGE_PRIMARY_API_KEY
    || process.env.VISUAL_ASSET_PRIMARY_API_KEY
    || null;

  const primaryId = 'llm_provider_image_ttqq_z_image_turbo';
  const fallbackId = 'llm_provider_image_ttqq_gpt_image_2';
  const legacyId = 'llm_provider_image_ttqq_gpt_image_2_my';

  const existing = listLlmProviderConfigs({ purpose: 'image', includeDisabled: true });
  const hasPrimary = existing.some((config) => config.id === primaryId);
  const hasFallback = existing.some((config) => config.id === fallbackId);
  const legacy = existing.find((config) => config.id === legacyId);

  // Migrate legacy gpt-image-2-my primary → z-image-turbo (keep api key / base).
  if (legacy && !hasPrimary) {
    saveLlmProviderConfig({
      id: primaryId,
      purpose: 'image',
      name: 'ttqq image primary (z-image-turbo)',
      baseUrl: legacy.baseUrl || primaryBase,
      model: primaryModel,
      apiKey: legacy.apiKey || primaryKey,
      priority: 10,
      enabled: true,
      timeoutMs: legacy.timeoutMs || getVisualAssetGenerationTimeoutMs(),
      maxRetries: legacy.maxRetries ?? 0,
      meta: {
        ...(legacy.meta || {}),
        seeded: true,
        role: 'primary_image_generation',
        migratedFrom: legacyId,
        chain: 'z-image-turbo→gpt-image-2',
      },
    }, userId);
    // Demote legacy row so it does not race as first choice.
    saveLlmProviderConfig({
      id: legacyId,
      purpose: 'image',
      name: legacy.name || 'ttqq image legacy',
      baseUrl: legacy.baseUrl || primaryBase,
      model: fallbackModel,
      apiKey: legacy.apiKey || primaryKey,
      priority: 30,
      enabled: false,
      timeoutMs: legacy.timeoutMs || getVisualAssetGenerationTimeoutMs(),
      maxRetries: legacy.maxRetries ?? 0,
      meta: {
        ...(legacy.meta || {}),
        role: 'legacy_image_generation',
        supersededBy: primaryId,
      },
    }, userId);
  } else if (!hasPrimary) {
    saveLlmProviderConfig({
      id: primaryId,
      purpose: 'image',
      name: 'ttqq image primary (z-image-turbo)',
      baseUrl: primaryBase,
      model: primaryModel,
      apiKey: primaryKey,
      priority: 10,
      enabled: true,
      timeoutMs: getVisualAssetGenerationTimeoutMs(),
      maxRetries: 0,
      meta: {
        seeded: true,
        role: 'primary_image_generation',
        chain: 'z-image-turbo→gpt-image-2',
      },
    }, userId);
  } else {
    // Keep primary model aligned with env default when still on old gpt-image names.
    const primary = existing.find((config) => config.id === primaryId);
    if (primary && /gpt-image/i.test(primary.model) && primaryModel === 'z-image-turbo') {
      saveLlmProviderConfig({
        id: primaryId,
        purpose: 'image',
        name: primary.name || 'ttqq image primary (z-image-turbo)',
        baseUrl: primary.baseUrl || primaryBase,
        model: primaryModel,
        apiKey: primary.apiKey || primaryKey,
        priority: 10,
        enabled: primary.enabled !== false,
        timeoutMs: primary.timeoutMs || getVisualAssetGenerationTimeoutMs(),
        maxRetries: primary.maxRetries ?? 0,
        meta: {
          ...(primary.meta || {}),
          role: 'primary_image_generation',
          chain: 'z-image-turbo→gpt-image-2',
        },
      }, userId);
    }
  }

  if (!hasFallback) {
    const keySource = existing.find((config) => config.apiKey)?.apiKey || primaryKey;
    const baseSource = existing.find((config) => config.baseUrl)?.baseUrl || primaryBase;
    saveLlmProviderConfig({
      id: fallbackId,
      purpose: 'image',
      name: 'ttqq image fallback (gpt-image-2)',
      baseUrl: baseSource,
      model: fallbackModel,
      apiKey: keySource,
      priority: 20,
      enabled: true,
      timeoutMs: getVisualAssetGenerationTimeoutMs(),
      maxRetries: 0,
      meta: {
        seeded: true,
        role: 'fallback_image_generation',
        chain: 'z-image-turbo→gpt-image-2',
      },
    }, userId);
  }
}
