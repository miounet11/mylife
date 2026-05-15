import {
  getContentGenerationModelFallbackChainRaw,
  getDefaultModel,
  getModelFallbackChainEnv,
  getReportModelFallbackChainEnv,
  getReportNarrativeModelFallbackChainEnv,
} from '@/lib/env';

export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

// 从 env 读取 fallback chain；默认生产链路由 lib/env.ts 统一维护。

function parseChain(raw: string, primaryModel: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  const push = (model: string) => {
    const trimmed = model.trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    chain.push(trimmed);
  };
  push(primaryModel);
  raw.split(',').forEach(push);
  return chain;
}

export function getModelFallbackChain(_preferredModel?: string | null, scope?: LlmFallbackScope) {
  const primary = _preferredModel || getDefaultModel();
  const rawChain = scope === 'report'
    ? getReportModelFallbackChainEnv()
    : scope === 'content'
      ? getContentGenerationModelFallbackChainRaw()
      : getModelFallbackChainEnv();
  return parseChain(rawChain, primary);
}

export function getReportNarrativeFallbackChain(_preferredModel?: string | null) {
  const primary = _preferredModel || getDefaultModel();
  return parseChain(getReportNarrativeModelFallbackChainEnv(), primary);
}

export function formatModelAttemptLabel(models: string[]) {
  return models.length ? models.join(' -> ') : 'no-model-configured';
}
