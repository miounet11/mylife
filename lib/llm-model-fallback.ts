export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

const PRIMARY_TEXT_MODEL = 'grok-420-fast';
const GLOBAL_FALLBACK_CHAIN = [PRIMARY_TEXT_MODEL, 'auto', 'gpt-5.2'] as const;

function getUnifiedChain() {
  return [...GLOBAL_FALLBACK_CHAIN];
}

export function getModelFallbackChain(_preferredModel?: string | null, _scope?: LlmFallbackScope) {
  return getUnifiedChain();
}

export function getReportNarrativeFallbackChain(_preferredModel?: string | null) {
  return getUnifiedChain();
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
