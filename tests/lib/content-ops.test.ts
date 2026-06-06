const mockAnalyticsRawQuery = jest.fn();
const mockContentSchedulerRunListRecent = jest.fn();
const mockContentSchedulerRunCreate = jest.fn();
const mockContentSignalListRecent = jest.fn();
const mockSystemLockAcquire = jest.fn();
const mockSystemLockRelease = jest.fn();
const mockListManagedContentEntries = jest.fn();
const mockRefreshManagedContentJourneyMetadata = jest.fn();
const mockSaveManagedContentEntry = jest.fn();
const mockRunContentRadarCycle = jest.fn();
const mockGenerateManagedContentDrafts = jest.fn();

jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    rawQuery: (...args: unknown[]) => mockAnalyticsRawQuery(...args),
  },
  contentSchedulerRunOperations: {
    listRecent: (...args: unknown[]) => mockContentSchedulerRunListRecent(...args),
    create: (...args: unknown[]) => mockContentSchedulerRunCreate(...args),
  },
  contentSignalOperations: {
    listRecent: (...args: unknown[]) => mockContentSignalListRecent(...args),
  },
  systemLockOperations: {
    acquire: (...args: unknown[]) => mockSystemLockAcquire(...args),
    release: (...args: unknown[]) => mockSystemLockRelease(...args),
  },
}));

jest.mock('@/lib/content-store', () => {
  const actual = jest.requireActual('@/lib/content-store');
  return {
    ...actual,
    listManagedContentEntries: (...args: unknown[]) => mockListManagedContentEntries(...args),
    listManagedContentEntriesLight: (...args: unknown[]) => mockListManagedContentEntries(...args), // stability: light projection shares mock for scheduler paths
    countManagedContentEntries: () => (mockListManagedContentEntries.mock.results?.[0]?.value?.length || 12),
    refreshManagedContentJourneyMetadata: (...args: unknown[]) => mockRefreshManagedContentJourneyMetadata(...args),
    saveManagedContentEntry: (...args: unknown[]) => mockSaveManagedContentEntry(...args),
  };
});

jest.mock('@/lib/content-radar', () => ({
  runContentRadarCycle: (...args: unknown[]) => mockRunContentRadarCycle(...args),
}));

jest.mock('@/lib/content-generation', () => ({
  generateManagedContentDrafts: (...args: unknown[]) => mockGenerateManagedContentDrafts(...args),
}));

import {
  applyOpenAgentAnalysisToGenerationQueue,
  buildContentOpsSnapshot,
  buildContentSchedulerState,
  matchesOpenAgentBlockedPattern,
  rankScheduledPublishCandidates,
  runContentSchedulerCycle,
} from '@/lib/content-ops';
import type { ContentSchedulerRunRecord } from '@/lib/user-types';
import type { ManagedContentEntry } from '@/lib/content-store';
import * as worldYiAutonomousState from '@/lib/world-yi-autonomous-state';
import * as worldYiPublicationLanes from '@/lib/world-yi-publication-lanes';

let mockEntries: ManagedContentEntry[] = [];
let mockRuns: ContentSchedulerRunRecord[] = [];
let mockAnalyticsRows: Parameters<typeof rankScheduledPublishCandidates>[0]['analyticsRows'] = [];
let mockSignals: Array<Record<string, unknown>> = [];
const originalEnv = process.env;

