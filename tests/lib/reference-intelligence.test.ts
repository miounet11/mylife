import { describe, expect, test } from '@jest/globals';
import { buildReferenceIntelligencePack, classifyReferenceEvidence } from '@/lib/reference-intelligence';

describe('reference intelligence', () => {
  test('classifies source documents into tian shi, di li and ren he evidence', () => {
    const evidence = classifyReferenceEvidence({
      sourceDocuments: [
        {
          id: 'src_1',
          sourceType: 'rss',
          platform: 'google-news',
          sourceId: 'google-news-yijing',
          canonicalUrl: 'https://news.example.com/a',
          title: '真太阳时与行业周期一起影响职业时机',
          author: null,
          publishedAt: '2026-03-10T00:00:00.000Z',
          language: 'zh-CN',
          summary: '围绕真太阳时、流年窗口和行业周期讨论换工作时机。',
          tags: ['真太阳时', '流年', '行业周期', '职业'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
        {
          id: 'src_2',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/1',
          title: '城市迁移和办公环境会改变地利吗',
          author: null,
          publishedAt: '2026-03-10T00:00:00.000Z',
          language: 'zh-CN',
          summary: '讨论城市、风水、办公环境和定居选择。',
          tags: ['城市', '风水', '办公环境'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
        {
          id: 'src_3',
          sourceType: 'site',
          platform: 'bilibili',
          sourceId: 'bilibili-search',
          canonicalUrl: 'https://www.bilibili.com/video/1',
          title: '合作关系与贵人运到底怎么看',
          author: null,
          publishedAt: '2026-03-10T00:00:00.000Z',
          language: 'zh-CN',
          summary: '围绕合作、团队和贵人支持讨论人和。',
          tags: ['合作', '团队', '贵人'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
      ],
    });

    expect(evidence.some((item) => item.dimension === 'tianShi')).toBe(true);
    expect(evidence.some((item) => item.dimension === 'diLi')).toBe(true);
    expect(evidence.some((item) => item.dimension === 'renHe')).toBe(true);
  });

  test('builds authority profile and weighted directives from canonical texts and classics', () => {
    const pack = buildReferenceIntelligencePack({
      sourceDocuments: [
        {
          id: 'src_ctext',
          sourceType: 'site',
          platform: 'ctext',
          sourceId: 'ctext',
          canonicalUrl: 'https://ctext.org/book-of-changes',
          title: '周易原文',
          author: null,
          publishedAt: null,
          language: 'zh-CN',
          summary: '围绕卦象、四时和时位展开的经典文本。',
          tags: ['周易', '卦象', '四时'],
          rawMeta: {},
          rightsStatus: 'unknown',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
      ],
      bibliographyEntries: [
        {
          id: 'book_1',
          title: '滴天髓',
          slug: 'di-tian-sui',
          altTitles: [],
          originalTitle: null,
          author: '京图',
          translators: [],
          editors: [],
          dynastyOrPeriod: '宋',
          publicationYear: null,
          editionNote: null,
          publisher: null,
          isbn: null,
          language: 'zh-CN',
          bookType: 'classic',
          rightsStatus: 'public_domain',
          sourceUrl: 'https://openlibrary.org/books/OL1M',
          summary: '经典命理文本，涉及格局、用神和时机。',
          tags: ['经典', '用神', '时机'],
          meta: {},
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
      ],
    });

    expect(pack.authority.authorityScore).toBeGreaterThan(60);
    expect(pack.authority.classicBookCount).toBe(1);
    expect(pack.modelDirectives.length).toBeGreaterThan(0);
  });

  test('produces state vector adjustments and engine weights from evidence balance', () => {
    const pack = buildReferenceIntelligencePack({
      sourceDocuments: [
        {
          id: 'src_1',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/di-li',
          title: '迁移定居和办公环境怎么选更稳定',
          author: null,
          publishedAt: '2026-03-12T00:00:00.000Z',
          language: 'zh-CN',
          summary: '讨论城市迁移、居住环境和办公空间对发展节奏的影响，适合稳定布局。',
          tags: ['迁移', '定居', '办公环境', '适合'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
        {
          id: 'src_2',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/ren-he',
          title: '合作中怎么避免关系冲突和压力',
          author: null,
          publishedAt: '2026-03-12T00:00:00.000Z',
          language: 'zh-CN',
          summary: '围绕团队合作中的冲突、压力与误判做讨论。',
          tags: ['合作', '冲突', '压力'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
      ],
    });

    expect(pack.stateVectorAdjustment.diLiDelta).toBeGreaterThan(0);
    expect(pack.stateVectorAdjustment.renHeDelta).toBeLessThanOrEqual(0);
    expect(pack.recommendedEngineWeights.geoReferenceWeight).toBeGreaterThanOrEqual(pack.recommendedEngineWeights.humanReferenceWeight);
  });
});
