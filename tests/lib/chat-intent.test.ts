import {
  getChatIntentPreset,
  getChatIntentSummaryHint,
  getChatIntentSystemPrompt,
  normalizeChatIntent,
} from '@/lib/chat-intent';

describe('chat intent presets', () => {
  it('normalizes and resolves supported intents', () => {
    expect(normalizeChatIntent('event-simulation')).toBe('event-simulation');
    expect(normalizeChatIntent('event-verdict')).toBe('event-verdict');
    expect(normalizeChatIntent('unknown')).toBeUndefined();
    expect(normalizeChatIntent('')).toBeUndefined();
  });

  it('returns preset content for premium intents', () => {
    const preset = getChatIntentPreset('meihua-enhancement');

    expect(preset?.entryLabel).toContain('梅花易');
    expect(preset?.questions.length).toBeGreaterThan(1);
    expect(getChatIntentSystemPrompt('event-review')).toContain('复盘');
    expect(getChatIntentSummaryHint('event-verdict')).toContain('断事专项');
  });
});
