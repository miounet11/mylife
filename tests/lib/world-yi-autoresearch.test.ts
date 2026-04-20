import { describe, expect, test } from '@jest/globals';
import type { ManagedContentEntry } from '@/lib/content-store';
import { PUBLIC_GROWTH_TARGETS } from '@/lib/public-growth-plan';
import { assessGrowthPublication } from '@/lib/public-growth-plan';
import { buildWorldYiAutoresearchSnapshot } from '@/lib/world-yi-autoresearch';
import type { WorldYiPublicStats } from '@/lib/world-yi-public-stats';

function createEntry(overrides: Partial<ManagedContentEntry> = {}): ManagedContentEntry {
  return {
    id: overrides.id || 'entry_test',
    contentType: overrides.contentType || 'knowledge',
    subtype: overrides.subtype || null,
    slug: overrides.slug || 'world-yi-test-entry',
    title: overrides.title || '世界易测试条目',
    name: overrides.name || null,
    excerpt: overrides.excerpt || '这是一个用于测试世界易自动研究评分器的完整条目摘要，长度足够且可公开。',
    category: overrides.category || '世界易测试',
    readTime: overrides.readTime || '8 分钟',
    tags: overrides.tags || ['世界易', '测试', '判断'],
    featured: overrides.featured || false,
    seoTitle: overrides.seoTitle || '世界易测试条目',
    seoDescription: overrides.seoDescription || '这是一个用于测试世界易自动研究评分器的完整条目 SEO 描述。',
    sections: overrides.sections || [
      { title: 'section 1', paragraphs: ['第一段内容足够完整，用于通过质量校验。', '第二段内容也足够完整，用于测试。'] },
      { title: 'section 2', paragraphs: ['这里继续补充结构说明。', '这里继续补充动作建议。'] },
      { title: 'section 3', paragraphs: ['这一节用于保持篇幅与结构。', '这一节也用于保持篇幅与结构。'] },
      { title: 'section 4', paragraphs: ['最后补足公开内容质量。', '最后补足公开内容质量。'] },
    ],
    status: overrides.status || 'published',
    source: overrides.source || 'agent-llm:test',
    meta: overrides.meta || { publicationReady: true, series: 'world-yi' },
    createdBy: overrides.createdBy || 'test_user',
    updatedBy: overrides.updatedBy || 'test_user',
    createdAt: overrides.createdAt || '2026-04-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-04-06T00:00:00.000Z',
  };
}

function createStats(overrides: Partial<WorldYiPublicStats> = {}): WorldYiPublicStats {
  return {
    publicKnowledgeCount: 12,
    publicCaseCount: 6,
    publicInsightCount: 3,
    publicContentCount: 21,
    seedContentCount: 4,
    nonSeedContentCount: 17,
    mainKnowledgeCount: 8,
    globalKnowledgeCount: 2,
    englishKnowledgeCount: 2,
    mainCaseCount: 4,
    globalCaseCount: 1,
    englishCaseCount: 1,
    cityInsightCount: 1,
    industryInsightCount: 1,
    organizationInsightCount: 1,
    domainCount: 6,
    applicationGroupCount: 6,
    globalTopicCount: 4,
    englishTrackCount: 4,
    publicRouteCount: 28,
    targetArticleCount: 24,
    publicationMode: 'ongoing_publication',
    lastContentUpdatedAt: '2026-04-06T00:00:00.000Z',
    lastNonSeedContentUpdatedAt: '2026-04-06T00:00:00.000Z',
    recentWorldYiPublishedAt: '2026-04-06T00:00:00.000Z',
    recentWorldYiPublishedTitle: '世界易测试条目',
    recentWorldYiPublishedCount7d: 5,
    schedulerActive: true,
    lastSchedulerRunAt: '2026-04-06T00:00:00.000Z',
    schedulerPublishedToday: 1,
    schedulerDraftReserveCount: 6,
    schedulerDraftReserveTarget: 6,
    schedulerNextPublishSlotLabel: 'tomorrow',
    recentSchedulerPublishedAt: '2026-04-06T00:00:00.000Z',
    recentSchedulerPublishedTitle: '世界易测试条目',
    recentSchedulerPublishedCount7d: 3,
    ...overrides,
  };
}

