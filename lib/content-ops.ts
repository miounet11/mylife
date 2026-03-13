import { generateManagedContentDrafts } from '@/lib/content-generation';
import { analyticsOperations, contentSchedulerRunOperations, contentSignalOperations } from '@/lib/database';
import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
  type ManagedContentType,
} from '@/lib/content-store';
import type { EntityInsightType } from '@/lib/content';
import { runContentRadarCycle } from '@/lib/content-radar';
import type { ContentSchedulerRunRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

type AnalyticsRow = {
  event_name: string;
  page?: string | null;
  meta?: string | null;
  created_at: string;
};

type StrategicCluster = {
  key: string;
  title: string;
  angle: string;
  keywords: string[];
  primaryType: ManagedContentType;
  subtype?: EntityInsightType;
  baseDemand: number;
  topic: string;
  audience: string;
};

type ContentSurfaceStat = {
  key: string;
  label: string;
  views: number;
  clicks: number;
  quickStarts: number;
  conversionRate: number;
};

type ClusterCoverage = {
  key: string;
  title: string;
  priorityScore: number;
  demandScore: number;
  publishedCount: number;
  draftCount: number;
  missingTypes: ManagedContentType[];
  sampleTitles: string[];
  keywords: string[];
};

type GenerationQueueItem = {
  key: string;
  title: string;
  topic: string;
  angle: string;
  contentType: ManagedContentType;
  subtype?: EntityInsightType;
  keywords: string[];
  reason: string;
  priorityScore: number;
  audience: string;
  sourceType?: 'cluster' | 'radar';
};

type AutoPublishCandidate = {
  id: string;
  title: string;
  slug: string;
  source: string;
  score: number;
};

type ContentPerformanceStat = {
  id: string;
  title: string;
  slug: string;
  contentType: ManagedContentType;
  status: string;
  source: string;
  origin: string;
  radarSourceLabel?: string;
  views: number;
  clicks: number;
  quickStarts: number;
  conversionRate: number;
};

type RadarSourcePerformanceStat = {
  sourceId: string;
  sourceLabel: string;
  platform: string;
  entryCount: number;
  publishedCount: number;
  views: number;
  clicks: number;
  quickStarts: number;
  conversionRate: number;
  bestTitle?: string;
  bestQuickStarts?: number;
};

type ContentSchedulerConfig = {
  timezoneOffsetMinutes: number;
  publishHours: number[];
  dailyPublishLimit: number;
  minPublishGapMinutes: number;
  draftReserveTarget: number;
  draftBatchSize: number;
  generateCooldownMinutes: number;
  radarRefreshMaxAgeHours: number;
  adaptiveTypeWeight: number;
  adaptiveRadarSourceWeight: number;
  adaptiveFreshnessWeight: number;
};

type ContentSchedulerState = {
  localNow: string;
  publishHours: number[];
  dailyPublishLimit: number;
  publishedToday: number;
  draftReserveTarget: number;
  draftReserveCount: number;
  needsDraftReplenishment: boolean;
  publishWindowOpen: boolean;
  canPublishNow: boolean;
  nextPublishSlotLabel: string;
  lastPublishedAt?: string;
  lastGeneratedAt?: string;
  minutesSinceLastPublish?: number;
  minutesSinceLastGenerate?: number;
  recentRuns: ContentSchedulerRunRecord[];
};

type ContentTypeBenchmark = {
  contentType: ManagedContentType;
  publishedCount: number;
  avgConversionRate: number;
  avgQuickStarts: number;
};

type RadarSourceBenchmark = {
  sourceId: string;
  avgConversionRate: number;
  avgQuickStarts: number;
  publishedCount: number;
};

type ContentPerformanceContext = {
  surfaceBuckets: Record<string, { views: number; clicks: number; quickStarts: number }>;
  clusterSignalBuckets: Record<string, number>;
  entryBuckets: Record<string, { views: number; clicks: number; quickStarts: number }>;
  contentTypeBenchmarks: Record<string, ContentTypeBenchmark>;
  radarSourceBenchmarks: Record<string, RadarSourceBenchmark>;
};

type ScheduledPublishCandidate = {
  entry: ManagedContentEntry;
  score: number;
  reasons: string[];
};

export const STRATEGIC_CLUSTERS: StrategicCluster[] = [
  {
    key: 'solar-time',
    title: '真太阳时与时间精度',
    angle: '解释为什么时间精度直接影响排盘结果和用户信任',
    keywords: ['真太阳时', '排盘', '时柱', '节气', '出生时间'],
    primaryType: 'knowledge',
    baseDemand: 10,
    topic: '真太阳时为什么会影响排盘准确度',
    audience: '首次接触命理分析的新用户',
  },
  {
    key: 'report-reading',
    title: '报告解读与结果阅读',
    angle: '帮助普通用户快速读懂结构、趋势和建议',
    keywords: ['报告', '结果页', '怎么看', '命盘解读', '五行'],
    primaryType: 'knowledge',
    baseDemand: 9,
    topic: '普通用户如何快速读懂一份命理报告',
    audience: '已经看过结果页但理解不够深的用户',
  },
  {
    key: 'career-timing',
    title: '职业窗口与换岗节奏',
    angle: '聚焦换工作、跳槽、升职和职业节奏判断',
    keywords: ['事业', '职业', '跳槽', '换工作', '升职', '时机'],
    primaryType: 'case',
    baseDemand: 10,
    topic: '2026 年换工作与职业推进该怎么看时机窗口',
    audience: '25-40 岁职场用户',
  },
  {
    key: 'relationship-timing',
    title: '关系推进与婚恋节奏',
    angle: '围绕关系推进、风险窗口和互动节奏建立内容层',
    keywords: ['婚恋', '关系', '感情', '结婚', '复合', '时间窗口'],
    primaryType: 'case',
    baseDemand: 9,
    topic: '关系推进不是看会不会，而是看什么时候更稳',
    audience: '关注婚恋关系和互动风险的用户',
  },
  {
    key: 'wealth-risk',
    title: '财富选择与风险控制',
    angle: '从投资、创业、现金流和风险控制切入',
    keywords: ['财富', '投资', '创业', '破财', '现金流', '风险'],
    primaryType: 'knowledge',
    baseDemand: 8,
    topic: '命理报告在财富决策里更适合解决什么问题',
    audience: '关注财富节奏和风险控制的用户',
  },
  {
    key: 'city-migration',
    title: '城市迁移与地理位置',
    angle: '连接城市、地理位置、迁移和个人窗口',
    keywords: ['城市', '迁移', '换城市', '定居', '地理位置', '风水'],
    primaryType: 'insight',
    subtype: 'city',
    baseDemand: 8,
    topic: '城市迁移和地理位置变化会怎样影响个人节奏判断',
    audience: '考虑换城市、定居和发展路径的用户',
  },
  {
    key: 'industry-cycle',
    title: '行业周期与产业节奏',
    angle: '把行业运、产业运和个人职业选择连起来',
    keywords: ['行业', '产业', '行业运', '职业选择', '赛道', '周期'],
    primaryType: 'insight',
    subtype: 'industry',
    baseDemand: 9,
    topic: '行业周期变化时，个人职业决策应该怎样看节奏',
    audience: '关注赛道切换和行业窗口的用户',
  },
  {
    key: 'gaokao-study',
    title: '升学高考与教育选择',
    angle: '面向升学场景，强调时间窗口、方向判断和焦虑管理',
    keywords: ['高考', '升学', '专业选择', '教育', '考试', '升学规划'],
    primaryType: 'case',
    baseDemand: 8,
    topic: '升学焦虑里真正需要判断的是方向还是时机',
    audience: '学生家庭和升学规划用户',
  },
  {
    key: 'health-balance',
    title: '健康压力与身心平衡',
    angle: '用成熟表达方式解释健康节奏、压力和复原窗口',
    keywords: ['健康', '压力', '焦虑', '作息', '身体', '恢复'],
    primaryType: 'knowledge',
    baseDemand: 7,
    topic: '命理报告如何帮助理解压力周期和恢复窗口',
    audience: '关注身心压力和生活平衡的用户',
  },
  {
    key: 'organization-rhythm',
    title: '组织变化与公司节奏',
    angle: '围绕组织、公司和团队变化建立洞察内容',
    keywords: ['公司', '组织', '团队', '裁员', '组织调整', '管理'],
    primaryType: 'insight',
    subtype: 'company',
    baseDemand: 7,
    topic: '组织变化频繁时，个人该怎样判断进退节奏',
    audience: '经历组织变化的职场用户',
  },
];

function parseMeta<T>(value?: string | null) {
  if (!value) return {} as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildSurfaceLabel(key: string) {
  if (key === 'knowledge_page') return '知识库列表页';
  if (key === 'cases_page') return '案例列表页';
  if (key === 'insights_page') return '洞察列表页';
  if (key === 'home_featured_content') return '首页精选内容区';
  if (key.startsWith('knowledge_article:')) return `知识文章 ${key.split(':')[1]}`;
  if (key.startsWith('case_article:')) return `案例文章 ${key.split(':')[1]}`;
  if (key.startsWith('insight_article:')) return `洞察文章 ${key.split(':').slice(2).join(':') || key}`;
  return key;
}

function entryText(entry: ManagedContentEntry) {
  return normalizeText([
    entry.title,
    entry.excerpt,
    entry.category || '',
    entry.name || '',
    entry.tags.join(' '),
    entry.sections.flatMap((section) => [section.title, ...section.paragraphs]).join(' '),
  ].join(' '));
}

function rowText(meta: Record<string, unknown>) {
  const tags = Array.isArray(meta.tags) ? meta.tags.join(' ') : '';
  return normalizeText([
    `${meta.title || ''}`,
    `${meta.category || ''}`,
    `${meta.name || ''}`,
    tags,
    `${meta.slug || ''}`,
  ].join(' '));
}

function matchesKeywords(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function getPublishedTypesForCluster(entries: ManagedContentEntry[], cluster: StrategicCluster) {
  const matchingEntries = entries.filter((entry) => matchesKeywords(entryText(entry), cluster.keywords));
  const publishedEntries = matchingEntries.filter((entry) => entry.status === 'published');
  const byType = new Set(publishedEntries.map((entry) => entry.contentType));

  return {
    publishedCount: publishedEntries.length,
    draftCount: matchingEntries.filter((entry) => entry.status === 'draft').length,
    sampleTitles: matchingEntries.slice(0, 3).map((entry) => entry.title),
    coveredTypes: byType,
  };
}

function qualifiesForAutoPublish(entry: {
  llmUsed: boolean;
  source?: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  sections: Array<{ title: string; paragraphs: string[] }>;
}) {
  const paragraphQualityOk = entry.sections.every((section) => (
    section.title.trim().length >= 4 &&
    section.paragraphs.length >= 2 &&
    section.paragraphs.every((paragraph) => paragraph.trim().length >= 12)
  ));
  const baseOk = (
    entry.excerpt.trim().length >= 56 &&
    entry.seoTitle.trim().length >= 12 &&
    entry.seoDescription.trim().length >= 42 &&
    entry.tags.length >= 4 &&
    entry.sections.length >= 4 &&
    paragraphQualityOk
  );

  if (!baseOk) {
    return false;
  }

  if (entry.llmUsed) {
    return true;
  }

  return `${entry.source || ''}`.startsWith('agent-fallback:');
}

function ensureUniqueSlug(slug: string, used: Set<string>) {
  let nextSlug = slug;
  let suffix = 2;
  while (used.has(nextSlug)) {
    nextSlug = `${slug}-${suffix}`;
    suffix += 1;
  }
  used.add(nextSlug);
  return nextSlug;
}

function normalizeUtcString(value?: string) {
  if (!value) return null;
  return value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
}

function parseUtcDate(value?: string) {
  const normalized = normalizeUtcString(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function minutesBetween(now: Date, value?: string) {
  const parsed = parseUtcDate(value);
  if (!parsed) return null;
  return Math.max(0, Math.round((now.getTime() - parsed.getTime()) / 60_000));
}

function parsePositiveNumber(value: string | undefined, fallback: number, minimum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(minimum, Math.round(parsed));
}

function parsePublishHours(raw: string | undefined) {
  const hours = `${raw || ''}`
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 23);

  return [...new Set(hours)].sort((left, right) => left - right);
}

function formatLocalClock(date: Date, offsetMinutes: number) {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const hour = String(shifted.getUTCHours()).padStart(2, '0');
  const minute = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function localDateKey(date: Date, offsetMinutes: number) {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localHour(date: Date, offsetMinutes: number) {
  return new Date(date.getTime() + offsetMinutes * 60_000).getUTCHours();
}

function nextPublishSlotLabel(now: Date, config: ContentSchedulerConfig) {
  if (!config.publishHours.length) {
    return '未配置';
  }

  const currentHour = localHour(now, config.timezoneOffsetMinutes);
  const nextHour = config.publishHours.find((item) => item > currentHour);
  if (typeof nextHour === 'number') {
    return `${String(nextHour).padStart(2, '0')}:00`;
  }

  return `明日 ${String(config.publishHours[0]).padStart(2, '0')}:00`;
}

function getContentSchedulerConfig(): ContentSchedulerConfig {
  return {
    timezoneOffsetMinutes: parsePositiveNumber(process.env.CONTENT_SCHEDULER_TIMEZONE_OFFSET_MINUTES, 480, 0),
    publishHours: parsePublishHours(process.env.CONTENT_SCHEDULER_PUBLISH_HOURS || '10,15,20'),
    dailyPublishLimit: parsePositiveNumber(process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT, 3, 1),
    minPublishGapMinutes: parsePositiveNumber(process.env.CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES, 180, 30),
    draftReserveTarget: parsePositiveNumber(process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET, 12, 3),
    draftBatchSize: parsePositiveNumber(process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE, 3, 1),
    generateCooldownMinutes: parsePositiveNumber(process.env.CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES, 240, 30),
    radarRefreshMaxAgeHours: parsePositiveNumber(process.env.CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS, 4, 1),
    adaptiveTypeWeight: parsePositiveNumber(process.env.CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT, 10, 0),
    adaptiveRadarSourceWeight: parsePositiveNumber(process.env.CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT, 14, 0),
    adaptiveFreshnessWeight: parsePositiveNumber(process.env.CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT, 8, 0),
  };
}

function computeAutoPublishScore(entry: ManagedContentEntry) {
  return (
    entry.sections.length * 12 +
    entry.tags.length * 6 +
    Math.min(entry.excerpt.length, 80) +
    Math.min(entry.seoDescription.length, 80) +
    (entry.meta?.origin === 'content-radar' ? 16 : 0)
  );
}

function buildEntryKey(contentType: string, slug: string) {
  return `${contentType}:${slug}`;
}

function parseEntryIdentity(meta: Record<string, unknown>) {
  const slug = typeof meta.slug === 'string' ? meta.slug.trim() : '';
  const contentType = typeof meta.contentType === 'string' ? meta.contentType.trim() : '';

  if (slug && (contentType === 'knowledge' || contentType === 'case' || contentType === 'insight')) {
    return {
      slug,
      contentType: contentType as ManagedContentType,
      key: buildEntryKey(contentType, slug),
    };
  }

  return null;
}

function deriveEntryOrigin(entry: ManagedContentEntry) {
  const meta = entry.meta || {};

  if (meta.origin === 'content-radar') {
    return `热点转内容 · ${meta.radarSourceLabel || '未知源'}`;
  }
  if (`${entry.source}`.includes(':automation')) {
    return '自动化生成';
  }
  if (`${entry.source}`.startsWith('agent-llm:')) {
    return 'AI 生成';
  }
  if (`${entry.source}` === 'seed') {
    return '初始内容';
  }

  return '人工内容';
}

function listRecentContentAnalyticsRows() {
  return analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE datetime(created_at) >= datetime('now', '-30 days')
      AND event_name IN (
        'knowledge_page_viewed',
        'knowledge_article_viewed',
        'cases_page_viewed',
        'case_article_viewed',
        'insights_page_viewed',
        'insight_article_viewed',
        'content_card_clicked',
        'content_quick_analyze_started'
      )
    ORDER BY created_at DESC
  `) as AnalyticsRow[];
}

function buildContentPerformanceContext(params: {
  entries: ManagedContentEntry[];
  analyticsRows: AnalyticsRow[];
}): ContentPerformanceContext {
  const surfaceBuckets: Record<string, { views: number; clicks: number; quickStarts: number }> = {};
  const clusterSignalBuckets: Record<string, number> = {};
  const entryBuckets: Record<string, { views: number; clicks: number; quickStarts: number }> = {};

  for (const row of params.analyticsRows) {
    const meta = parseMeta<Record<string, unknown>>(row.meta);
    const surfaceKey = typeof meta.surfaceKey === 'string'
      ? meta.surfaceKey
      : typeof meta.sourceKey === 'string'
        ? meta.sourceKey
        : row.page || 'unknown';

    if (!surfaceBuckets[surfaceKey]) {
      surfaceBuckets[surfaceKey] = { views: 0, clicks: 0, quickStarts: 0 };
    }

    if (row.event_name.endsWith('_page_viewed')) {
      surfaceBuckets[surfaceKey].views += 1;
    }
    if (row.event_name === 'content_card_clicked') {
      surfaceBuckets[surfaceKey].clicks += 1;
    }
    if (row.event_name === 'content_quick_analyze_started') {
      surfaceBuckets[surfaceKey].quickStarts += 1;
    }

    const entryIdentity = parseEntryIdentity(meta);
    if (entryIdentity) {
      if (!entryBuckets[entryIdentity.key]) {
        entryBuckets[entryIdentity.key] = { views: 0, clicks: 0, quickStarts: 0 };
      }

      if (row.event_name.endsWith('_page_viewed')) {
        entryBuckets[entryIdentity.key].views += 1;
      }
      if (row.event_name === 'content_card_clicked') {
        entryBuckets[entryIdentity.key].clicks += 1;
      }
      if (row.event_name === 'content_quick_analyze_started') {
        entryBuckets[entryIdentity.key].quickStarts += 1;
      }
    }

    const text = rowText(meta);
    STRATEGIC_CLUSTERS.forEach((cluster) => {
      if (matchesKeywords(text, cluster.keywords)) {
        clusterSignalBuckets[cluster.key] = (clusterSignalBuckets[cluster.key] || 0) + 1;
      }
    });
  }

  const contentTypeBenchmarks = params.entries
    .filter((entry) => entry.status === 'published')
    .reduce<Record<string, ContentTypeBenchmark>>((accumulator, entry) => {
      const key = entry.contentType;
      const bucket = entryBuckets[buildEntryKey(entry.contentType, entry.slug)] || { views: 0, clicks: 0, quickStarts: 0 };
      if (!accumulator[key]) {
        accumulator[key] = {
          contentType: entry.contentType,
          publishedCount: 0,
          avgConversionRate: 0,
          avgQuickStarts: 0,
        };
      }
      accumulator[key].publishedCount += 1;
      accumulator[key].avgConversionRate += bucket.views > 0 ? (bucket.quickStarts / Math.max(1, bucket.views)) * 100 : 0;
      accumulator[key].avgQuickStarts += bucket.quickStarts;
      return accumulator;
    }, {});

  Object.values(contentTypeBenchmarks).forEach((item) => {
    item.avgConversionRate = item.publishedCount > 0 ? Math.round(item.avgConversionRate / item.publishedCount) : 0;
    item.avgQuickStarts = item.publishedCount > 0 ? Math.round(item.avgQuickStarts / item.publishedCount) : 0;
  });

  const radarSourceBenchmarks = params.entries
    .filter((entry) => entry.status === 'published')
    .reduce<Record<string, RadarSourceBenchmark>>((accumulator, entry) => {
      const sourceId = typeof entry.meta?.radarSourceId === 'string' ? entry.meta.radarSourceId : '';
      if (!sourceId) {
        return accumulator;
      }
      const bucket = entryBuckets[buildEntryKey(entry.contentType, entry.slug)] || { views: 0, clicks: 0, quickStarts: 0 };
      if (!accumulator[sourceId]) {
        accumulator[sourceId] = {
          sourceId,
          avgConversionRate: 0,
          avgQuickStarts: 0,
          publishedCount: 0,
        };
      }
      accumulator[sourceId].publishedCount += 1;
      accumulator[sourceId].avgConversionRate += bucket.views > 0 ? (bucket.quickStarts / Math.max(1, bucket.views)) * 100 : 0;
      accumulator[sourceId].avgQuickStarts += bucket.quickStarts;
      return accumulator;
    }, {});

  Object.values(radarSourceBenchmarks).forEach((item) => {
    item.avgConversionRate = item.publishedCount > 0 ? Math.round(item.avgConversionRate / item.publishedCount) : 0;
    item.avgQuickStarts = item.publishedCount > 0 ? Math.round(item.avgQuickStarts / item.publishedCount) : 0;
  });

  return {
    surfaceBuckets,
    clusterSignalBuckets,
    entryBuckets,
    contentTypeBenchmarks,
    radarSourceBenchmarks,
  };
}

export function buildContentSchedulerState(params: {
  entries: ManagedContentEntry[];
  runs: ContentSchedulerRunRecord[];
  now?: Date;
  config?: ContentSchedulerConfig;
}) {
  const now = params.now || new Date();
  const config = params.config || getContentSchedulerConfig();
  const todayKey = localDateKey(now, config.timezoneOffsetMinutes);
  const draftReserveCount = params.entries.filter((entry) => entry.status === 'draft').length;
  const publishedToday = params.entries.filter((entry) => (
    entry.status === 'published' &&
    localDateKey(parseUtcDate(entry.updatedAt) || now, config.timezoneOffsetMinutes) === todayKey
  )).length;
  const lastPublishedAt = params.entries
    .filter((entry) => entry.status === 'published')
    .sort((left, right) => (parseUtcDate(right.updatedAt)?.getTime() || 0) - (parseUtcDate(left.updatedAt)?.getTime() || 0))[0]?.updatedAt;
  const lastGeneratedAt = params.runs
    .filter((run) => run.status === 'success' && (run.generatedCount || 0) > 0)
    .sort((left, right) => (parseUtcDate(right.createdAt)?.getTime() || 0) - (parseUtcDate(left.createdAt)?.getTime() || 0))[0]?.createdAt;
  const minutesSinceLastPublish = minutesBetween(now, lastPublishedAt);
  const minutesSinceLastGenerate = minutesBetween(now, lastGeneratedAt);
  const publishWindowOpen = config.publishHours.includes(localHour(now, config.timezoneOffsetMinutes));
  const canPublishNow = publishWindowOpen &&
    publishedToday < config.dailyPublishLimit &&
    (minutesSinceLastPublish === null || minutesSinceLastPublish >= config.minPublishGapMinutes);

  return {
    localNow: formatLocalClock(now, config.timezoneOffsetMinutes),
    publishHours: config.publishHours,
    dailyPublishLimit: config.dailyPublishLimit,
    publishedToday,
    draftReserveTarget: config.draftReserveTarget,
    draftReserveCount,
    needsDraftReplenishment: draftReserveCount < config.draftReserveTarget &&
      (minutesSinceLastGenerate === null || minutesSinceLastGenerate >= config.generateCooldownMinutes),
    publishWindowOpen,
    canPublishNow,
    nextPublishSlotLabel: nextPublishSlotLabel(now, config),
    lastPublishedAt,
    lastGeneratedAt,
    minutesSinceLastPublish: minutesSinceLastPublish === null ? undefined : minutesSinceLastPublish,
    minutesSinceLastGenerate: minutesSinceLastGenerate === null ? undefined : minutesSinceLastGenerate,
    recentRuns: params.runs.slice(0, 10),
  } satisfies ContentSchedulerState;
}

export function rankScheduledPublishCandidates(params: {
  entries: ManagedContentEntry[];
  analyticsRows: AnalyticsRow[];
  now?: Date;
  config?: ContentSchedulerConfig;
}) {
  const now = params.now || new Date();
  const config = params.config || getContentSchedulerConfig();
  const performance = buildContentPerformanceContext({
    entries: params.entries,
    analyticsRows: params.analyticsRows,
  });

  return params.entries
    .filter((entry) => entry.status === 'draft')
    .filter((entry) => qualifiesForAutoPublish({
      llmUsed: entry.source.startsWith('agent-llm:'),
      source: entry.source,
      excerpt: entry.excerpt,
      seoTitle: entry.seoTitle,
      seoDescription: entry.seoDescription,
      tags: entry.tags,
      sections: entry.sections,
    }))
    .map((entry) => {
      const baseScore = computeAutoPublishScore(entry);
      const reasons = [`质量分 ${baseScore}`];
      let score = baseScore;

      const typeBenchmark = performance.contentTypeBenchmarks[entry.contentType];
      if (typeBenchmark) {
        const typeBoost = typeBenchmark.avgConversionRate * config.adaptiveTypeWeight / 10
          + typeBenchmark.avgQuickStarts * 4;
        score += typeBoost;
        reasons.push(`${entry.contentType} 历史转化加权 +${Math.round(typeBoost)}`);
      }

      const radarSourceId = typeof entry.meta?.radarSourceId === 'string' ? entry.meta.radarSourceId : '';
      if (radarSourceId && performance.radarSourceBenchmarks[radarSourceId]) {
        const sourceBenchmark = performance.radarSourceBenchmarks[radarSourceId];
        const sourceBoost = sourceBenchmark.avgConversionRate * config.adaptiveRadarSourceWeight / 10
          + sourceBenchmark.avgQuickStarts * 6;
        score += sourceBoost;
        reasons.push(`热点源反馈加权 +${Math.round(sourceBoost)}`);
      }

      const updatedAt = parseUtcDate(entry.updatedAt);
      const ageHours = updatedAt ? Math.max(0, (now.getTime() - updatedAt.getTime()) / 3_600_000) : 48;
      const freshnessBoost = Math.max(0, 24 - ageHours) * config.adaptiveFreshnessWeight / 24;
      score += freshnessBoost;
      reasons.push(`新鲜度加权 +${Math.round(freshnessBoost)}`);

      return {
        entry,
        score: Math.round(score),
        reasons,
      } satisfies ScheduledPublishCandidate;
    })
    .sort((left, right) => {
      const scoreGap = right.score - left.score;
      if (scoreGap !== 0) {
        return scoreGap;
      }
      return (parseUtcDate(right.entry.updatedAt)?.getTime() || 0) - (parseUtcDate(left.entry.updatedAt)?.getTime() || 0);
    });
}

function selectScheduledPublishCandidate(params: {
  entries: ManagedContentEntry[];
  analyticsRows: AnalyticsRow[];
  now?: Date;
  config?: ContentSchedulerConfig;
}) {
  return rankScheduledPublishCandidates(params)[0] || null;
}

export function buildContentOpsSnapshot(params: {
  entries: ManagedContentEntry[];
  analyticsRows: AnalyticsRow[];
  radarSignals?: ReturnType<typeof contentSignalOperations.listRecent>;
}) {
  const performance = buildContentPerformanceContext({
    entries: params.entries,
    analyticsRows: params.analyticsRows,
  });
  const { surfaceBuckets, clusterSignalBuckets, entryBuckets } = performance;

  const topSurfaces: ContentSurfaceStat[] = Object.entries(surfaceBuckets)
    .map(([key, value]) => ({
      key,
      label: buildSurfaceLabel(key),
      views: value.views,
      clicks: value.clicks,
      quickStarts: value.quickStarts,
      conversionRate: value.views > 0 ? Math.round((value.quickStarts / value.views) * 100) : 0,
    }))
    .sort((left, right) => right.quickStarts - left.quickStarts || right.views - left.views)
    .slice(0, 8);

  const clusterCoverage: ClusterCoverage[] = STRATEGIC_CLUSTERS.map((cluster) => {
    const { publishedCount, draftCount, sampleTitles, coveredTypes } = getPublishedTypesForCluster(params.entries, cluster);
    const missingTypes = (['knowledge', 'case', 'insight'] as ManagedContentType[])
      .filter((type) => type === cluster.primaryType || (type === 'knowledge' && cluster.baseDemand >= 8) || (type === 'case' && cluster.baseDemand >= 8))
      .filter((type) => !coveredTypes.has(type));
    const demandScore = cluster.baseDemand * 10 + (clusterSignalBuckets[cluster.key] || 0) * 6;
    const priorityScore = demandScore + Math.max(0, 3 - publishedCount) * 18 + missingTypes.length * 10 - draftCount * 4;

    return {
      key: cluster.key,
      title: cluster.title,
      priorityScore,
      demandScore,
      publishedCount,
      draftCount,
      missingTypes,
      sampleTitles,
      keywords: cluster.keywords,
    };
  }).sort((left, right) => right.priorityScore - left.priorityScore);

  const generationQueue: GenerationQueueItem[] = clusterCoverage.slice(0, 6).map((item) => {
    const cluster = STRATEGIC_CLUSTERS.find((entry) => entry.key === item.key)!;
    const targetType = item.missingTypes[0] || cluster.primaryType;

    return {
      key: item.key,
      title: cluster.title,
      topic: cluster.topic,
      angle: cluster.angle,
      contentType: targetType,
      subtype: targetType === 'insight' ? cluster.subtype : undefined,
      keywords: cluster.keywords,
      reason: `该主题需求分 ${item.demandScore}，当前已发布 ${item.publishedCount} 篇，优先补足 ${targetType} 类型内容。`,
      priorityScore: item.priorityScore,
      audience: cluster.audience,
      sourceType: 'cluster',
    };
  });

  const radarQueue: GenerationQueueItem[] = (params.radarSignals || [])
    .filter((signal) => (signal.score || 0) >= 18)
    .slice(0, 6)
    .map((signal, index) => {
      const inferredType: ManagedContentType = signal.matchedKeywords?.some((keyword) => /行业|城市|公司|组织|赛道/.test(keyword))
        ? 'insight'
        : signal.matchedKeywords?.some((keyword) => /高考|婚恋|关系|跳槽|事业|升学/.test(keyword))
          ? 'case'
          : 'knowledge';

      return {
        key: `radar:${signal.id}`,
        title: signal.title,
        topic: signal.title,
        angle: `结合“${signal.title}”这一外部热点，提炼普通用户真正关心的判断问题，并自然承接生日测算入口。`,
        contentType: inferredType,
        subtype: inferredType === 'insight'
          ? signal.matchedKeywords?.some((keyword) => /城市|地理/.test(keyword))
            ? 'city'
            : signal.matchedKeywords?.some((keyword) => /公司|组织/.test(keyword))
              ? 'company'
              : 'industry'
          : undefined,
        keywords: uniqueStrings([...(signal.matchedKeywords || []), signal.platform, signal.sourceLabel]),
        reason: `外部热点信号分 ${signal.score || 0}，来自 ${signal.sourceLabel}，适合优先转为 ${inferredType} 内容。`,
        priorityScore: 200 - index * 5 + (signal.score || 0),
        audience: '对热点话题有强烈兴趣、可能进一步转化为测算用户的人群',
        sourceType: 'radar',
      };
    });

  const mergedQueue = [...radarQueue, ...generationQueue]
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, 10);

  const autoPublishCandidates: AutoPublishCandidate[] = params.entries
    .filter((entry) => entry.status === 'draft' && entry.source.startsWith('agent-llm:'))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      source: entry.source,
      score: computeAutoPublishScore(entry),
    }))
    .filter((entry) => entry.score >= 180)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  const contentPerformance: ContentPerformanceStat[] = params.entries
    .map((entry) => {
      const bucket = entryBuckets[buildEntryKey(entry.contentType, entry.slug)] || { views: 0, clicks: 0, quickStarts: 0 };
      return {
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        contentType: entry.contentType,
        status: entry.status,
        source: entry.source,
        origin: deriveEntryOrigin(entry),
        radarSourceLabel: typeof entry.meta?.radarSourceLabel === 'string' ? entry.meta.radarSourceLabel : undefined,
        views: bucket.views,
        clicks: bucket.clicks,
        quickStarts: bucket.quickStarts,
        conversionRate: bucket.views > 0 ? Math.round((bucket.quickStarts / bucket.views) * 100) : 0,
      };
    })
    .filter((entry) => entry.views > 0 || entry.clicks > 0 || entry.quickStarts > 0)
    .sort((left, right) => right.quickStarts - left.quickStarts || right.views - left.views || right.clicks - left.clicks)
    .slice(0, 10);

  const radarSourcePerformance: RadarSourcePerformanceStat[] = Object.values(
    params.entries.reduce<Record<string, RadarSourcePerformanceStat>>((accumulator, entry) => {
      const sourceId = typeof entry.meta?.radarSourceId === 'string' ? entry.meta.radarSourceId : '';
      const sourceLabel = typeof entry.meta?.radarSourceLabel === 'string' ? entry.meta.radarSourceLabel : '';
      const platform = typeof entry.meta?.radarPlatform === 'string' ? entry.meta.radarPlatform : '';

      if (!sourceId || !sourceLabel) {
        return accumulator;
      }

      if (!accumulator[sourceId]) {
        accumulator[sourceId] = {
          sourceId,
          sourceLabel,
          platform,
          entryCount: 0,
          publishedCount: 0,
          views: 0,
          clicks: 0,
          quickStarts: 0,
          conversionRate: 0,
          bestTitle: '',
          bestQuickStarts: 0,
        };
      }

      const bucket = entryBuckets[buildEntryKey(entry.contentType, entry.slug)] || { views: 0, clicks: 0, quickStarts: 0 };
      accumulator[sourceId].entryCount += 1;
      accumulator[sourceId].publishedCount += entry.status === 'published' ? 1 : 0;
      accumulator[sourceId].views += bucket.views;
      accumulator[sourceId].clicks += bucket.clicks;
      accumulator[sourceId].quickStarts += bucket.quickStarts;

      if (bucket.quickStarts >= (accumulator[sourceId].bestQuickStarts || 0)) {
        accumulator[sourceId].bestTitle = entry.title;
        accumulator[sourceId].bestQuickStarts = bucket.quickStarts;
      }

      return accumulator;
    }, {})
  )
    .map((item) => ({
      ...item,
      conversionRate: item.views > 0 ? Math.round((item.quickStarts / item.views) * 100) : 0,
    }))
    .sort((left, right) => right.quickStarts - left.quickStarts || right.views - left.views || right.entryCount - left.entryCount)
    .slice(0, 8);

  const pageViews30d = params.analyticsRows.filter((row) => row.event_name.endsWith('_page_viewed')).length;
  const clicks30d = params.analyticsRows.filter((row) => row.event_name === 'content_card_clicked').length;
  const quickStarts30d = params.analyticsRows.filter((row) => row.event_name === 'content_quick_analyze_started').length;

  return {
    metrics: {
      publishedEntries: params.entries.filter((entry) => entry.status === 'published').length,
      draftEntries: params.entries.filter((entry) => entry.status === 'draft').length,
      pageViews30d,
      clicks30d,
      quickStarts30d,
      quickStartRate: pageViews30d > 0 ? Math.round((quickStarts30d / pageViews30d) * 100) : 0,
    },
    topSurfaces,
    clusterCoverage,
    generationQueue: mergedQueue,
    autoPublishCandidates,
    contentPerformance,
    radarSourcePerformance,
  };
}

export function getContentOpsSnapshot() {
  const entries = listManagedContentEntries();
  const analyticsRows = listRecentContentAnalyticsRows();

  return buildContentOpsSnapshot({
    entries,
    analyticsRows,
    radarSignals: contentSignalOperations.listRecent(20),
  });
}

export function getContentSchedulerOverview() {
  return buildContentSchedulerState({
    entries: listManagedContentEntries(),
    runs: contentSchedulerRunOperations.listRecent(20),
  });
}

export function buildAutomationRunPlan(limit = 3) {
  return getContentOpsSnapshot().generationQueue.slice(0, limit);
}

export async function runContentAutomationCycle(params: {
  userId: string;
  limit?: number;
  autoPublish?: boolean;
}) {
  const plan = buildAutomationRunPlan(params.limit || 3);
  const usedSlugs = new Set(listManagedContentEntries().map((entry) => entry.slug));
  const savedEntries: ManagedContentEntry[] = [];

  for (const item of plan) {
    const generated = await generateManagedContentDrafts({
      mode: 'single',
      contentType: item.contentType,
      subtype: item.subtype,
      topic: item.topic,
      angle: item.angle,
      platform: 'auto-ops',
      keywords: uniqueStrings(item.keywords),
      audience: item.audience,
      sourceSignals: item.reason,
      status: 'draft',
      featured: false,
    });

    for (const draft of generated.entries) {
      const finalStatus = params.autoPublish && qualifiesForAutoPublish({
        llmUsed: draft.llmUsed,
        source: draft.source,
        excerpt: draft.excerpt,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        tags: draft.tags,
        sections: draft.sections,
      }) ? 'published' : 'draft';
      const entry = saveManagedContentEntry({
        id: '',
        contentType: draft.contentType,
        subtype: draft.subtype,
        slug: ensureUniqueSlug(draft.slug, usedSlugs),
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
        status: finalStatus,
        source: `${draft.source}:automation`,
      }, params.userId);

      if (entry) {
        savedEntries.push(entry);
      }
    }
  }

  return {
    plan,
    savedEntries,
    generatedCount: savedEntries.length,
    publishedCount: savedEntries.filter((entry) => entry.status === 'published').length,
    draftCount: savedEntries.filter((entry) => entry.status === 'draft').length,
  };
}

export async function runContentSchedulerCycle(params?: {
  trigger?: 'cron' | 'manual';
}) {
  const trigger = params?.trigger || 'cron';
  const config = getContentSchedulerConfig();
  const now = new Date();
  const runs = contentSchedulerRunOperations.listRecent(20);
  let entries = listManagedContentEntries();
  const analyticsRows = listRecentContentAnalyticsRows();
  let state = buildContentSchedulerState({
    entries,
    runs,
    now,
    config,
  });

  const recentSignal = contentSignalOperations.listRecent(1)[0];
  const signalAgeMinutes = minutesBetween(now, recentSignal?.createdAt);
  let radarRefreshed = false;

  if (signalAgeMinutes === null || signalAgeMinutes >= config.radarRefreshMaxAgeHours * 60) {
    await runContentRadarCycle();
    radarRefreshed = true;
  }

  let generatedCount = 0;
  let publishedCount = 0;
  let publishedEntry: ManagedContentEntry | null = null;
  let generatedTitles: string[] = [];
  let publishRescueGenerated = false;

  if (state.needsDraftReplenishment) {
    const reserveGap = Math.max(1, state.draftReserveTarget - state.draftReserveCount);
    const generationLimit = Math.min(config.draftBatchSize, reserveGap);
    const generation = await runContentAutomationCycle({
      userId: 'system_scheduler',
      limit: generationLimit,
      autoPublish: false,
    });
    generatedCount += generation.generatedCount;
    generatedTitles = generation.savedEntries.map((entry) => entry.title).slice(0, 6);
    entries = listManagedContentEntries();
    state = buildContentSchedulerState({
      entries,
      runs,
      now,
      config,
    });
  }

  if (state.canPublishNow) {
    let candidate = selectScheduledPublishCandidate({
      entries,
      analyticsRows,
      now,
      config,
    });

    if (!candidate) {
      const rescueGeneration = await runContentAutomationCycle({
        userId: 'system_scheduler',
        limit: 1,
        autoPublish: false,
      });
      generatedCount += rescueGeneration.generatedCount;
      generatedTitles = uniqueStrings([...generatedTitles, ...rescueGeneration.savedEntries.map((entry) => entry.title)]).slice(0, 6);
      publishRescueGenerated = rescueGeneration.generatedCount > 0;
      entries = listManagedContentEntries();
      candidate = selectScheduledPublishCandidate({
        entries,
        analyticsRows,
        now,
        config,
      });
    }

    if (candidate) {
      publishedEntry = saveManagedContentEntry({
        id: candidate.entry.id,
        contentType: candidate.entry.contentType,
        subtype: candidate.entry.subtype,
        slug: candidate.entry.slug,
        title: candidate.entry.title,
        name: candidate.entry.name,
        excerpt: candidate.entry.excerpt,
        category: candidate.entry.category,
        readTime: candidate.entry.readTime,
        tags: candidate.entry.tags,
        featured: candidate.entry.featured,
        seoTitle: candidate.entry.seoTitle,
        seoDescription: candidate.entry.seoDescription,
        sections: candidate.entry.sections,
        status: 'published',
        source: candidate.entry.source,
        meta: {
          ...(candidate.entry.meta || {}),
          schedulePublishedAt: new Date().toISOString(),
          scheduleTrigger: trigger,
          scheduleScore: candidate.score,
          scheduleReasons: candidate.reasons,
        },
      }, 'system_scheduler');
      publishedCount += publishedEntry ? 1 : 0;
    }
  }

  let finalReason = '当前不在发布窗口，维持观察';
  if (publishedCount > 0 && publishRescueGenerated) {
    finalReason = '发布窗口内主动补稿并完成自动发布';
  } else if (publishedCount > 0) {
    finalReason = '按发布节奏完成本轮自动发布';
  } else if (publishRescueGenerated) {
    finalReason = '发布窗口内已尝试补稿，但仍未达到自动发布阈值';
  } else if (generatedCount > 0) {
    finalReason = '稿池低于阈值，已自动补充草稿';
  } else if (state.publishWindowOpen && !state.canPublishNow) {
    finalReason = '当前处于发布窗口，但已达到日上限或未满足最小发布时间间隔';
  } else if (state.canPublishNow) {
    finalReason = '当前允许发布，但没有达到阈值的优质草稿';
  }

  const run: ContentSchedulerRunRecord = {
    id: `scheduler_${generateId()}`,
    trigger,
    status: generatedCount > 0 || publishedCount > 0 ? 'success' : 'skipped',
    reason: finalReason,
    generatedCount,
    publishedCount,
    meta: {
      localNow: state.localNow,
      radarRefreshed,
      publishWindowOpen: state.publishWindowOpen,
      canPublishNow: state.canPublishNow,
      publishedToday: state.publishedToday,
      draftReserveCount: state.draftReserveCount,
      draftReserveTarget: state.draftReserveTarget,
      nextPublishSlotLabel: state.nextPublishSlotLabel,
      generatedTitles,
      publishedTitle: publishedEntry?.title || null,
      publishedScore: publishedEntry?.meta?.scheduleScore || null,
      publishedReasons: publishedEntry?.meta?.scheduleReasons || [],
      publishRescueGenerated,
    },
  };
  contentSchedulerRunOperations.create(run);

  return {
    success: true,
    generatedCount,
    publishedCount,
    publishedEntry,
    generatedTitles,
    reason: finalReason,
    radarRefreshed,
    scheduler: getContentSchedulerOverview(),
  };
}
