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

  it('defaults to reasoning-first general chain', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['gpt-5.4', 'gpt-5.2-codex', 'grok-420-fast', 'auto']);
  });

  it('lets an explicit preferred model lead while keeping fallback chain', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'gpt-5.4', 'gpt-5.2-codex', 'auto']);
  });

  it('uses explicit fallback chain when configured', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    process.env.MODEL_FALLBACK_CHAIN = 'grok-420-fast, gpt-5.2, auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.2', 'auto']);
    expect(getModelFallbackChain('gpt-5.2')).toEqual(['gpt-5.2', 'grok-420-fast', 'auto']);
  });

  it('uses a reasoning-first default chain for report scope', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['gpt-5.4', 'gpt-5.2-codex', 'auto']);
    expect(getModelFallbackChain('auto', 'report')).toEqual(['auto', 'gpt-5.4', 'gpt-5.2-codex']);
  });

  it('lets report scope use its own configured fallback chain', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    process.env.MODEL_FALLBACK_CHAIN = 'grok-420-fast, gpt-5.2, auto';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'auto, grok-420-fast';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['auto', 'grok-420-fast']);
    expect(getModelFallbackChain(undefined, 'chat')).toEqual(['grok-420-fast', 'gpt-5.2', 'auto']);
  });

  it('keeps report scope independent from a broken default model', async () => {
    process.env.DEFAULT_MODEL = 'grok-420-fast';
    process.env.REPORT_MODEL_FALLBACK_CHAIN = 'gpt-5.4, gpt-5.2-codex, auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain(undefined, 'report')).toEqual(['gpt-5.4', 'gpt-5.2-codex', 'auto']);
    expect(getModelFallbackChain('grok-420-fast', 'report')).toEqual(['grok-420-fast', 'gpt-5.4', 'gpt-5.2-codex', 'auto']);
  });

  it('uses a reasoning-first narrative chain for report followup by default', async () => {
    delete process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['gpt-5.4', 'gpt-5.2-codex', 'auto']);
    expect(getReportNarrativeFallbackChain('gpt-5.2-codex')).toEqual(['gpt-5.2-codex', 'gpt-5.4', 'auto']);
  });

  it('lets narrative followup use its own configured chain', async () => {
    process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN = 'auto, gpt-5.2';

    const { getReportNarrativeFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getReportNarrativeFallbackChain()).toEqual(['auto', 'gpt-5.2']);
  });
});
