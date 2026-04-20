import {
  getDefaultModel,
  getModelFallbackChainEnv,
  getReportModelFallbackChainEnv,
  getReportNarrativeModelFallbackChainEnv,
} from '@/lib/env';

export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

const PRIMARY_REASONING_MODEL = 'gpt-5.4';
const FALLBACK_REASONING_MODEL = 'gpt-5.2-codex';
const FAST_CONTENT_MODEL = 'grok-420-fast';

const DEFAULT_MODEL_CHAIN = [PRIMARY_REASONING_MODEL, FALLBACK_REASONING_MODEL, FAST_CONTENT_MODEL, 'auto'] as const;
const DEFAULT_REPORT_MODEL_CHAIN = [PRIMARY_REASONING_MODEL, FALLBACK_REASONING_MODEL, 'auto'] as const;
const DEFAULT_REPORT_NARRATIVE_MODEL_CHAIN = [PRIMARY_REASONING_MODEL, FALLBACK_REASONING_MODEL, 'auto'] as const;

function normalizeModel(value?: string | null) {
  const model = (value || '').trim();
  return model || null;
}

function dedupeModels(models: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of models) {
    const model = normalizeModel(item);
    if (!model || seen.has(model)) continue;
    seen.add(model);
    result.push(model);
  }

  return result;
}

function getDefaultChain(scope?: LlmFallbackScope) {
  const configuredScopeChain = scope === 'report'
    ? getReportModelFallbackChainEnv()
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (configuredScopeChain.length > 0) {
    return configuredScopeChain;
  }

  const configuredChain = getModelFallbackChainEnv()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (configuredChain.length > 0) {
    return configuredChain;
  }

  if (scope === 'report') {
    return [...DEFAULT_REPORT_MODEL_CHAIN];
  }

  const defaultModel = normalizeModel(getDefaultModel());
  return defaultModel && defaultModel !== 'auto'
    ? dedupeModels([defaultModel, PRIMARY_REASONING_MODEL, FALLBACK_REASONING_MODEL, FAST_CONTENT_MODEL, 'auto'])
    : [...DEFAULT_MODEL_CHAIN];
}

export function getModelFallbackChain(preferredModel?: string | null, scope?: LlmFallbackScope) {
  const defaultChain = getDefaultChain(scope);
  return dedupeModels(preferredModel ? [preferredModel, ...defaultChain] : defaultChain);
}

export function getReportNarrativeFallbackChain(preferredModel?: string | null) {
  const configuredChain = getReportNarrativeModelFallbackChainEnv()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const defaultChain = configuredChain.length > 0
    ? configuredChain
    : [...DEFAULT_REPORT_NARRATIVE_MODEL_CHAIN];

  return dedupeModels(preferredModel ? [preferredModel, ...defaultChain] : defaultChain);
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
