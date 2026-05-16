describe('llm model fallback', () => {
  const originalDefaultModel = process.env.DEFAULT_MODEL;
  const originalFallbackChain = process.env.MODEL_FALLBACK_CHAIN;
  const originalReportFallbackChain = process.env.REPORT_MODEL_FALLBACK_CHAIN;
  const originalReportNarrativeFallbackChain = process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;

  afterEach(() => {
    if (typeof originalDefaultModel === 'undefined') {
      delete process.env.DEFAULT_MODEL;
    } else {
      process.env.DEFAULT_MODEL = originalDefaultModel;
    }

    if (typeof originalFallbackChain === 'undefined') {
      delete process.env.MODEL_FALLBACK_CHAIN;
    } else {
      process.env.MODEL_FALLBACK_CHAIN = originalFallbackChain;
    }

    if (typeof originalReportFallbackChain === 'undefined') {
      delete process.env.REPORT_MODEL_FALLBACK_CHAIN;
    } else {
      process.env.REPORT_MODEL_FALLBACK_CHAIN = originalReportFallbackChain;
    }

    if (typeof originalReportNarrativeFallbackChain === 'undefined') {
      delete process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;
    } else {
      process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN = originalReportNarrativeFallbackChain;
    }

    jest.resetModules();
  });

  // v5-D1 (2026-05-16): 主模型从 gpt-5.4-mini-my 切到 gpt-4.1-mini-2025-04-14。
  // 真实流量证据：gpt-4.1-mini @ report 93%，gpt-5.4-mini-my @ report 9%（500/429/EMPTY_CONTENT）。
  // gpt-5.4-mini-my 降为最后兜底。

  it('default chain (no env) starts from default model + safe fallback', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['gpt-4.1-mini-2025-04-14', 'lingsi1.0', 'gpt-5.4-mini-my']);
  });

  it('honors a preferred model as the chain head', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    // preferredModel 优先于 DEFAULT_MODEL，fallback chain 不重复携带默认主模型
    expect(getModelFallbackChain('gpt-5.4')).toEqual(['gpt-5.4', 'lingsi1.0', 'gpt-5.4-mini-my']);
  });

  it('respects MODEL_FALLBACK_CHAIN env var', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'gpt-5.4,gpt-5.2';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.4', 'gpt-5.2']);
  });

  it('deduplicates models across primary + chain', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'grok-420-fast,gpt-5.2,grok-420-fast';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.2']);
  });

  it('uses report-scoped env var for report scope', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'legacy';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'gpt-5.2';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    // report scope 用 REPORT_MODEL_FALLBACK_CHAIN
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'gpt-5.2']);
    // 默认 scope 用 MODEL_FALLBACK_CHAIN
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'legacy']);
  });

  it('falls back to MODEL_FALLBACK_CHAIN when report-specific not set', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'gpt-5.2';
    delete process.env.REPORT_MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'gpt-5.2']);
  });

  it('uses narrative-scoped env for getReportNarrativeFallbackChain', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN = 'gpt-5.2';

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.2']);
  });

  it('keeps auto as the last default escape hatch', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['gpt-4.1-mini-2025-04-14', 'lingsi1.0', 'gpt-5.4-mini-my']);
  });

  it('still loads "auto" if explicitly configured (escape hatch)', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'auto,gpt-5.2';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    // 如果运维真的想要 'auto'（比如某个新测试 env），还是支持的
    // 关键是不再硬编码
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });
});
