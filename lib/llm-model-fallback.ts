import {
  getDefaultModel,
  getModelFallbackChainEnv,
  getReportModelFallbackChainEnv,
  getReportNarrativeModelFallbackChainEnv,
} from '@/lib/env';

export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

const PRIMARY_TEXT_MODEL = 'grok-420-fast';

const MODEL_COMPATIBILITY_ALIASES: Record<string, string> = {
  'gpt-5.2-codex': 'gpt-5.2',
};

const DEFAULT_MODEL_CHAIN = [PRIMARY_TEXT_MODEL, 'auto'] as const;
const DEFAULT_REPORT_MODEL_CHAIN = [PRIMARY_TEXT_MODEL, 'auto'] as const;
const DEFAULT_REPORT_NARRATIVE_MODEL_CHAIN = [PRIMARY_TEXT_MODEL, 'auto'] as const;

function normalizeModel(value?: string | null) {
  const model = (value || '').trim();
  if (!model) {
    return null;
  }

  return MODEL_COMPATIBILITY_ALIASES[model.toLowerCase()] || model;
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
  const defaultModel = normalizeModel(getDefaultModel());
  const configuredScopeChain = scope === 'report'
    ? getReportModelFallbackChainEnv()
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (configuredScopeChain.length > 0) {
    return defaultModel && defaultModel !== 'auto'
      ? dedupeModels([defaultModel, ...configuredScopeChain])
      : configuredScopeChain;
  }

  const configuredChain = getModelFallbackChainEnv()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (configuredChain.length > 0) {
    return defaultModel && defaultModel !== 'auto'
      ? dedupeModels([defaultModel, ...configuredChain])
      : configuredChain;
  }

  if (scope === 'report') {
    return [...DEFAULT_REPORT_MODEL_CHAIN];
  }

  return defaultModel && defaultModel !== 'auto'
    ? dedupeModels([defaultModel, 'auto'])
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

  const defaultModel = normalizeModel(getDefaultModel());
  const defaultChain = configuredChain.length > 0
    ? defaultModel && defaultModel !== 'auto'
      ? dedupeModels([defaultModel, ...configuredChain])
      : configuredChain
    : [...DEFAULT_REPORT_NARRATIVE_MODEL_CHAIN];

  return dedupeModels(preferredModel ? [preferredModel, ...defaultChain] : defaultChain);
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
