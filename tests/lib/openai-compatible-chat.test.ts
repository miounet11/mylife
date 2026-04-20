import {
  buildOpenAiCompatibleChatCompletionBody,
  isGpt5FamilyModel,
  isNativeOpenAiModel,
  resolveChatCompletionMaxTokensField,
  resolveReasoningEffortFromBudgetTokens,
  supportsTemperatureParameter,
} from '@/lib/openai-compatible-chat';

describe('openai-compatible chat helper', () => {
  it('uses OpenAI-compatible token field and strips temperature for GPT-5 models', () => {
    const body = buildOpenAiCompatibleChatCompletionBody({
      model: 'gpt-5.4',
      messages: [{ role: 'user', content: 'test' }],
      maxTokens: 320,
      temperature: 0.7,
      reasoningEffort: 'medium',
    });

    expect(body).toMatchObject({
      model: 'gpt-5.4',
      max_completion_tokens: 320,
      reasoning_effort: 'medium',
    });
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('temperature');
  });

  it('keeps standard max_tokens and temperature for non-OpenAI-compatible gateway models', () => {
    const body = buildOpenAiCompatibleChatCompletionBody({
      model: 'grok-420-fast',
      messages: [{ role: 'user', content: 'test' }],
      maxTokens: 480,
      temperature: 0.55,
    });

    expect(body).toMatchObject({
      model: 'grok-420-fast',
      max_tokens: 480,
      temperature: 0.55,
    });
    expect(body).not.toHaveProperty('max_completion_tokens');
  });

  it('detects model families and reasoning effort defaults correctly', () => {
    expect(isNativeOpenAiModel('gpt-5.4')).toBe(true);
    expect(isNativeOpenAiModel('grok-420-fast')).toBe(false);
    expect(isGpt5FamilyModel('gpt-5.4')).toBe(true);
    expect(supportsTemperatureParameter('gpt-5.4')).toBe(false);
    expect(supportsTemperatureParameter('grok-420-fast')).toBe(true);
    expect(resolveChatCompletionMaxTokensField('gpt-5.4')).toBe('max_completion_tokens');
    expect(resolveChatCompletionMaxTokensField('grok-420-fast')).toBe('max_tokens');
    expect(resolveReasoningEffortFromBudgetTokens(2000)).toBe('low');
    expect(resolveReasoningEffortFromBudgetTokens(5000)).toBe('medium');
    expect(resolveReasoningEffortFromBudgetTokens(20000)).toBe('high');
  });
});
