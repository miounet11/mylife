describe('llm model fallback', () => {
  const originalDefaultModel = process.env.DEFAULT_MODEL;
  const originalFallbackChain = process.env.MODEL_FALLBACK_CHAIN;

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

    jest.resetModules();
  });

  it('defaults to grok-420-fast then gpt-5.2 then auto', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.2', 'auto']);
  });

  it('lets an explicit preferred model lead while keeping fallback chain', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    delete process.env.MODEL_FALLBACK_CHAIN;

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain('grok-420-fast')).toEqual(['grok-420-fast', 'gpt-5.2', 'auto']);
  });

  it('uses explicit fallback chain when configured', async () => {
    process.env.DEFAULT_MODEL = 'auto';
    process.env.MODEL_FALLBACK_CHAIN = 'grok-420-fast, gpt-5.2, auto';

    const { getModelFallbackChain } = await import('@/lib/llm-model-fallback');
    expect(getModelFallbackChain()).toEqual(['grok-420-fast', 'gpt-5.2', 'auto']);
    expect(getModelFallbackChain('gpt-5.2')).toEqual(['gpt-5.2', 'grok-420-fast', 'auto']);
  });
});
