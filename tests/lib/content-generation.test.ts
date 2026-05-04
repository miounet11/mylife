import {
  buildReasoningPlanPrompt,
  getEffectiveContentGenerationTimeoutMs,
  isAutomatedGrowthPlatform,
  normalizeGeneratedContentDraft,
  resolveContentGenerationLlmConfig,
  sanitizeContentSlug,
} from '@/lib/content-generation';

describe('content generation helpers', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sanitizes english slug and falls back when unavailable', () => {
    expect(sanitizeContentSlug('Career Decision 2026', 'knowledge')).toBe('career-decision-2026');
    expect(sanitizeContentSlug('%%%中文%%%', 'knowledge')).toMatch(/^knowledge-/);
  });

  it('prefers explicit content generation models for long-form drafts', () => {
    process.env = {
      ...originalEnv,
      CONTENT_GENERATION_MODEL: 'grok-420-fast',
      CONTENT_GENERATION_MODEL_FALLBACK_CHAIN: 'auto',
      CONTENT_GENERATION_MAX_TOKENS: '2600',
    };

    expect(resolveContentGenerationLlmConfig()).toEqual({
      model: 'grok-420-fast',
      modelChain: ['grok-420-fast', 'auto'],
      maxTokens: 2600,
      disableHealthReorder: true,
    });
  });

  it('defaults socratic and segmented generation to enabled', () => {
    process.env = {
      ...originalEnv,
    };

    expect(resolveContentGenerationLlmConfig()).toEqual(expect.objectContaining({
      model: 'grok-420-fast',
      modelChain: ['grok-420-fast', 'auto'],
    }));
    expect(buildReasoningPlanPrompt({
      topic: '测试主题',
    }, 'knowledge', null).system).toContain('苏格拉底式');
  });

  it('treats public growth lanes as automated fast-draft platforms', () => {
    expect(isAutomatedGrowthPlatform('public-growth')).toBe(true);
    expect(isAutomatedGrowthPlatform('public-growth-wave2')).toBe(true);
    expect(isAutomatedGrowthPlatform('public-growth-global')).toBe(true);
    expect(isAutomatedGrowthPlatform('seo')).toBe(false);
  });

  it('caps automated growth timeout to keep scheduled runs responsive', () => {
    process.env = {
      ...originalEnv,
      CONTENT_GENERATION_TIMEOUT_MS: '32000',
    };

    expect(getEffectiveContentGenerationTimeoutMs({ platform: 'public-growth' })).toBe(8000);
    expect(getEffectiveContentGenerationTimeoutMs({ platform: 'seo' })).toBe(32000);
  });

  it('builds socratic reasoning prompts before long-form writing', () => {
    const prompt = buildReasoningPlanPrompt({
      topic: 'AI 时代命理内容站如何建立可信度',
      platform: 'seo',
      market: '海外华人',
      locale: 'zh-CN',
    }, 'knowledge', null);

    expect(prompt.system).toContain('先不要直接写文章');
    expect(prompt.system).toContain('什么让这种内容有效');
    expect(prompt.user).toContain('请先完成一份内容推理方案');
    expect(prompt.user).toContain('sectionGoals');
    expect(prompt.user).toContain('conversionBridge');
  });

  it('normalizes incomplete generated content into a valid draft', () => {
    const draft = normalizeGeneratedContentDraft({
      raw: {
        title: '2026 年换工作怎么看',
        slug: 'career-switch-2026',
        tags: ['换工作', '职业选择'],
        sections: [
          {
            title: '只有一个 section',
            paragraphs: ['这会触发 fallback。'],
          },
        ],
      },
      input: {
        topic: '2026 年换工作怎么看',
        platform: 'seo',
        keywords: ['跳槽', '时机'],
        status: 'draft',
      },
      contentType: 'knowledge',
      subtype: null,
      llmUsed: true,
    });

    expect(draft.slug).toBe('career-switch-2026');
    expect(draft.readTime).toContain('分钟');
    expect(draft.sections.length).toBeGreaterThanOrEqual(4);
    expect(draft.excerpt.length).toBeGreaterThanOrEqual(60);
    expect(draft.seoDescription.length).toBeGreaterThanOrEqual(56);
    expect(draft.source).toBe('agent-llm:seo');
    expect(draft.tags).toEqual(expect.arrayContaining(['换工作', '职业选择']));
  });

  it('replaces editorial meta sections with public-facing fallback sections', () => {
    const draft = normalizeGeneratedContentDraft({
      raw: {
        title: 'AI时代职场替代焦虑持续放大的原因及普通人优先判断的核心变量',
        slug: 'ai-anxiety-test',
        tags: ['AI焦虑', '职业决策', '职场替代', '时间窗口'],
        sections: [
          {
            title: '如何转成个人分析',
            paragraphs: ['这段会被替换，因为明显带有后台承接话术。', '第二段也不应该直接出现在公开文章里。'],
          },
          {
            title: '用户下一步应该做什么',
            paragraphs: ['内容自动化不该直接暴露给读者。', '这一页为什么值得被发布也不适合公开。'],
          },
          {
            title: '用户真正卡在哪里',
            paragraphs: ['这段保留。', '第二段也保留。'],
          },
          {
            title: '为什么这个案例值得看',
            paragraphs: ['这段也应该被替换。', '第二段同样应该被替换。'],
          },
        ],
      },
      input: {
        topic: 'AI时代的替代焦虑为什么会持续放大，普通职场人真正该先判断什么',
        platform: 'public-growth-wave2',
        locale: 'zh-CN',
        market: '城市职场用户',
        status: 'draft',
      },
      contentType: 'case',
      subtype: null,
      llmUsed: true,
    });

    expect(draft.sections[0]?.title).toBe('这类焦虑为什么会持续放大');
    expect(draft.sections[1]?.title).toBe('真正该先判断哪些变量');
    expect(draft.sections[3]?.title).toBe('怎样把判断转成下一步行动');
    expect(draft.sections.map((section) => section.title)).not.toContain('这一页为什么值得被发布');
  });

  it('builds locale-aware fallback drafts for traditional chinese markets', () => {
    const draft = normalizeGeneratedContentDraft({
      raw: null,
      input: {
        topic: '香港用户在转工、升职、行业变化面前，怎样判断事业时机和风险窗口',
        platform: 'public-growth',
        keywords: ['香港', '轉工', '事業', '時機'],
        locale: 'zh-HK',
        market: '香港用户',
        status: 'draft',
      },
      contentType: 'case',
      subtype: null,
      llmUsed: false,
    });

    expect(draft.title).toContain('案例拆解');
    expect(draft.excerpt).toContain('香港用户');
    expect(draft.seoTitle).toContain('一般使用者');
    expect(draft.seoDescription).toContain('風險');
    expect(draft.sections[0]?.title).toBe('這類焦慮為什麼會持續放大');
    expect(draft.sections[0]?.paragraphs[0]).toContain('香港用户');
    expect(draft.sections.every((section) => section.paragraphs.every((paragraph) => paragraph.length >= 36))).toBe(true);
    expect(draft.source).toBe('agent-fallback:public-growth');
  });

  it('builds english fallback drafts for global audiences', () => {
    const draft = normalizeGeneratedContentDraft({
      raw: null,
      input: {
        topic: 'How Bazi can help professionals judge career timing without replacing real-world judgment',
        platform: 'public-growth-global',
        keywords: ['Bazi career timing', 'career uncertainty', 'decision quality'],
        locale: 'en-US',
        market: 'English-speaking professionals / globally curious readers',
        status: 'draft',
      },
      contentType: 'knowledge',
      subtype: null,
      llmUsed: false,
    });

    expect(draft.title).toContain('Deep Dive');
    expect(draft.excerpt).toContain('English-speaking professionals');
    expect(draft.seoTitle).toContain('practical framework');
    expect(draft.readTime).toContain('min read');
    expect(draft.sections[0]?.title).toBe('What problem sits underneath the trend');
    expect(draft.sections[0]?.paragraphs[0]).toContain('keeps rising');
    expect(draft.sections.every((section) => section.paragraphs.every((paragraph) => paragraph.length >= 36))).toBe(true);
    expect(draft.source).toBe('agent-fallback:public-growth-global');
  });
});
