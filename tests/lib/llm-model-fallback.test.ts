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

  it('defaults to the unified global model fallback chain', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('keeps the unified chain when a preferred model is passed', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain('gpt-5.4')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('ignores custom fallback chains and keeps the unified order', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'gpt-5.4,gpt-5.2-codex,grok-420-fast,auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getModelFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('uses the unified fallback chain for report scope by default', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getModelFallbackChain('auto', 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('uses the unified fallback chain for all scopes', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'legacy-model,auto';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'legacy-report-model,auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getModelFallbackChain('grok-420-fast', 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getModelFallbackChain('grok-420-fast', 'chat')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('ignores old report-specific fallback chains', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'legacy-model, auto';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'auto,gpt-5.2';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getModelFallbackChain('grok-420-fast', 'report')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('uses the unified fallback chain for report narrative followup by default', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getReportNarrativeFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('does not let legacy codex model ids change the unified order', async () => {
    process.env.DEFAULT_MODEL = 'gpt-5.2-codex';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('ignores narrative-specific fallback chains', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN = 'gpt-5.4,auto';

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
    expect(getReportNarrativeFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });
});
