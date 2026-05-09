import {
  getDefaultModel,
  getModelFallbackChainEnv,
  getReportModelFallbackChainEnv,
  getReportNarrativeModelFallbackChainEnv,
} from '@/lib/env';

export type LlmFallbackScope = 'report' | 'agent' | 'chat' | 'content';

// v5-A1 + v5-audit (2026-05-08): 从 env 读取 fallback chain，不再硬编码 'auto'
// 生产链路：grok-420-fast → gpt-5.2（'auto' 是死链路，见 v5-A1 commit）

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
      ? getReportNarrativeModelFallbackChainEnv()  // content 用 narrative chain 作为默认
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
