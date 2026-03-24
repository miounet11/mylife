export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

const DEFAULT_MODEL_CHAIN = ['grok-420-fast', 'gpt-5.2', 'auto'] as const;
const DEFAULT_REPORT_MODEL_CHAIN = ['auto', 'grok-420-fast'] as const;

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
    ? (process.env.REPORT_MODEL_FALLBACK_CHAIN || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (configuredScopeChain.length > 0) {
    return configuredScopeChain;
  }

  const configuredChain = (process.env.MODEL_FALLBACK_CHAIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (configuredChain.length > 0) {
    return configuredChain;
  }

  if (scope === 'report') {
    return [...DEFAULT_REPORT_MODEL_CHAIN];
  }

  const defaultModel = normalizeModel(process.env.DEFAULT_MODEL);
  return defaultModel && defaultModel !== 'auto'
    ? [defaultModel, 'gpt-5.2', 'auto']
    : [...DEFAULT_MODEL_CHAIN];
}

export function getModelFallbackChain(preferredModel?: string | null, scope?: LlmFallbackScope) {
  const defaultChain = getDefaultChain(scope);
  return dedupeModels(preferredModel ? [preferredModel, ...defaultChain] : defaultChain);
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
