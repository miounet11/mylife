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

  it('defaults to grok primary with auto fallback for the general chain', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto']);
  });

  it('lets an explicit preferred model lead while keeping fallback chain', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto']);
  });

  it('uses explicit fallback chain when configured', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'auto']);
    expect(getModelFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto']);
  });

  it('uses grok primary with auto fallback for report scope by default', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto']);
    expect(getModelFallbackChain('auto', 'report')).toEqual(['auto', 'grok-420-fast']);
  });

  it('lets report scope use its own configured fallback chain', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'auto';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto']);
    expect(getModelFallbackChain('grok-420-fast', 'report')).toEqual(['grok-420-fast', 'auto']);
    expect(getModelFallbackChain('grok-420-fast', 'chat')).toEqual(['grok-420-fast', 'auto']);
  });

  it('keeps report scope independent from a configured global chain', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.MODEL_FALLBACK_CHAIN = 'legacy-model, auto';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['grok-420-fast', 'auto']);
    expect(getModelFallbackChain('grok-420-fast', 'report')).toEqual(['grok-420-fast', 'auto']);
  });

  it('uses grok primary with auto fallback for report narrative followup by default', async () => {
    delete process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['grok-420-fast', 'auto']);
    expect(getReportNarrativeFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto']);
  });

  it('normalizes legacy codex model ids to compatible reasoning ids', async () => {
    process.env.DEFAULT_MODEL = 'gpt-5.2-codex';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['gpt-5.2', 'auto']);
  });

  it('lets narrative followup use its own configured chain', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN = 'auto';

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['grok-420-fast', 'auto']);
    expect(getReportNarrativeFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'auto']);
  });
});
