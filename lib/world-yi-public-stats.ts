import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType, type ManagedContentEntry } from '@/lib/content-store';
import { contentSchedulerRunOperations } from '@/lib/database';
import { worldYiEnglishTrackSurfaces, worldYiGlobalTopicSurfaces } from '@/lib/world-yi-global-surfaces';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { worldYiApplicationSurface, worldYiDomainSurfaces } from '@/lib/world-yi-surfaces';

const worldYiDomainRoutes = Object.keys(worldYiDomainSurfaces).map((key) => `/world-yi/domains/${key}`);
const worldYiGlobalTopicRoutes = Object.keys(worldYiGlobalTopicSurfaces).map((key) => `/world-yi/global/topics/${key}`);
const worldYiEnglishTrackRoutes = Object.keys(worldYiEnglishTrackSurfaces).map((key) => `/world-yi/en/tracks/${key}`);

export const worldYiPublicRoutes = Array.from(new Set([
  '/world-yi',
  '/world-yi/book',
  '/world-yi/network',
  '/world-yi/matrix',
  '/world-yi/domains',
  ...worldYiDomainRoutes,
  '/world-yi/applications',
  '/world-yi/insights',
  '/world-yi/publish',
  '/world-yi/global',
  '/world-yi/global/cases',
  '/world-yi/global/topics',
  ...worldYiGlobalTopicRoutes,
  '/world-yi/en',
  '/world-yi/en/cases',
  '/world-yi/en/tracks',
  ...worldYiEnglishTrackRoutes,
]));

export interface WorldYiPublicStats {
  includesGrowthDistribution?: boolean;
  publicKnowledgeCount: number;
  publicCaseCount: number;
  publicInsightCount: number;
  publicContentCount: number;
  seedContentCount: number;
  nonSeedContentCount: number;
  mainKnowledgeCount: number;
  globalKnowledgeCount: number;
  englishKnowledgeCount: number;
  mainCaseCount: number;
  globalCaseCount: number;
  englishCaseCount: number;
  cityInsightCount: number;
  industryInsightCount: number;
  organizationInsightCount: number;
  domainCount: number;
  applicationGroupCount: number;
  globalTopicCount: number;
  englishTrackCount: number;
  publicRouteCount: number;
  targetArticleCount: number;
  publicationMode: 'seeded_publication' | 'mixed_publication' | 'ongoing_publication';
  lastContentUpdatedAt: string | null;
  lastNonSeedContentUpdatedAt: string | null;
  recentWorldYiPublishedAt: string | null;
  recentWorldYiPublishedTitle: string | null;
  recentWorldYiPublishedCount7d: number;
  schedulerActive: boolean;
  lastSchedulerRunAt: string | null;
  schedulerPublishedToday: number;
  schedulerDraftReserveCount: number;
  schedulerDraftReserveTarget: number;
  schedulerNextPublishSlotLabel: string | null;
  recentSchedulerPublishedAt: string | null;
  recentSchedulerPublishedTitle: string | null;
  recentSchedulerPublishedCount7d: number;
}

function isGrowthDistributionEntry(entry: ManagedContentEntry) {
  const sourceType = typeof entry.meta?.sourceType === 'string' ? entry.meta.sourceType.trim() : '';
  return sourceType === 'public-growth'
    || sourceType === 'public-growth-wave2'
    || sourceType === 'public-growth-global';
}

function isWorldYiCoreEntry(entry: ManagedContentEntry) {
  return entry.slug.startsWith('world-yi-');
}

