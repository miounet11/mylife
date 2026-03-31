import { describe, expect, test } from '@jest/globals';
import { deleteManagedContentEntry, saveManagedContentEntry } from '@/lib/content-store';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

describe('world yi public stats', () => {
  test('tracks recent world yi publication from actual non-seed entries', () => {
    const id = 'content_test_world_yi_recent_publication';
    const slug = 'world-yi-test-recent-publication';
    const before = getWorldYiPublicStats();

    try {
      saveManagedContentEntry({
        id,
        contentType: 'knowledge',
        subtype: null,
        slug,
        title: '世界易测试专题增发',
        name: null,
        excerpt: '用于验证世界易最近公开增发统计。',
        category: '世界易测试',
        readTime: '6 分钟',
        tags: ['世界易', '测试', '公开'],
        featured: false,
        seoTitle: '世界易测试专题增发',
        seoDescription: '用于验证世界易最近公开增发统计。',
        sections: [
          { title: 'section 1', paragraphs: ['内容完整，可以公开。', '第二段内容同样完整。'] },
          { title: 'section 2', paragraphs: ['这一节承接主题结构。', '这里继续补充关键说明。'] },
          { title: 'section 3', paragraphs: ['概念密度足够。', '问题映射也已具备。'] },
          { title: 'section 4', paragraphs: ['当前页面可作为公开入口。', '并且带有最近发布时间。'] },
        ],
        status: 'published',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          series: 'world-yi',
          publicationReady: true,
          synthesisType: 'topic-overview',
          qualityScore: 91,
          conceptCount: 4,
          questionCount: 2,
          relatedTopicCount: 2,
          schedulePublishedAt: new Date().toISOString(),
        },
      }, 'test_user');

      const after = getWorldYiPublicStats();

      expect(after.nonSeedContentCount).toBe(before.nonSeedContentCount + 1);
      expect(after.recentWorldYiPublishedCount7d).toBe(before.recentWorldYiPublishedCount7d + 1);
      expect(after.recentWorldYiPublishedTitle).toBe('世界易测试专题增发');
      expect(after.recentWorldYiPublishedAt).not.toBeNull();
      expect(after.publicationMode).not.toBe('seeded_publication');
    } finally {
      deleteManagedContentEntry(id);
    }
  });
});
