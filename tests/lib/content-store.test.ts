import { describe, expect, test } from '@jest/globals';
import {
  deleteManagedContentEntry,
  getKnowledgeArticleBySlug,
  getKnowledgeArticles,
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
});