function dedupeEntries(entries: ManagedContentEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

function readString(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getMostRecentUpdatedAt(entries: Array<Pick<ManagedContentEntry, 'updatedAt'>>) {
  if (entries.length === 0) {
    return null;
  }

  return entries
    .map((entry) => entry.updatedAt)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .sort((left, right) => right.localeCompare(left))[0] || null;
}

function getEntryPublishedAt(entry: ManagedContentEntry) {
  const scheduledPublishedAt = typeof entry.meta?.schedulePublishedAt === 'string'
    ? entry.meta.schedulePublishedAt.trim()
    : '';

  if (scheduledPublishedAt) {
    return scheduledPublishedAt;
  }

  return entry.updatedAt || entry.createdAt || null;
}

function hasRecentActivity(value?: string | null, windowMinutes = 90) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= windowMinutes * 60 * 1000;
}

function isWithinDays(value?: string | null, days = 7) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

// v5-D34 60s TTL memoize：getWorldYiPublicStats 在 /analyze /dashboard /knowledge /world-yi/* 5+ SSR 页面被调用，
// 每次跑 3 个全表 content_entries SELECT + 大量 JSON 反序列化。bot/RSC prefetch 风暴下会让主进程 SQLite
// 同步查询打满 CPU（10k+ pread64/s）。底层数据由 scheduler 周期 ≥20min 才更新，60s 缓存足够新鲜。
let cachedStats: { value: WorldYiPublicStats; expiresAt: number } | null = null;
const STATS_TTL_MS = 60_000;

export function getWorldYiPublicStats(): WorldYiPublicStats {
  const now = Date.now();
  if (cachedStats && cachedStats.expiresAt > now) {
    return cachedStats.value;
  }
  const value = computeWorldYiPublicStats();
  cachedStats = { value, expiresAt: now + STATS_TTL_MS };
  return value;
}

export function invalidateWorldYiPublicStats() {
  cachedStats = null;
}

function computeWorldYiPublicStats(): WorldYiPublicStats {
  const publishedKnowledgeEntries = listPublishedManagedContentEntriesByType('knowledge');
  const publishedCaseEntries = listPublishedManagedContentEntriesByType('case');
  const publishedInsightEntries = listPublishedManagedContentEntriesByType('insight');
  const worldYiKnowledgeEntries = dedupeEntries(publishedKnowledgeEntries
    .filter((entry) => isPublicKnowledgeEntry(entry) || isGrowthDistributionEntry(entry))
    .filter((entry) => isWorldYiCoreEntry(entry) || isGrowthDistributionEntry(entry)));
  const worldYiCaseEntries = dedupeEntries(publishedCaseEntries
    .filter((entry) => isWorldYiCoreEntry(entry) || isGrowthDistributionEntry(entry)));
  const worldYiInsightEntries = dedupeEntries(publishedInsightEntries
    .filter((entry) => isWorldYiCoreEntry(entry) || isGrowthDistributionEntry(entry)));
  const allEntries = [...worldYiKnowledgeEntries, ...worldYiCaseEntries, ...worldYiInsightEntries];
  const seedEntries = allEntries.filter((entry) => entry.source === 'seed');
  const nonSeedEntries = allEntries.filter((entry) => entry.source !== 'seed');
  const lastContentUpdatedAt = getMostRecentUpdatedAt(allEntries);
  const lastNonSeedContentUpdatedAt = getMostRecentUpdatedAt(nonSeedEntries);
  const recentWorldYiPublishedEntries = nonSeedEntries
    .map((entry) => ({
      entry,
      publishedAt: getEntryPublishedAt(entry),
    }))
    .filter((item) => isWithinDays(item.publishedAt, 7))
    .sort((left, right) => (right.publishedAt || '').localeCompare(left.publishedAt || ''));
  const recentWorldYiPublishedEntry = recentWorldYiPublishedEntries[0] || null;
  const recentRuns = contentSchedulerRunOperations.listRecent(50);
  const latestRun = recentRuns[0] || null;
  const latestRunMeta = latestRun?.meta || {};
  const recentPublishedRun = recentRuns.find((run) => (run.publishedCount || 0) > 0) || null;
  const recentSchedulerPublishedCount7d = recentRuns.filter((run) => {
    return (run.publishedCount || 0) > 0 && isWithinDays(run.createdAt, 7);
  }).length;
  const publicationMode = nonSeedEntries.length === 0
    ? 'seeded_publication'
    : isWithinDays(lastNonSeedContentUpdatedAt, 30)
      ? 'ongoing_publication'
      : 'mixed_publication';

  return {
    includesGrowthDistribution: true,
    publicKnowledgeCount: worldYiKnowledgeEntries.length,
    publicCaseCount: worldYiCaseEntries.length,
    publicInsightCount: worldYiInsightEntries.length,
    publicContentCount: worldYiKnowledgeEntries.length + worldYiCaseEntries.length + worldYiInsightEntries.length,
    seedContentCount: seedEntries.length,
    nonSeedContentCount: nonSeedEntries.length,
    mainKnowledgeCount: worldYiKnowledgeEntries.filter((entry) => entry.meta?.series === 'world-yi').length,
    globalKnowledgeCount: worldYiKnowledgeEntries.filter((entry) => entry.meta?.series === 'world-yi-global').length,
    englishKnowledgeCount: worldYiKnowledgeEntries.filter((entry) => entry.meta?.series === 'world-yi-en').length,
    mainCaseCount: worldYiCaseEntries.filter((entry) => entry.meta?.series === 'world-yi').length,
    globalCaseCount: worldYiCaseEntries.filter((entry) => entry.meta?.series === 'world-yi-global').length,
    englishCaseCount: worldYiCaseEntries.filter((entry) => entry.meta?.series === 'world-yi-en').length,
    cityInsightCount: worldYiInsightEntries.filter((entry) => entry.subtype === 'city').length,
    industryInsightCount: worldYiInsightEntries.filter((entry) => entry.subtype === 'industry').length,
    organizationInsightCount: worldYiInsightEntries.filter((entry) => entry.subtype === 'organization').length,
    domainCount: Object.keys(worldYiDomainSurfaces).length,
    applicationGroupCount: worldYiApplicationSurface.groups.length,
    globalTopicCount: Object.keys(worldYiGlobalTopicSurfaces).length,
    englishTrackCount: Object.keys(worldYiEnglishTrackSurfaces).length,
    publicRouteCount: worldYiPublicRoutes.length,
    targetArticleCount: worldYiRoadmapSummary.targetArticleCount,
    publicationMode,
    lastContentUpdatedAt,
    lastNonSeedContentUpdatedAt,
    recentWorldYiPublishedAt: recentWorldYiPublishedEntry?.publishedAt || null,
    recentWorldYiPublishedTitle: recentWorldYiPublishedEntry?.entry.title || null,
    recentWorldYiPublishedCount7d: recentWorldYiPublishedEntries.length,
    schedulerActive: hasRecentActivity(latestRun?.createdAt),
    lastSchedulerRunAt: latestRun?.createdAt || null,
    schedulerPublishedToday: readNumber(latestRunMeta, 'publishedToday'),
    schedulerDraftReserveCount: readNumber(latestRunMeta, 'draftReserveCount'),
    schedulerDraftReserveTarget: readNumber(latestRunMeta, 'draftReserveTarget'),
    schedulerNextPublishSlotLabel: readString(latestRunMeta, 'nextPublishSlotLabel'),
    recentSchedulerPublishedAt: recentPublishedRun?.createdAt || null,
    recentSchedulerPublishedTitle: readString(recentPublishedRun?.meta, 'publishedTitle'),
    recentSchedulerPublishedCount7d,
  };
}
