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
    expect(normalizeChatIntent('palmistry-reading')).toBe('palmistry-reading');
    expect(normalizeChatIntent('home-layout-diagnosis')).toBe('home-layout-diagnosis');
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

  it('returns professional boundary copy for home layout diagnosis', () => {
    const preset = getChatIntentPreset('home-layout-diagnosis');
    const systemPrompt = getChatIntentSystemPrompt('home-layout-diagnosis');

    expect(preset?.entryLabel).toBe('户型图诊断');
    expect(preset?.placeholder).toContain('上传户型图');
    expect(systemPrompt).toContain('禅院宅居断事师');
    expect(systemPrompt).toContain('门线冲');
    expect(systemPrompt).toContain('动静分区');
    expect(systemPrompt).toContain('洁污分区');
    expect(systemPrompt).toContain('方向假设：上北下南，左西右东，仅供结构分析参考');
    expect(systemPrompt).toContain('不说大吉、大凶、必灾、注定');
    expect(getChatIntentSummaryHint('home-layout-diagnosis')).toContain('户型图片和可见结构');
  });

  it('returns professional safety copy for palmistry reading', () => {
    const preset = getChatIntentPreset('palmistry-reading');
    const systemPrompt = getChatIntentSystemPrompt('palmistry-reading');

    expect(preset?.entryLabel).toBe('手相结构观察');
    expect(preset?.placeholder).toContain('上传左手/右手手相照片');
    expect(systemPrompt).toContain('生命线');
    expect(systemPrompt).toContain('智慧线');
    expect(systemPrompt).toContain('感情线');
    expect(systemPrompt).toContain('健康线”只能作为传统手相线名使用');
    expect(systemPrompt).toContain('严禁从手相照片推断疾病、寿命');
    expect(getChatIntentSummaryHint('palmistry-reading')).toContain('可见掌纹、掌丘、手型和照片质量');
  });
});
