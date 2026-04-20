import { describe, expect, test } from '@jest/globals';
import type { ManagedContentEntry } from '@/lib/content-store';
import { buildWorldYiPublicationMechanismSnapshot } from '@/lib/world-yi-publication-mechanism';

function buildEntry(overrides: Partial<ManagedContentEntry>): ManagedContentEntry {
  const now = new Date().toISOString();

  return {
    id: overrides.id || `entry_${Math.random()}`,
    contentType: overrides.contentType || 'knowledge',
    subtype: overrides.subtype || null,
    slug: overrides.slug || 'world-yi-publication-mechanism-test',
    title: overrides.title || '世界易机制测试条目',
    name: overrides.name || null,
    excerpt: overrides.excerpt || '这是一个用于测试世界易持续发布机制的完整公开摘要，长度足够，也能代表真实发布内容。'.repeat(2),
    category: overrides.category || '世界易测试',
    readTime: overrides.readTime || '8 分钟',
    tags: overrides.tags || ['世界易', '测试', '发布', '机制'],
    featured: overrides.featured || false,
    seoTitle: overrides.seoTitle || '世界易持续发布机制测试条目',
    seoDescription: overrides.seoDescription || '这是一个用于测试世界易持续发布机制的完整 SEO 描述，长度足够，且具备公开发布条件。'.repeat(2),
    sections: overrides.sections || [
      { title: '结构判断', paragraphs: ['完整公开内容第一段，长度足够，可用于测试发布机制会如何判断公开覆盖与缺口。', '完整公开内容第二段，长度足够，可用于测试不同 lane 的内容补位与优先级。'] },
      { title: '时机变量', paragraphs: ['完整公开内容第三段，长度足够，可用于说明什么时候该先补 traffic capture 内容。', '完整公开内容第四段，长度足够，可用于说明什么时候该先补 conversion case。'] },
      { title: '环境条件', paragraphs: ['完整公开内容第五段，长度足够，可用于说明为什么世界易内容必须落回现实条件。', '完整公开内容第六段，长度足够，可用于说明为什么公开内容不能停留在空泛表达。'] },
      { title: '下一步动作', paragraphs: ['完整公开内容第七段，长度足够，可用于说明每篇内容都要导向一个下一步动作。', '完整公开内容第八段，长度足够，可用于说明为什么发布机制必须持续运转。'] },
    ],
    status: overrides.status || 'published',
    source: overrides.source || 'agent-fallback:public-growth:public-growth',
    meta: overrides.meta || {
      sourceType: 'public-growth',
      growthPlanKey: 'diaspora-time-precision',
      locale: 'zh-US',
      market: '北美华人 / 海外华人',
      publicationReady: true,
      series: 'world-yi',
    },
    createdBy: overrides.createdBy || 'test_user',
    updatedBy: overrides.updatedBy || 'test_user',
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}

describe('world yi publication mechanism', () => {
  test('builds balanced next slots across lanes from configured quotas', () => {
    const snapshot = buildWorldYiPublicationMechanismSnapshot({
      entries: [
        buildEntry({
          id: 'main_published',
          meta: {
            sourceType: 'public-growth',
            growthPlanKey: 'diaspora-time-precision',
            locale: 'zh-US',
            market: '北美华人 / 海外华人',
            publicationReady: true,
          },
        }),
        buildEntry({
          id: 'wave2_published',
          contentType: 'case',
          source: 'agent-fallback:public-growth-wave2:public-growth-wave2',
          meta: {
            sourceType: 'public-growth-wave2',
            growthPlanKey: 'ai-workplace-anxiety',
            locale: 'zh-CN',
            market: '城市职场用户',
            publicationReady: true,
          },
        }),
        buildEntry({
          id: 'global_published',
          source: 'agent-fallback:public-growth-global:public-growth-global',
          meta: {
            sourceType: 'public-growth-global',
            growthPlanKey: 'en-bazi-career-framework',
            locale: 'en-US',
            market: 'English-speaking professionals / globally curious readers',
            publicationReady: true,
          },
        }),
      ],
    });

    expect(snapshot.weeklySlots).toBe(9);
    expect(snapshot.laneQuotas.main).toBe(3);
    expect(snapshot.laneQuotas.wave2).toBe(3);
    expect(snapshot.laneQuotas.global).toBe(3);
    expect(snapshot.nextSlots.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.nextSlots.some((slot) => slot.lane === 'main')).toBe(true);
    expect(snapshot.nextSlots.some((slot) => slot.lane === 'wave2')).toBe(true);
    expect(snapshot.nextSlots.some((slot) => slot.lane === 'global')).toBe(true);
  });

  test('switches into evergreen expansion when reserves and weak metrics say fixed coverage is not enough', () => {
    const snapshot = buildWorldYiPublicationMechanismSnapshot({
      entries: [],
    });

    expect(snapshot.expansion.shouldExpand).toBe(true);
    expect(snapshot.expansion.mode).toBe('evergreen-expansion');
    expect(snapshot.expansion.minQueuedTargetsPerLane).toBe(3);
    expect(snapshot.expansion.reasons.join(' ')).toMatch(/autoresearch weak metrics|queued targets below reserve floor/);
  });
});
