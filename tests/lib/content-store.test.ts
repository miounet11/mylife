import { describe, expect, test } from '@jest/globals';
import { db } from '@/lib/database';
import {
  deleteManagedContentEntry,
  getManagedContentEntryBySlug,
  getManagedContentJourneyMeta,
  getKnowledgeArticleBySlug,
  getKnowledgeArticles,
  refreshManagedContentJourneyMetadata,
  saveManagedContentEntry,
} from '@/lib/content-store';

describe('content store public knowledge visibility', () => {
  test('hides fallback and non-public-ready synthesis content from public knowledge surfaces', () => {
    const ids = [
      'content_test_public_seed_like',
      'content_test_public_fallback_hidden',
      'content_test_public_synthesis_hidden',
      'content_test_public_synthesis_visible',
    ];

    try {
      saveManagedContentEntry({
        id: ids[0],
        contentType: 'knowledge',
        subtype: null,
        slug: 'public-manual-knowledge',
        title: '公开人工知识页',
        name: null,
        excerpt: '这是一篇可以公开展示的人工知识页，服务知识库首页与 SEO。',
        category: '人工知识',
        readTime: '6 分钟',
        tags: ['命理', '知识库', '公开'],
        featured: false,
        seoTitle: '公开人工知识页',
        seoDescription: '这是一篇可以公开展示的人工知识页。',
        sections: [
          { title: 'section 1', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 2', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 3', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 4', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id: ids[1],
        contentType: 'knowledge',
        subtype: null,
        slug: 'fallback-hidden-knowledge',
        title: '自动兜底内容',
        name: null,
        excerpt: '这是一篇不应该继续公开展示的自动兜底内容。',
        category: '自动知识',
        readTime: '6 分钟',
        tags: ['命理', '兜底', '自动'],
        featured: false,
        seoTitle: '自动兜底内容',
        seoDescription: '这是一篇不应该继续公开展示的自动兜底内容。',
        sections: [
          { title: 'section 1', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 2', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 3', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 4', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
        ],
        status: 'published',
        source: 'agent-fallback:auto-ops:automation',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id: ids[2],
        contentType: 'knowledge',
        subtype: null,
        slug: 'synthesis-hidden-knowledge',
        title: '命理基础专题总览',
        name: null,
        excerpt: '自动合成的命理基础总览，但当前仍然只有骨架，不应公开展示。',
        category: '自动专题总览',
        readTime: '6 分钟',
        tags: ['命理', '专题', '基础'],
        featured: false,
        seoTitle: '命理基础专题总览',
        seoDescription: '自动合成的命理基础总览，但当前仍然只有骨架。',
        sections: [
          { title: 'section 1', paragraphs: ['当前概念层尚薄，应继续补资料。', '第二段内容也提示仍需补资料。'] },
          { title: 'section 2', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 3', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
          { title: 'section 4', paragraphs: ['内容足够完整。', '第二段内容也足够完整。'] },
        ],
        status: 'published',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          synthesisType: 'topic-overview',
          qualityScore: 90,
          conceptCount: 4,
          questionCount: 2,
          publicationReady: true,
        },
      }, 'test_user');

      saveManagedContentEntry({
        id: ids[3],
        contentType: 'knowledge',
        subtype: null,
        slug: 'synthesis-visible-knowledge',
        title: '命理进阶专题总览',
        name: null,
        excerpt: '自动合成的命理进阶总览，当前已经具备公开展示所需的对象密度和结构。',
        category: '自动专题总览',
        readTime: '6 分钟',
        tags: ['命理', '专题', '进阶'],
        featured: false,
        seoTitle: '命理进阶专题总览',
        seoDescription: '自动合成的命理进阶总览，当前已经具备公开展示所需的对象密度和结构。',
        sections: [
          { title: 'section 1', paragraphs: ['命理进阶专题已形成稳定概念骨架。', '这一层已经能承接用户真实问题。'] },
          { title: 'section 2', paragraphs: ['围绕真太阳时、节气和排盘误差建立了稳定链接。', '继续阅读可以进入更细的专题页。'] },
          { title: 'section 3', paragraphs: ['相关问题已经足够，适合作为公开知识入口。', '也具备后续扩写空间。'] },
          { title: 'section 4', paragraphs: ['专题间桥接已建立，能承接更多互链。', '当前页面不再只是骨架。'] },
        ],
        status: 'published',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          synthesisType: 'topic-overview',
          qualityScore: 90,
          conceptCount: 4,
          questionCount: 2,
          publicationReady: true,
        },
      }, 'test_user');

      const articles = getKnowledgeArticles();
      expect(articles.map((item) => item.slug)).toContain('public-manual-knowledge');
      expect(articles.map((item) => item.slug)).toContain('synthesis-visible-knowledge');
      expect(articles.map((item) => item.slug)).not.toContain('fallback-hidden-knowledge');
      expect(articles.map((item) => item.slug)).not.toContain('synthesis-hidden-knowledge');
      expect(getKnowledgeArticleBySlug('fallback-hidden-knowledge')).toBeNull();
      expect(getKnowledgeArticleBySlug('synthesis-hidden-knowledge')).toBeNull();
      expect(getKnowledgeArticleBySlug('synthesis-visible-knowledge')?.slug).toBe('synthesis-visible-knowledge');
    } finally {
      ids.forEach((id) => {
        deleteManagedContentEntry(id);
      });
    }
  });

  test('auto-enriches journey meta for saved content without manual mapping', () => {
    const id = 'content_test_auto_journey_meta';
    const relatedKnowledgeId = 'content_test_related_knowledge_seed';
    const relatedCaseId = 'content_test_related_case_seed';

    try {
      saveManagedContentEntry({
        id: relatedKnowledgeId,
        contentType: 'knowledge',
        subtype: null,
        slug: 'career-structure-related-knowledge',
        title: '岗位结构和事业升级的判断逻辑',
        name: null,
        excerpt: '围绕事业、岗位、升职和窗口建立知识结构。',
        category: '事业判断',
        readTime: '5 分钟',
        tags: ['事业', '岗位', '升职', '窗口'],
        featured: false,
        seoTitle: '岗位结构和事业升级的判断逻辑',
        seoDescription: '相关知识种子。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id: relatedCaseId,
        contentType: 'case',
        subtype: null,
        slug: 'career-structure-related-case',
        title: '升职窗口判断案例',
        name: null,
        excerpt: '真实用户围绕岗位、升职和职业窗口做判断。',
        category: '事业判断',
        readTime: null,
        tags: ['事业', '岗位', '升职', '窗口'],
        featured: false,
        seoTitle: '升职窗口判断案例',
        seoDescription: '相关案例种子。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id,
        contentType: 'knowledge',
        subtype: null,
        slug: 'career-role-structure-test',
        title: '岗位结构和升职窗口怎么一起判断',
        name: null,
        excerpt: '这篇内容围绕事业、岗位、升职和窗口展开，用于验证自动协同关系是否会补齐。',
        category: '事业判断',
        readTime: '6 分钟',
        tags: ['事业', '岗位', '升职', '窗口'],
        featured: false,
        seoTitle: '岗位结构和升职窗口怎么一起判断',
        seoDescription: '验证自动协同关系补齐。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      const entry = getManagedContentEntryBySlug('knowledge', 'career-role-structure-test');
      const journeyMeta = getManagedContentJourneyMeta(entry);
      expect(journeyMeta.relatedReportThemes.length).toBeGreaterThan(0);
      expect(journeyMeta.relatedToolSlugs.length).toBeGreaterThan(0);
      expect(journeyMeta.relatedKnowledgeSlugs).toContain('career-structure-related-knowledge');
      expect(journeyMeta.relatedCaseSlugs).toContain('career-structure-related-case');
      expect(entry?.meta?.journeyAutomation).toBe('auto');
    } finally {
      deleteManagedContentEntry(id);
      deleteManagedContentEntry(relatedKnowledgeId);
      deleteManagedContentEntry(relatedCaseId);
    }
  });

  test('refreshManagedContentJourneyMetadata upgrades legacy content meta in place', () => {
    const knowledgeId = 'content_test_refresh_legacy_knowledge';
    const caseId = 'content_test_refresh_legacy_case';

    try {
      saveManagedContentEntry({
        id: caseId,
        contentType: 'case',
        subtype: null,
        slug: 'legacy-refresh-related-case',
        title: '关系风险案例',
        name: null,
        excerpt: '围绕关系、婚恋和互动风险的案例内容。',
        category: '关系判断',
        readTime: null,
        tags: ['关系', '婚恋', '风险'],
        featured: false,
        seoTitle: '关系风险案例',
        seoDescription: '关系风险案例描述。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {},
      }, 'test_user');

      saveManagedContentEntry({
        id: knowledgeId,
        contentType: 'knowledge',
        subtype: null,
        slug: 'legacy-refresh-source-knowledge',
        title: '关系推进和边界建立',
        name: null,
        excerpt: '围绕关系推进、边界和风险窗口的知识内容。',
        category: '关系判断',
        readTime: '6 分钟',
        tags: ['关系', '边界', '婚恋'],
        featured: false,
        seoTitle: '关系推进和边界建立',
        seoDescription: '关系推进和边界建立描述。',
        sections: [
          { title: 'A', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'B', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'C', paragraphs: ['内容完整。', '内容完整。'] },
          { title: 'D', paragraphs: ['内容完整。', '内容完整。'] },
        ],
        status: 'published',
        source: 'cms',
        meta: {
          relatedToolSlugs: ['relationship-boundary-map'],
        },
      }, 'test_user');

      db.prepare(`
        UPDATE content_entries
        SET meta = ?
        WHERE id = ?
      `).run(JSON.stringify({
        contentVersion: 'content-v1',
        relatedToolSlugs: [],
        relatedReportThemes: [],
        relatedKnowledgeSlugs: [],
        relatedCaseSlugs: [],
        journeyAutomation: '',
      }), knowledgeId);

      const result = refreshManagedContentJourneyMetadata({
        limit: 20,
        userId: 'test_refresh',
      });
      const entry = getManagedContentEntryBySlug('knowledge', 'legacy-refresh-source-knowledge');
      const journeyMeta = getManagedContentJourneyMeta(entry);

      expect(result.refreshedCount).toBeGreaterThan(0);
      expect(entry?.meta?.contentVersion).toBe('content-v2');
      expect(entry?.meta?.journeyAutomation).toBe('auto');
      expect(journeyMeta.relatedToolSlugs.length).toBeGreaterThan(0);
      expect(journeyMeta.relatedCaseSlugs).toContain('legacy-refresh-related-case');
    } finally {
      deleteManagedContentEntry(knowledgeId);
      deleteManagedContentEntry(caseId);
    }
  });
});
