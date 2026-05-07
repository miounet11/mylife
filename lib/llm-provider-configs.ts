import { db } from '@/lib/database';
import {
  getApiBaseUrl,
  getApiKey,
  getContentGenerationModel,
  getVisualAssetApiBaseUrl,
  getVisualAssetApiKey,
  getVisualAssetDefaultModel,
  getVisualAssetGenerationTimeoutMs,
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
  const envModel = purpose === 'image' ? getVisualAssetDefaultModel() : getContentGenerationModel();
  const envProvider = envApiKey ? [{
    id: `env_${purpose}`,
    name: purpose === 'image' ? 'Env Visual Asset Provider' : 'Env Article Provider',
    purpose,
    baseUrl: normalizeProviderBaseUrl(envBaseUrl),
    apiKey: envApiKey,
    model: envModel,
    priority: 10_000,
    timeoutMs: purpose === 'image' ? getVisualAssetGenerationTimeoutMs() : 45_000,
    maxRetries: 0,
    source: 'env' as const,
  }] : [];

  return [...configured, ...envProvider]
    .filter((provider) => provider.baseUrl && provider.model && provider.apiKey)
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function ensureDefaultLlmProviderConfigs(userId = 'system_llm_provider_seed') {
  const existingImage = listLlmProviderConfigs({ purpose: 'image', includeDisabled: true })
    .some((config) => config.id === 'llm_provider_image_ttqq_gpt_image_2_my');
  if (!existingImage) {
    saveLlmProviderConfig({
      id: 'llm_provider_image_ttqq_gpt_image_2_my',
      purpose: 'image',
      name: 'ttqq image primary',
      baseUrl: process.env.LLM_IMAGE_PRIMARY_BASE_URL || 'https://ttqq.inping.com/v1',
      model: process.env.LLM_IMAGE_PRIMARY_MODEL || 'gpt-image-2-my',
      apiKey: process.env.LLM_IMAGE_PRIMARY_API_KEY || process.env.VISUAL_ASSET_PRIMARY_API_KEY || null,
      priority: 10,
      enabled: true,
      timeoutMs: getVisualAssetGenerationTimeoutMs(),
      maxRetries: 0,
      meta: {
        seeded: true,
        role: 'primary_image_generation',
      },
    }, userId);
  }
}