describe('world yi autoresearch', () => {
  test('scores a healthy world yi system with strong coverage', () => {
    const growthEntries = PUBLIC_GROWTH_TARGETS.map((target, index) => createEntry({
      id: `growth_${target.key}`,
      slug: `world-yi-growth-${index + 1}`,
      contentType: target.primaryType,
      title: target.title,
      meta: {
        publicationReady: true,
        growthPlanKey: target.key,
        sourceType: 'public-growth',
        locale: target.locale,
        market: target.market,
        series: index % 3 === 0 ? 'world-yi-global' : index % 3 === 1 ? 'world-yi-en' : 'world-yi',
      },
    }));
    const flagshipEntries = [
      'world-yi-v1-manifesto',
      'world-yi-multidimensional-framework',
      'world-yi-humanities-synthesis',
      'world-yi-era-cognition',
      'world-yi-version-faq',
    ].map((slug) => createEntry({
      id: slug,
      slug,
      meta: { publicationReady: true, series: 'world-yi' },
    }));

    const snapshot = buildWorldYiAutoresearchSnapshot({
      entries: [...growthEntries, ...flagshipEntries],
      stats: createStats(),
    });

    expect(snapshot.score).toBeGreaterThan(80);
    expect(snapshot.metrics.find((metric) => metric.key === 'public-growth-coverage')?.points).toBe(20);
    expect(snapshot.metrics.find((metric) => metric.key === 'flagship-doctrine')?.points).toBe(10);
  });

  test('recommends rebuilding content scale and cadence when system is weak', () => {
    const snapshot = buildWorldYiAutoresearchSnapshot({
      entries: [],
      stats: createStats({
        publicKnowledgeCount: 0,
        publicCaseCount: 0,
        publicInsightCount: 0,
        publicContentCount: 0,
        seedContentCount: 0,
        nonSeedContentCount: 0,
        mainKnowledgeCount: 0,
        globalKnowledgeCount: 0,
        englishKnowledgeCount: 0,
        mainCaseCount: 0,
        globalCaseCount: 0,
        englishCaseCount: 0,
        publicationMode: 'seeded_publication',
        recentWorldYiPublishedCount7d: 0,
        schedulerActive: false,
        schedulerDraftReserveCount: 0,
        recentSchedulerPublishedCount7d: 0,
      }),
    });

    expect(snapshot.score).toBeLessThan(30);
    expect(snapshot.recommendations.join(' ')).toMatch(/Expand public World Yi inventory|Increase recent publish cadence/);
  });

  test('counts published public growth entries toward scale, momentum, and cadence', () => {
    const growthEntries = [
      createEntry({
        id: 'growth_recent_1',
        slug: 'growth-recent-1',
        source: 'agent-llm:public-growth:public-growth',
        meta: {
          publicationReady: true,
          sourceType: 'public-growth',
          growthPlanKey: PUBLIC_GROWTH_TARGETS[0]?.key,
          schedulePublishedAt: new Date().toISOString(),
        },
      }),
      createEntry({
        id: 'growth_recent_2',
        slug: 'growth-recent-2',
        source: 'agent-llm:public-growth:public-growth',
        meta: {
          publicationReady: true,
          sourceType: 'public-growth',
          growthPlanKey: PUBLIC_GROWTH_TARGETS[1]?.key,
          schedulePublishedAt: new Date().toISOString(),
        },
      }),
    ];

    const baseline = buildWorldYiAutoresearchSnapshot({
      entries: [],
      stats: createStats({
        publicKnowledgeCount: 0,
        publicCaseCount: 0,
        publicInsightCount: 0,
        publicContentCount: 0,
        seedContentCount: 0,
        nonSeedContentCount: 0,
        mainKnowledgeCount: 0,
        globalKnowledgeCount: 0,
        englishKnowledgeCount: 0,
        mainCaseCount: 0,
        globalCaseCount: 0,
        englishCaseCount: 0,
        publicationMode: 'seeded_publication',
        recentWorldYiPublishedCount7d: 0,
        recentSchedulerPublishedCount7d: 0,
      }),
    });

    const improved = buildWorldYiAutoresearchSnapshot({
      entries: growthEntries,
      stats: createStats({
        publicKnowledgeCount: 0,
        publicCaseCount: 0,
        publicInsightCount: 0,
        publicContentCount: 0,
        seedContentCount: 0,
        nonSeedContentCount: 0,
        mainKnowledgeCount: 0,
        globalKnowledgeCount: 0,
        englishKnowledgeCount: 0,
        mainCaseCount: 0,
        globalCaseCount: 0,
        englishCaseCount: 0,
        publicationMode: 'seeded_publication',
        recentWorldYiPublishedCount7d: 0,
        recentSchedulerPublishedCount7d: 0,
      }),
    });

    expect(improved.score).toBeGreaterThan(baseline.score);
    expect(improved.metrics.find((metric) => metric.key === 'content-scale')?.points).toBeGreaterThan(
      baseline.metrics.find((metric) => metric.key === 'content-scale')?.points || 0
    );
    expect(improved.metrics.find((metric) => metric.key === 'publication-cadence')?.points).toBeGreaterThan(
      baseline.metrics.find((metric) => metric.key === 'publication-cadence')?.points || 0
    );
  });

  test('allows high-quality fallback growth drafts to become publication-ready', () => {
    const assessment = assessGrowthPublication(createEntry({
      source: 'agent-fallback:public-growth:public-growth',
      excerpt: '这是一篇面向北美华人与海外华人的完整公开知识稿，能够把真太阳时、夏令时、出生地换算与现实决策风险讲清楚，也能自然承接到世界易的个人测算与时间校正流程。',
      seoTitle: '海外华人真太阳时与夏令时误差的完整判断指南与校正方法',
      seoDescription: '围绕海外华人出生时间、真太阳时和夏令时误差，完整解释为什么排盘更容易算错、错在何处、如何避免错误判断，以及进入个人校正前最该确认的关键信息与步骤。',
      tags: ['海外华人', '真太阳时', '夏令时', '排盘', '出生时间'],
      sections: [
        {
          title: '时间误差来源',
          paragraphs: [
            '这一段完整说明海外华人在不同时区和夏令时环境下为什么更容易出现出生时间换算误差，并把常见误差来源放回真实使用场景里解释。',
            '这一段继续说明同样的出生时刻在不同记录方式下会如何偏移，为什么这种偏移会直接影响命盘结构判断和后续决策。',
          ],
        },
        {
          title: '真太阳时边界',
          paragraphs: [
            '这一段完整解释真太阳时不是一个抽象名词，而是会直接改变日柱时柱边界的关键变量，尤其影响跨时区用户的盘面基础。',
            '这一段继续说明为什么只看钟表时间很容易忽略经度、夏令时和本地制度差异，从而把本来应该避开的风险窗口误判为机会。',
          ],
        },
        {
          title: '常见误判场景',
          paragraphs: [
            '这一段聚焦海外华人最常见的几个误判场景，包括报户口时间、医院记录时间和家庭记忆时间之间的不一致，以及这些差异带来的实际偏差。',
            '这一段继续说明为什么公共内容只能帮助识别风险类型，真正要做行动判断仍然需要把个人出生资料重新校正到可用状态。',
          ],
        },
        {
          title: '下一步校正动作',
          paragraphs: [
            '这一段说明用户在发现出生时间可能有误之后，应该先核对什么资料、先确认什么边界，再进入个人分析，而不是直接套用结论。',
            '这一段继续把内容自然承接到世界易的个人测算路径，让用户知道怎样用更可靠的时间基础去判断自己最该做的事情。',
          ],
        },
      ],
      meta: {
        publicationReady: false,
        sourceType: 'public-growth',
        locale: 'zh-US',
        market: 'North America',
      },
    }));

    expect(assessment.score).toBeGreaterThanOrEqual(85);
    expect(assessment.ready).toBe(true);
  });
});