function buildReadyDraftEntry(overrides: Partial<ManagedContentEntry>): ManagedContentEntry {
  return {
    id: 'draft-default',
    contentType: 'knowledge',
    subtype: null,
    slug: 'draft-default',
    title: '默认可发布草稿',
    name: null,
    excerpt: '这是一段足够长的草稿摘要，用来确保自动发布质量门槛被满足，同时也模拟真实线上内容的完整导语、用户问题、执行节奏、现实代价、判断误区与下一步行动说明，确保它明显超过自动发布阈值。',
    category: '知识',
    readTime: '6 分钟',
    tags: ['命理', '节奏', '窗口', '决策'],
    featured: false,
    seoTitle: '默认可发布草稿 SEO 标题',
    seoDescription: '这是一段足够长的 SEO 描述，用来确保自动发布质量门槛被满足，同时也模拟真实线上内容的搜索摘要、用户价值、执行节奏、常见误区、现实成本与进一步进入个人测算动作的完整说明。',
    sections: [
      { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，并模拟真实线上内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
      { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，并模拟真实线上内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
      { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，并模拟真实线上内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
      { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，并模拟真实线上内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
    ],
    status: 'draft',
    source: 'agent-llm:auto-ops',
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
    ...overrides,
    meta: {
      ...(overrides.meta || {}),
    },
  };
}

beforeEach(() => {
  process.env = { ...originalEnv };
  mockEntries = [];
  mockRuns = [];
  mockAnalyticsRows = [];
  mockSignals = [];

  mockAnalyticsRawQuery.mockImplementation(() => mockAnalyticsRows);
  mockContentSchedulerRunListRecent.mockImplementation((limit = 20) => mockRuns.slice(0, limit));
  mockContentSchedulerRunCreate.mockImplementation((run: ContentSchedulerRunRecord) => {
    mockRuns = [run, ...mockRuns];
    return run;
  });
  mockContentSignalListRecent.mockImplementation((limit = 20) => mockSignals.slice(0, limit));
  mockSystemLockAcquire.mockReturnValue(true);
  mockSystemLockRelease.mockReturnValue({ changes: 1 });
  mockListManagedContentEntries.mockImplementation(() => mockEntries);
  mockRefreshManagedContentJourneyMetadata.mockReturnValue({ refreshedCount: 0 });
  mockSaveManagedContentEntry.mockImplementation((entry: ManagedContentEntry) => {
    const savedEntry = {
      ...entry,
      id: entry.id || `generated-${mockEntries.length + 1}`,
      meta: entry.meta || {},
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
    } as ManagedContentEntry;
    const existingIndex = mockEntries.findIndex((item) => item.id === savedEntry.id);
    if (existingIndex >= 0) {
      mockEntries[existingIndex] = savedEntry;
    } else {
      mockEntries.push(savedEntry);
    }
    return savedEntry;
  });
  mockRunContentRadarCycle.mockResolvedValue(undefined);
  mockGenerateManagedContentDrafts.mockResolvedValue({ entries: [] });
});

afterEach(() => {
  process.env = originalEnv;
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('content ops snapshot', () => {
  it('matches OpenAgent blocked patterns with field-aware glob rules', () => {
    expect(matchesOpenAgentBlockedPattern('source:knowledge-synthesis:*:book-path', {
      source: 'knowledge-synthesis:book-path',
      slug: 'related-arts-book-path',
      signatures: ['knowledge-synthesis:related-arts-book-path:book-path'],
    })).toBe(true);

    expect(matchesOpenAgentBlockedPattern('key:diaspora-*', {
      key: 'diaspora-should-you-keep-the-family-business-or-cut-yourself-out',
    })).toBe(true);

    expect(matchesOpenAgentBlockedPattern('title:*书目阶梯*', {
      title: '应用专题书目阶梯',
    })).toBe(true);

    expect(matchesOpenAgentBlockedPattern('source:knowledge-synthesis:*:book-path', {
      source: 'knowledge-synthesis:concept-glossary',
      slug: 'related-arts-concept-glossary',
      signatures: ['knowledge-synthesis:related-arts-concept-glossary:concept-glossary'],
    })).toBe(false);
  });

  it('keeps explicit queue overrides even when blocked patterns conflict on the same key family', () => {
    const queue = applyOpenAgentAnalysisToGenerationQueue({
      queue: [
        {
          key: 'diaspora-should-you-keep-sending-money-home-or-build-your-own-base-first',
          title: '先稳住自己的根基，还是继续替原生家庭持续输血',
          topic: 'diaspora money home',
          angle: 'global repair',
          contentType: 'knowledge',
          keywords: ['diaspora'],
          reason: 'global weak lane',
          priorityScore: 300,
          audience: 'global',
          sourceType: 'public-growth-global',
        },
        {
          key: 'city-migration',
          title: '城市迁移与地理位置',
          topic: 'city migration',
          angle: 'cluster',
          contentType: 'knowledge',
          keywords: ['city'],
          reason: 'cluster demand',
          priorityScore: 200,
          audience: 'global',
          sourceType: 'cluster',
        },
      ],
      analysisPlan: {
        summary: 'test',
        laneContracts: [
          {
            lane: 'global',
            sourceType: 'public-growth-global',
            targetKeys: ['diaspora-should-you-keep-sending-money-home-or-build-your-own-base-first'],
            reason: 'repair global lane',
          },
        ],
        queueOverrides: [
          {
            key: 'diaspora-should-you-keep-sending-money-home-or-build-your-own-base-first',
            priority: 'critical',
            reason: 'must stay in queue',
          },
        ],
        blockedPatterns: ['key:diaspora-*'],
        policySignals: [],
      },
    });

    expect(queue[0]?.key).toBe('diaspora-should-you-keep-sending-money-home-or-build-your-own-base-first');
    expect(queue.some((item) => item.key === 'diaspora-should-you-keep-sending-money-home-or-build-your-own-base-first')).toBe(true);
  });

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
    expect(
      snapshot.generationQueue.some((item) => (
        item.sourceType === 'public-growth-wave2' || item.sourceType === 'public-growth-global'
      ))
    ).toBe(true);
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
          meta: {
            schedulePublishedAt: '2026-03-13T01:00:00.000Z',
          },
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
        adaptiveTypeWeight: 10,
        adaptiveRadarSourceWeight: 14,
        adaptiveFreshnessWeight: 8,
      },
    });

    expect(state.publishWindowOpen).toBe(true);
    expect(state.canPublishNow).toBe(false);
    expect(state.publishedToday).toBe(1);
    expect(state.draftReserveCount).toBe(1);
    expect(state.needsDraftReplenishment).toBe(false);
    expect(state.nextPublishSlotLabel).toBe('15:00');
  });

  it('does not count metadata-only published entry updates as same-day publication', () => {
    const state = buildContentSchedulerState({
      entries: [
        buildReadyDraftEntry({
          id: 'published-old',
          slug: 'published-old',
          title: '旧发布内容',
          status: 'published',
          createdAt: '2026-03-11T02:00:00.000Z',
          updatedAt: '2026-03-13T02:00:00.000Z',
          meta: {
            schedulePublishedAt: '2026-03-11T02:00:00.000Z',
          },
        }),
        buildReadyDraftEntry({
          id: 'draft-new',
          slug: 'draft-new',
          title: '今日待发布草稿',
          status: 'draft',
          createdAt: '2026-03-13T01:00:00.000Z',
          updatedAt: '2026-03-13T01:00:00.000Z',
        }),
      ],
      runs: [],
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

    expect(state.publishedToday).toBe(0);
    expect(state.canPublishNow).toBe(true);
    expect(state.lastPublishedAt).toBe('2026-03-11T02:00:00.000Z');
  });

  it('does not let knowledge synthesis auto-publish consume scheduler publish quota', () => {
    const state = buildContentSchedulerState({
      entries: [
        buildReadyDraftEntry({
          id: 'knowledge-synthesis-published',
          slug: 'knowledge-synthesis-published',
          title: '知识合成已发布内容',
          status: 'published',
          source: 'knowledge-synthesis:topic-overview',
          createdAt: '2026-03-11T02:00:00.000Z',
          updatedAt: '2026-03-13T02:00:00.000Z',
          meta: {
            autoPublishedAt: '2026-03-13T02:00:00.000Z',
          },
        }),
        buildReadyDraftEntry({
          id: 'scheduler-draft',
          slug: 'scheduler-draft',
          title: '调度器待发布草稿',
          status: 'draft',
          createdAt: '2026-03-13T01:00:00.000Z',
          updatedAt: '2026-03-13T01:00:00.000Z',
        }),
      ],
      runs: [],
      now: new Date('2026-03-13T02:30:00.000Z'),
      config: {
        timezoneOffsetMinutes: 480,
        publishHours: [10, 15, 20],
        dailyPublishLimit: 1,
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

    expect(state.publishedToday).toBe(0);
    expect(state.canPublishNow).toBe(true);
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

  it('prioritizes public growth lane gap drafts over generic drafts', () => {
    const ranked = rankScheduledPublishCandidates({
      entries: [
        {
          id: 'public_growth_draft',
          contentType: 'knowledge',
          subtype: null,
          slug: 'diaspora-time-precision-draft',
          title: '海外华人真太阳时与排盘精度',
          name: null,
          excerpt: '这是一篇面向海外华人的完整公开内容摘要，长度足够，明确解释真太阳时、出生地与排盘精度之间的关系，也能自然承接世界易的判断入口、用户信任建立与实际决策场景。',
          category: '世界易公开增长',
          readTime: '8 分钟',
          tags: ['真太阳时', '排盘', '海外华人', '世界易'],
          featured: false,
          seoTitle: '海外华人真太阳时与排盘精度完整公开说明与校准指南',
          seoDescription: '这是一篇可直接公开发布的完整 SEO 描述，覆盖海外华人、真太阳时、排盘误差、出生地校准、判断入口与进一步测算动作，长度和信息密度都满足上线阈值。',
          sections: [
            { title: '出生时间误差', paragraphs: ['这段内容足够长，用来说明为什么海外华人的出生时间误差会直接影响排盘判断，并且需要先校准真太阳时。', '这段内容同样足够长，用来说明时间误差会在现实决策里放大成职业、关系与迁移判断的偏差。'] },
            { title: '真太阳时校准', paragraphs: ['这段内容足够长，用来说明真太阳时并不是玄学装饰，而是排盘精度与用户信任的前置条件。', '这段内容同样足够长，用来说明世界易如何把校准后的命盘重新翻译成现实可执行的判断。'] },
            { title: '现实场景', paragraphs: ['这段内容足够长，用来说明海外华人在职业、迁移、婚恋和家庭协同里为什么更需要结构化判断。', '这段内容同样足够长，用来说明公开内容应该如何承接到下一步测算、决策与持续行动。'] },
            { title: '下一步动作', paragraphs: ['这段内容足够长，用来说明用户看完后应该如何进入更细的个人判断流程，而不是停留在概念理解。', '这段内容同样足够长，用来说明公开内容的目标是帮助用户做更准确的现实决策与长期安排。'] },
          ],
          status: 'draft',
          source: 'agent-llm:public-growth:automation',
          meta: {
            sourceType: 'public-growth',
            growthPlanKey: 'diaspora-time-precision',
            locale: 'zh-US',
            market: '北美华人 / 海外华人',
          },
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: '2026-03-13T01:00:00.000Z',
          updatedAt: '2026-03-13T01:00:00.000Z',
        },
        {
          id: 'plain_draft',
          contentType: 'knowledge',
          subtype: null,
          slug: 'plain-draft',
          title: '普通知识稿',
          name: null,
          excerpt: '这是一篇普通知识稿的完整摘要，长度也足够，而且覆盖用户常见问题、时间窗口、执行节奏、现实误区与进一步行动，符合基础自动发布结构要求。',
          category: '基础知识',
          readTime: '6 分钟',
          tags: ['基础', '理解', '节奏', '判断'],
          featured: false,
          seoTitle: '普通知识稿完整 SEO 标题',
          seoDescription: '这是一篇普通知识稿的 SEO 描述，长度和结构也足够，但它并不直接补世界易公开增长 lane 的关键缺口。',
          sections: [
            { title: 'section 1', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，而且能模拟真实可发布内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 2', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，而且能模拟真实可发布内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 3', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，而且能模拟真实可发布内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
            { title: 'section 4', paragraphs: ['这一段内容长度足够，可以满足自动发布质量门槛，而且能模拟真实可发布内容。', '第二段内容同样足够长，用于模拟真实可发布内容。'] },
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
      analyticsRows: [],
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

    expect(ranked[0]?.entry.slug).toBe('diaspora-time-precision-draft');
    expect(ranked[0]?.reasons.join(' ')).toContain('补齐 Public Growth Main 缺口');
  });
});

describe('content scheduler cycle', () => {
  it('skips overlapping live scheduler cycles when the lock is already held', async () => {
    mockSystemLockAcquire.mockReturnValue(false);

    const result = await runContentSchedulerCycle({ trigger: 'cron' });

    expect(result).toMatchObject({
      success: true,
      generatedCount: 0,
      publishedCount: 0,
      reason: '已有内容调度任务正在执行，本轮跳过以避免重复生成和重叠发布',
    });
    expect(mockGenerateManagedContentDrafts).not.toHaveBeenCalled();
    expect(mockSaveManagedContentEntry).not.toHaveBeenCalled();
    expect(mockSystemLockRelease).not.toHaveBeenCalled();
  });

  it('publishes more than one ready draft in a single open publish window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-13T02:30:00.000Z'));
    process.env.CONTENT_SCHEDULER_PUBLISH_HOURS = '10,15,20';
    process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT = '200';
    process.env.CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES = '180';
    process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE = '24';
    process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET = '2';
    process.env.CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES = '240';
    process.env.CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS = '4';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT = '10';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT = '14';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT = '8';

    const recentPublishedAt = '2026-03-12T20:00:00.000Z';
    mockEntries = [
      buildReadyDraftEntry({
        id: 'published-1',
        slug: 'published-1',
        title: '昨日已发布内容',
        status: 'published',
        updatedAt: recentPublishedAt,
        createdAt: recentPublishedAt,
      }),
      buildReadyDraftEntry({
        id: 'draft-1',
        slug: 'draft-1',
        title: '待发布草稿 1',
      }),
      buildReadyDraftEntry({
        id: 'draft-2',
        slug: 'draft-2',
        title: '待发布草稿 2',
        updatedAt: '2026-03-13T01:10:00.000Z',
        createdAt: '2026-03-13T01:10:00.000Z',
      }),
      buildReadyDraftEntry({
        id: 'draft-3',
        slug: 'draft-3',
        title: '待发布草稿 3',
        updatedAt: '2026-03-13T01:20:00.000Z',
        createdAt: '2026-03-13T01:20:00.000Z',
      }),
    ];
    mockSignals = [{ id: 'signal-1', createdAt: '2026-03-13T02:25:00.000Z' }];

    jest.spyOn(worldYiAutonomousState, 'resolveWorldYiAutonomyRuntimePolicy').mockReturnValue({
      effectivePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 0,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      basePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 0,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      appliedSignals: [],
      ignoredSignals: [],
    });
    jest.spyOn(worldYiAutonomousState, 'readWorldYiContentDecisionLedger').mockReturnValue([]);
    jest.spyOn(worldYiAutonomousState, 'readOpenAgentContentAnalysisSnapshot').mockReturnValue(null);
    jest.spyOn(worldYiAutonomousState, 'summarizeOpenAgentAutonomyBacklogFocus').mockReturnValue({ laneReserve: false, focusKeys: [], qualityGate: false, decisionLedger: false, topTargets: [] });
    jest.spyOn(worldYiAutonomousState, 'summarizeWorldYiContentDecisionLedger').mockReturnValue({
      recentCycles: [],
      decisionCounts: {},
      blockedReasonCounts: [],
      latestDecisionMix: { publishCount: 0, holdCount: 0, reviseCount: 0, blockedCount: 0, totalCandidates: 0, readyCount: 0 },
      topBlockedReasons: [],
      topHeldCandidates: [],
      topReviseCandidates: [],
      lastPublishRationale: [],
    } as ReturnType<typeof worldYiAutonomousState.summarizeWorldYiContentDecisionLedger>);
    jest.spyOn(worldYiAutonomousState, 'writeWorldYiContentDecisionLedgerEntry').mockImplementation((entry) => entry as ReturnType<typeof worldYiAutonomousState.writeWorldYiContentDecisionLedgerEntry>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationLaneSummaries').mockReturnValue([] as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationLaneSummaries>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationReserveSignal').mockReturnValue({
      weakLaneKeys: [],
      queuedTargetsPerLane: { main: 0, wave2: 0, global: 0 },
      minQueuedTargetsPerLane: 0,
    } as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationReserveSignal>);
    jest.spyOn(worldYiPublicationLanes, 'findWorldYiLaneCoverageRow').mockReturnValue(null);
    jest.spyOn(worldYiPublicationLanes, 'getWorldYiPublicationLaneConfigByKey').mockReturnValue(null);

    const now = new Date('2026-03-13T02:30:00.000Z');
    const config = {
      timezoneOffsetMinutes: 480,
      publishHours: [10, 15, 20],
      dailyPublishLimit: 200,
      minPublishGapMinutes: 180,
      draftReserveTarget: 2,
      draftBatchSize: 24,
      generateCooldownMinutes: 240,
      radarRefreshMaxAgeHours: 4,
      adaptiveTypeWeight: 10,
      adaptiveRadarSourceWeight: 14,
      adaptiveFreshnessWeight: 8,
    };
    const state = buildContentSchedulerState({
      entries: mockEntries,
      runs: mockRuns,
      now,
      config,
    });
    expect(state.publishWindowOpen).toBe(true);
    expect(state.canPublishNow).toBe(true);
    expect(rankScheduledPublishCandidates({
      entries: mockEntries,
      analyticsRows: mockAnalyticsRows,
      now,
      config,
    })).toHaveLength(3);

    const result = await runContentSchedulerCycle({ trigger: 'manual' });

    expect(result.publishedCount).toBeGreaterThan(1);
    expect(mockSaveManagedContentEntry).toHaveBeenCalledTimes(3);
    expect(mockEntries.filter((entry) => entry.status === 'published' && entry.id.startsWith('draft-'))).toHaveLength(3);
  });

  it('marks scheduled public growth publications as public coverage ready', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-13T02:30:00.000Z'));
    process.env.CONTENT_SCHEDULER_PUBLISH_HOURS = '10,15,20';
    process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT = '1';
    process.env.CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES = '180';
    process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE = '1';
    process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET = '0';
    process.env.CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES = '240';
    process.env.CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS = '4';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT = '10';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT = '14';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT = '8';

    mockEntries = [
      buildReadyDraftEntry({
        id: 'growth-draft-1',
        slug: 'growth-draft-1',
        title: '海外华人怎么看职业窗口',
        source: 'agent-llm:public-growth',
        sections: [1, 2, 3, 4].map((index) => ({
          title: `职业窗口判断 section ${index}`,
          paragraphs: [
            '这段内容明确讨论海外华人面对职业窗口时如何先判断现实变量，再结合阶段节奏确认行动边界与风险成本。',
            '第二段继续补足真实场景、用户困惑、可执行动作和下一步测算入口，避免只给空泛结论或占位文字。',
          ],
        })),
        meta: {
          sourceType: 'public-growth',
          growthPlanKey: 'career-timing',
          locale: 'zh-CN',
          market: '海外华人',
        },
      }),
    ];
    mockSignals = [{ id: 'signal-1', createdAt: '2026-03-13T02:25:00.000Z' }];

    jest.spyOn(worldYiAutonomousState, 'resolveWorldYiAutonomyRuntimePolicy').mockReturnValue({
      effectivePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: true,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 0,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      basePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: true,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 0,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      appliedSignals: [],
      ignoredSignals: [],
    });
    jest.spyOn(worldYiAutonomousState, 'readWorldYiContentDecisionLedger').mockReturnValue([]);
    jest.spyOn(worldYiAutonomousState, 'readOpenAgentContentAnalysisSnapshot').mockReturnValue(null);
    jest.spyOn(worldYiAutonomousState, 'summarizeOpenAgentAutonomyBacklogFocus').mockReturnValue({ laneReserve: false, focusKeys: [], qualityGate: false, decisionLedger: false, topTargets: [] });
    jest.spyOn(worldYiAutonomousState, 'summarizeWorldYiContentDecisionLedger').mockReturnValue({
      recentCycles: [],
      decisionCounts: {},
      blockedReasonCounts: [],
      latestDecisionMix: { publishCount: 0, holdCount: 0, reviseCount: 0, blockedCount: 0, totalCandidates: 0, readyCount: 0 },
      topBlockedReasons: [],
      topHeldCandidates: [],
      topReviseCandidates: [],
      lastPublishRationale: [],
    } as ReturnType<typeof worldYiAutonomousState.summarizeWorldYiContentDecisionLedger>);
    jest.spyOn(worldYiAutonomousState, 'writeWorldYiContentDecisionLedgerEntry').mockImplementation((entry) => entry as ReturnType<typeof worldYiAutonomousState.writeWorldYiContentDecisionLedgerEntry>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationLaneSummaries').mockReturnValue([] as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationLaneSummaries>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationReserveSignal').mockReturnValue({
      weakLaneKeys: [],
      queuedTargetsPerLane: { main: 0, wave2: 0, global: 0 },
      minQueuedTargetsPerLane: 0,
    } as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationReserveSignal>);
    jest.spyOn(worldYiPublicationLanes, 'findWorldYiLaneCoverageRow').mockReturnValue(null);
    jest.spyOn(worldYiPublicationLanes, 'getWorldYiPublicationLaneConfigByKey').mockReturnValue(null);

    const result = await runContentSchedulerCycle({ trigger: 'manual' });

    expect(result.publishedCount).toBe(1);
    const published = mockEntries.find((entry) => entry.id === 'growth-draft-1');
    expect(published?.status).toBe('published');
    expect(published?.meta).toEqual(expect.objectContaining({
      publicationReady: true,
      surfaceVisibility: 'public',
      scheduleTrigger: 'manual',
    }));
    expect(published?.meta?.editorialScore).toBe(published?.meta?.scheduleScore);
    expect(published?.meta?.publishReasons).toEqual(published?.meta?.scheduleReasons);
    expect(typeof published?.meta?.autoPublishedAt).toBe('string');
  });

  it('replenishes draft reserve in the same cycle after multi-publish drains it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-13T02:30:00.000Z'));
    process.env.CONTENT_SCHEDULER_PUBLISH_HOURS = '10,15,20';
    process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT = '200';
    process.env.CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES = '180';
    process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE = '24';
    process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET = '3';
    process.env.CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES = '240';
    process.env.CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS = '4';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT = '10';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT = '14';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT = '8';

    const recentPublishedAt = '2026-03-12T20:00:00.000Z';
    mockEntries = [
      buildReadyDraftEntry({
        id: 'published-1',
        slug: 'published-1',
        title: '昨日已发布内容',
        status: 'published',
        updatedAt: recentPublishedAt,
        createdAt: recentPublishedAt,
      }),
      buildReadyDraftEntry({
        id: 'draft-1',
        slug: 'draft-1',
        title: '待发布草稿 1',
      }),
      buildReadyDraftEntry({
        id: 'draft-2',
        slug: 'draft-2',
        title: '待发布草稿 2',
        updatedAt: '2026-03-13T01:10:00.000Z',
        createdAt: '2026-03-13T01:10:00.000Z',
      }),
      buildReadyDraftEntry({
        id: 'draft-3',
        slug: 'draft-3',
        title: '待发布草稿 3',
        updatedAt: '2026-03-13T01:20:00.000Z',
        createdAt: '2026-03-13T01:20:00.000Z',
      }),
    ];
    mockSignals = [{ id: 'signal-1', createdAt: '2026-03-13T02:25:00.000Z' }];

    jest.spyOn(worldYiAutonomousState, 'resolveWorldYiAutonomyRuntimePolicy').mockReturnValue({
      effectivePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 3,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      basePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 3,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      appliedSignals: [],
      ignoredSignals: [],
    });
    jest.spyOn(worldYiAutonomousState, 'readWorldYiContentDecisionLedger').mockReturnValue([]);
    jest.spyOn(worldYiAutonomousState, 'readOpenAgentContentAnalysisSnapshot').mockReturnValue(null);
    jest.spyOn(worldYiAutonomousState, 'summarizeOpenAgentAutonomyBacklogFocus').mockReturnValue({ laneReserve: false, focusKeys: [], qualityGate: false, decisionLedger: false, topTargets: [] });
    jest.spyOn(worldYiAutonomousState, 'summarizeWorldYiContentDecisionLedger').mockReturnValue({
      recentCycles: [],
      decisionCounts: {},
      blockedReasonCounts: [],
      latestDecisionMix: { publishCount: 0, holdCount: 0, reviseCount: 0, blockedCount: 0, totalCandidates: 0, readyCount: 0 },
      topBlockedReasons: [],
      topHeldCandidates: [],
      topReviseCandidates: [],
      lastPublishRationale: [],
    } as ReturnType<typeof worldYiAutonomousState.summarizeWorldYiContentDecisionLedger>);
    jest.spyOn(worldYiAutonomousState, 'writeWorldYiContentDecisionLedgerEntry').mockImplementation((entry) => entry as ReturnType<typeof worldYiAutonomousState.writeWorldYiContentDecisionLedgerEntry>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationLaneSummaries').mockReturnValue([] as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationLaneSummaries>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationReserveSignal').mockReturnValue({
      weakLaneKeys: [],
      queuedTargetsPerLane: { main: 0, wave2: 0, global: 0 },
      minQueuedTargetsPerLane: 0,
    } as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationReserveSignal>);
    jest.spyOn(worldYiPublicationLanes, 'findWorldYiLaneCoverageRow').mockReturnValue(null);
    jest.spyOn(worldYiPublicationLanes, 'getWorldYiPublicationLaneConfigByKey').mockReturnValue(null);

    let generatedIndex = 0;
    mockGenerateManagedContentDrafts.mockImplementation(async () => {
      generatedIndex += 1;
      const draft = buildReadyDraftEntry({
        id: `generated-${generatedIndex}`,
        slug: `generated-${generatedIndex}`,
        title: `补充草稿 ${generatedIndex}`,
      });
      return {
        entries: [{
          contentType: draft.contentType,
          subtype: draft.subtype,
          slug: draft.slug,
          title: draft.title,
          name: draft.name,
          excerpt: draft.excerpt,
          category: draft.category,
          readTime: draft.readTime,
          tags: draft.tags,
          featured: draft.featured,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          sections: draft.sections,
          source: draft.source,
        }],
      };
    });

    const result = await runContentSchedulerCycle({ trigger: 'manual' });

    expect(result.publishedCount).toBe(3);
    expect(result.generatedCount).toBe(3);
    expect(mockGenerateManagedContentDrafts).toHaveBeenCalledTimes(3);
    expect(mockEntries.filter((entry) => entry.status === 'draft')).toHaveLength(3);
  });

  it('previews post-publish replenishment needed for continuous publishing', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-13T02:30:00.000Z'));
    process.env.CONTENT_SCHEDULER_PUBLISH_HOURS = '10,15,20';
    process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT = '200';
    process.env.CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES = '180';
    process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE = '24';
    process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET = '3';
    process.env.CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES = '240';
    process.env.CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS = '4';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT = '10';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT = '14';
    process.env.CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT = '8';

    mockEntries = [
      buildReadyDraftEntry({
        id: 'published-1',
        slug: 'published-1',
        title: '昨日已发布内容',
        status: 'published',
        updatedAt: '2026-03-12T20:00:00.000Z',
        createdAt: '2026-03-12T20:00:00.000Z',
      }),
      buildReadyDraftEntry({
        id: 'draft-1',
        slug: 'draft-1',
        title: '待发布草稿 1',
      }),
      buildReadyDraftEntry({
        id: 'draft-2',
        slug: 'draft-2',
        title: '待发布草稿 2',
        updatedAt: '2026-03-13T01:10:00.000Z',
        createdAt: '2026-03-13T01:10:00.000Z',
      }),
      buildReadyDraftEntry({
        id: 'draft-3',
        slug: 'draft-3',
        title: '待发布草稿 3',
        updatedAt: '2026-03-13T01:20:00.000Z',
        createdAt: '2026-03-13T01:20:00.000Z',
      }),
    ];
    mockSignals = [{ id: 'signal-1', createdAt: '2026-03-13T02:25:00.000Z' }];

    jest.spyOn(worldYiAutonomousState, 'resolveWorldYiAutonomyRuntimePolicy').mockReturnValue({
      effectivePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 3,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      basePolicy: {
        version: 1,
        source: 'default',
        focusKeys: [],
        topTargets: [],
        publishGate: {
          requireLlmSource: false,
          minScore: 0,
          laneGapBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          requireGrowthPublicationReady: false,
          blockLowPerformanceTypes: false,
          lowPerformanceTypeMinPublishedCount: 999,
          blockLowPerformanceRadarSources: false,
          lowPerformanceRadarSourceMinPublishedCount: 999,
        },
        queueWeights: {
          laneGapBaseBoost: 0,
          weakLaneBoost: 0,
          backlogLaneReserveBoost: 0,
          radarQuota: 0,
          clusterQuota: 3,
          perLaneQuota: 0,
        },
        validationMode: {
          skipKnowledgeAcquisition: false,
          skipReportUpgrade: false,
          skipMonthlyDigest: false,
          skipEmailRetry: false,
          skipOpenAgentReview: false,
        },
        updatedAt: '2026-03-13T02:30:00.000Z',
      },
      appliedSignals: [],
      ignoredSignals: [],
    });
    jest.spyOn(worldYiAutonomousState, 'readWorldYiContentDecisionLedger').mockReturnValue([]);
    jest.spyOn(worldYiAutonomousState, 'readOpenAgentContentAnalysisSnapshot').mockReturnValue(null);
    jest.spyOn(worldYiAutonomousState, 'summarizeOpenAgentAutonomyBacklogFocus').mockReturnValue({ laneReserve: false, focusKeys: [], qualityGate: false, decisionLedger: false, topTargets: [] });
    jest.spyOn(worldYiAutonomousState, 'summarizeWorldYiContentDecisionLedger').mockReturnValue({
      recentCycles: [],
      decisionCounts: {},
      blockedReasonCounts: [],
      latestDecisionMix: { publishCount: 0, holdCount: 0, reviseCount: 0, blockedCount: 0, totalCandidates: 0, readyCount: 0 },
      topBlockedReasons: [],
      topHeldCandidates: [],
      topReviseCandidates: [],
      lastPublishRationale: [],
    } as ReturnType<typeof worldYiAutonomousState.summarizeWorldYiContentDecisionLedger>);
    jest.spyOn(worldYiAutonomousState, 'writeWorldYiContentDecisionLedgerEntry').mockImplementation((entry) => entry as ReturnType<typeof worldYiAutonomousState.writeWorldYiContentDecisionLedgerEntry>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationLaneSummaries').mockReturnValue([] as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationLaneSummaries>);
    jest.spyOn(worldYiPublicationLanes, 'buildWorldYiPublicationReserveSignal').mockReturnValue({
      weakLaneKeys: [],
      queuedTargetsPerLane: { main: 0, wave2: 0, global: 0 },
      minQueuedTargetsPerLane: 0,
    } as ReturnType<typeof worldYiPublicationLanes.buildWorldYiPublicationReserveSignal>);
    jest.spyOn(worldYiPublicationLanes, 'findWorldYiLaneCoverageRow').mockReturnValue(null);
    jest.spyOn(worldYiPublicationLanes, 'getWorldYiPublicationLaneConfigByKey').mockReturnValue(null);

    const result = await runContentSchedulerCycle({ trigger: 'manual', mode: 'validate' });

    expect(result.preview?.wouldPublishSlug).toBeTruthy();
    expect(result.preview?.wouldGenerateCount).toBe(3);
    expect(result.reason).toBe('validation_mode_detected_post_publish_reserve_gap');
    expect(mockSaveManagedContentEntry).not.toHaveBeenCalled();
    expect(mockGenerateManagedContentDrafts).not.toHaveBeenCalled();
  });
});
