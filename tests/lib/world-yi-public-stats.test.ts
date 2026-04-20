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

  test('treats published public growth entries as ongoing world yi publication', () => {
    const id = 'content_test_world_yi_growth_publication';
    const before = getWorldYiPublicStats();

    try {
      saveManagedContentEntry({
        id,
        contentType: 'knowledge',
        subtype: null,
        slug: 'knowledge-test-world-yi-growth-publication',
        title: '海外华人真太阳时公开增发测试',
        name: null,
        excerpt: '用于验证 public growth 已发布内容会被计入世界易持续公开发布统计，而不是继续被误判为 seed-only。'.repeat(2),
        category: '世界易测试',
        readTime: '6 分钟',
        tags: ['世界易', '海外华人', '真太阳时', '公开增发'],
        featured: false,
        seoTitle: '海外华人真太阳时公开增发测试',
        seoDescription: '用于验证 public growth 已发布内容会被计入世界易持续公开发布统计。'.repeat(2),
        sections: [
          { title: '误差来源', paragraphs: ['完整公开段落一，足够长，可用于验证公开增长条目会进入世界易统计口径，而不是停留在独立增长层。', '完整公开段落二，足够长，也能说明为什么这个统计口径应该服务于真实发布状态。'] },
          { title: '时间边界', paragraphs: ['完整公开段落三，足够长，说明真太阳时、时区与夏令时会如何影响排盘边界与行动判断。', '完整公开段落四，足够长，说明为什么用户需要先校正资料再进入个人判断。'] },
          { title: '使用场景', paragraphs: ['完整公开段落五，足够长，展示世界易公共内容如何帮助用户理解结构、阶段与环境。', '完整公开段落六，足够长，展示公共内容如何进一步承接到个体分析。'] },
          { title: '下一步动作', paragraphs: ['完整公开段落七，足够长，说明用户接下来应该做什么，而不是只停留在抽象理解。', '完整公开段落八，足够长，说明如何趋利避害并进入更适合自己的节奏。'] },
        ],
        status: 'published',
        source: 'agent-fallback:public-growth:public-growth',
        meta: {
          growthPlanKey: 'diaspora-time-precision',
          market: '北美华人 / 海外华人',
          locale: 'zh-US',
          sourceType: 'public-growth',
          publicationReady: true,
          schedulePublishedAt: new Date().toISOString(),
        },
      }, 'test_user');

      const after = getWorldYiPublicStats();

      expect(after.publicKnowledgeCount).toBe(before.publicKnowledgeCount + 1);
      expect(after.nonSeedContentCount).toBe(before.nonSeedContentCount + 1);
      expect(after.recentWorldYiPublishedCount7d).toBe(before.recentWorldYiPublishedCount7d + 1);
      expect(after.recentWorldYiPublishedTitle).toBe('海外华人真太阳时公开增发测试');
      expect(after.publicationMode).toBe('ongoing_publication');
    } finally {
      deleteManagedContentEntry(id);
    }
  });
});
