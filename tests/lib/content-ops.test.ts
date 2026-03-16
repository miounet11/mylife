import { buildContentOpsSnapshot, buildContentSchedulerState, rankScheduledPublishCandidates } from '@/lib/content-ops';

describe('content ops snapshot', () => {
  it('builds queue and surface stats from analytics and content coverage', () => {
    const snapshot = buildContentOpsSnapshot({
      entries: [
        {
          id: 'content_1',
          contentType: 'knowledge',
          subtype: null,
          slug: 'true-solar-time-guide',
          title: '真太阳时为什么重要',
          name: null,
          excerpt: '解释真太阳时与排盘精度',
          category: '基础认知',
          readTime: '6 分钟',
          tags: ['真太阳时', '排盘'],
          featured: true,
          seoTitle: '真太阳时指南',
          seoDescription: '真太阳时与排盘精度说明',
          sections: [
            { title: 'section 1', paragraphs: ['a', 'b'] },
            { title: 'section 2', paragraphs: ['a', 'b'] },
          ],
          status: 'published',
          source: 'agent-llm:radar:radar-promote',
          meta: {
            origin: 'content-radar',
            radarSourceId: 'radar_1',
            radarSourceLabel: 'TikTok Feed',
            radarPlatform: 'tiktok',
          },
          createdBy: 'admin',
          updatedBy: 'admin',
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        },
      ],
      analyticsRows: [
        {
          event_name: 'knowledge_page_viewed',
          page: '/knowledge',
          meta: JSON.stringify({ surfaceKey: 'knowledge_page', contentType: 'knowledge' }),
          created_at: '2026-03-12T00:00:00.000Z',
        },
        {
          event_name: 'knowledge_article_viewed',
          page: '/knowledge/true-solar-time-guide',
          meta: JSON.stringify({
            surfaceKey: 'knowledge_article:true-solar-time-guide',
            contentType: 'knowledge',
            slug: 'true-solar-time-guide',
            title: '真太阳时为什么重要',
            tags: ['真太阳时', '排盘'],
          }),
          created_at: '2026-03-12T00:01:00.000Z',
        },
        {
          event_name: 'content_quick_analyze_started',
          page: '/knowledge/true-solar-time-guide',
          meta: JSON.stringify({
            sourceKey: 'knowledge_article:true-solar-time-guide',
            contentType: 'knowledge',
            slug: 'true-solar-time-guide',
            title: '真太阳时为什么重要',
            tags: ['真太阳时', '排盘'],
          }),
          created_at: '2026-03-12T00:02:00.000Z',
        },
      ],
      radarSignals: [
        {
          id: 'signal_1',
          sourceId: 'radar_1',
          sourceLabel: 'TikTok Feed',
          platform: 'tiktok',
          title: '2026 年换工作怎么看',
          url: 'https://example.com/hot',
          matchedKeywords: ['跳槽', '事业'],
          score: 66,
        },
      ],
    });

    expect(snapshot.metrics.publishedEntries).toBe(1);
    expect(snapshot.metrics.pageViews30d).toBe(1);
    expect(snapshot.metrics.quickStarts30d).toBe(1);
    expect(snapshot.topSurfaces[0]?.key).toBe('knowledge_article:true-solar-time-guide');
    expect(snapshot.generationQueue.length).toBeGreaterThan(0);
    expect(snapshot.generationQueue.some((item) => item.key === 'career-timing')).toBe(true);
    expect(snapshot.generationQueue.some((item) => item.sourceType === 'radar')).toBe(true);
    expect(snapshot.generationQueue.some((item) => item.sourceType === 'public-growth')).toBe(true);
    expect(snapshot.contentPerformance[0]?.title).toBe('真太阳时为什么重要');
    expect(snapshot.radarSourcePerformance[0]?.sourceLabel).toBe('TikTok Feed');
    expect(snapshot.radarSourcePerformance[0]?.quickStarts).toBe(1);
  });

  it('builds scheduler state from draft reserve and publish cadence', () => {
    const state = buildContentSchedulerState({
      entries: [
        {
          id: 'published_1',
          contentType: 'knowledge',
          subtype: null,
          slug: 'published-a',
          title: '已发布 A',
          name: null,
          excerpt: '说明内容',
          category: '知识',
          readTime: '6 分钟',
          tags: ['a', 'b', 'c', 'd'],
          featured: false,
          seoTitle: '已发布 A',
          seoDescription: '已发布内容 A',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
          ],
          status: 'published',
          source: 'agent-llm:auto-ops',
          meta: {},
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-13 01:00:00',
          updatedAt: '2026-03-13 01:00:00',
        },
        {
          id: 'draft_1',
          contentType: 'knowledge',
          subtype: null,
          slug: 'draft-a',
          title: '草稿 A',
          name: null,
          excerpt: '草稿说明',
          category: '知识',
          readTime: '6 分钟',
          tags: ['a', 'b', 'c', 'd'],
          featured: false,
          seoTitle: '草稿 A',
          seoDescription: '草稿内容 A',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
          ],
          status: 'draft',
          source: 'agent-llm:auto-ops',
          meta: {},
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-13 02:00:00',
          updatedAt: '2026-03-13 02:00:00',
        },
      ],
      runs: [
        {
          id: 'scheduler_1',
          trigger: 'cron',
          status: 'success',
          generatedCount: 2,
          publishedCount: 0,
          createdAt: '2026-03-13 00:00:00',
        },
      ],
      now: new Date('2026-03-13T02:30:00.000Z'),
      config: {
        timezoneOffsetMinutes: 480,
        publishHours: [10, 15, 20],
        dailyPublishLimit: 3,
        minPublishGapMinutes: 180,
        draftReserveTarget: 3,
        draftBatchSize: 2,
        generateCooldownMinutes: 240,
        radarRefreshMaxAgeHours: 4,
      },
    });

    expect(state.publishWindowOpen).toBe(true);
    expect(state.canPublishNow).toBe(false);
    expect(state.publishedToday).toBe(1);
    expect(state.draftReserveCount).toBe(1);
    expect(state.needsDraftReplenishment).toBe(false);
    expect(state.nextPublishSlotLabel).toBe('15:00');
  });

  it('ranks scheduled publish candidates by real conversion feedback', () => {
    const ranked = rankScheduledPublishCandidates({
      entries: [
        {
          id: 'published_radar',
          contentType: 'knowledge',
          subtype: null,
          slug: 'radar-best',
          title: '热点来源高转化样本',
          name: null,
          excerpt: '高转化热点样本',
          category: '热点',
          readTime: '6 分钟',
          tags: ['命理', '热点', '职业', '转化'],
          featured: false,
          seoTitle: '热点来源高转化样本',
          seoDescription: '高转化热点来源样本',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
          ],
          status: 'published',
          source: 'agent-llm:radar:radar-promote',
          meta: {
            origin: 'content-radar',
            radarSourceId: 'src_hot',
            radarSourceLabel: 'Hot Source',
            radarPlatform: 'google-news',
          },
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
        {
          id: 'draft_radar',
          contentType: 'knowledge',
          subtype: null,
          slug: 'draft-radar',
          title: '待发布热点稿',
          name: null,
          excerpt: '待发布热点稿摘要，长度足够，而且明确说明这是一个成熟产品可发布的完整内容草稿，同时也覆盖用户真实问题、时间窗口、执行节奏、常见误区、现实代价与下一步测算动作，确保它明显超过自动发布阈值。',
          category: '热点',
          readTime: '6 分钟',
          tags: ['命理', '热点', '职业', '转化'],
          featured: false,
          seoTitle: '待发布热点稿完整 SEO 标题',
          seoDescription: '待发布热点稿 SEO 描述长度足够，并且可以满足自动发布阈值的最小长度要求，同时体现真实转化、用户价值、执行节奏、现实误区和进一步进入个人测算的必要性。',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
          ],
          status: 'draft',
          source: 'agent-llm:radar:radar-promote',
          meta: {
            origin: 'content-radar',
            radarSourceId: 'src_hot',
            radarSourceLabel: 'Hot Source',
            radarPlatform: 'google-news',
          },
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-13T01:00:00.000Z',
          updatedAt: '2026-03-13T01:00:00.000Z',
        },
        {
          id: 'draft_plain',
          contentType: 'knowledge',
          subtype: null,
          slug: 'draft-plain',
          title: '待发布普通稿',
          name: null,
          excerpt: '待发布普通稿摘要，长度足够，而且明确说明这是一个成熟产品可发布的完整内容草稿，同时也覆盖用户真实问题、时间窗口、执行节奏、常见误区、现实代价与下一步测算动作，确保它明显超过自动发布阈值。',
          category: '知识',
          readTime: '6 分钟',
          tags: ['命理', '基础', '节奏', '理解'],
          featured: false,
          seoTitle: '待发布普通稿完整 SEO 标题',
          seoDescription: '待发布普通稿 SEO 描述长度足够，并且可以满足自动发布阈值的最小长度要求，同时体现真实转化、用户价值、执行节奏、现实误区和进一步进入个人测算的必要性。',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
          ],
          status: 'draft',
          source: 'agent-llm:auto-ops',
          meta: {},
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-13T01:00:00.000Z',
          updatedAt: '2026-03-13T01:00:00.000Z',
        },
      ],
      analyticsRows: [
        {
          event_name: 'knowledge_article_viewed',
          page: '/knowledge/radar-best',
          meta: JSON.stringify({
            surfaceKey: 'knowledge_article:radar-best',
            contentType: 'knowledge',
            slug: 'radar-best',
            title: '热点来源高转化样本',
          }),
          created_at: '2026-03-12T00:00:00.000Z',
        },
        {
          event_name: 'content_quick_analyze_started',
          page: '/knowledge/radar-best',
          meta: JSON.stringify({
            sourceKey: 'knowledge_article:radar-best',
            contentType: 'knowledge',
            slug: 'radar-best',
            title: '热点来源高转化样本',
          }),
          created_at: '2026-03-12T00:02:00.000Z',
        },
      ],
      now: new Date('2026-03-13T02:30:00.000Z'),
      config: {
        timezoneOffsetMinutes: 480,
        publishHours: [10, 15, 20],
        dailyPublishLimit: 3,
        minPublishGapMinutes: 180,
        draftReserveTarget: 3,
        draftBatchSize: 2,
        generateCooldownMinutes: 240,
        radarRefreshMaxAgeHours: 4,
        adaptiveTypeWeight: 10,
        adaptiveRadarSourceWeight: 14,
        adaptiveFreshnessWeight: 8,
      },
    });

    expect(ranked[0]?.entry.slug).toBe('draft-radar');
    expect(ranked[0]?.reasons.join(' ')).toContain('热点源反馈加权');
  });
});
