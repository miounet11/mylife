import { normalizeGeneratedContentDraft, sanitizeContentSlug } from '@/lib/content-generation';

describe('content generation helpers', () => {
  it('sanitizes english slug and falls back when unavailable', () => {
    expect(sanitizeContentSlug('Career Decision 2026', 'knowledge')).toBe('career-decision-2026');
    expect(sanitizeContentSlug('%%%中文%%%', 'knowledge')).toMatch(/^knowledge-/);
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
});
