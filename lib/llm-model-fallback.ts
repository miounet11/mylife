const DEFAULT_MODEL_CHAIN = ['grok-420-fast', 'gpt-5.2', 'auto'] as const;

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

export function getModelFallbackChain(preferredModel?: string | null) {
  const configuredChain = (process.env.MODEL_FALLBACK_CHAIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const defaultModel = normalizeModel(process.env.DEFAULT_MODEL);
  const defaultChain = defaultModel && defaultModel !== 'auto'
    ? [defaultModel, 'gpt-5.2', 'auto']
    : [...DEFAULT_MODEL_CHAIN];

  if (configuredChain.length > 0) {
    return dedupeModels(preferredModel ? [preferredModel, ...configuredChain] : configuredChain);
  }

  return dedupeModels(preferredModel ? [preferredModel, ...defaultChain] : defaultChain);
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
