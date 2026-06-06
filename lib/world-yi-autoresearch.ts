import { listManagedContentEntries, type ManagedContentEntry } from '@/lib/content-store';
import { buildPublicGrowthAudit } from '@/lib/public-growth-plan';
import { getWorldYiPublicStats, type WorldYiPublicStats } from '@/lib/world-yi-public-stats';

export interface WorldYiAutoresearchMetric {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  ratio: number;
  detail: string;
}

export interface WorldYiAutoresearchSnapshot {
  checkedAt: string;
  score: number;
  maxScore: number;
  headline: string;
  metrics: WorldYiAutoresearchMetric[];
  recommendations: string[];
}

export interface BuildWorldYiAutoresearchSnapshotOptions {
  entries?: ManagedContentEntry[];
  stats?: WorldYiPublicStats;
  /** Report feedback loop can inject ideas (from drift/correction) to seed new v2 content backlog */
  reportDerivedIdeas?: string[];
}

const FLAGSHIP_DOCTRINE_SLUGS = [
  'world-yi-v1-manifesto',
  'world-yi-multidimensional-framework',
  'world-yi-humanities-synthesis',
  'world-yi-era-cognition',
  'world-yi-version-faq',
];

function readString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isPublishedEntry(entry: ManagedContentEntry) {
  return entry.status === 'published';
}

function isGrowthDistributionEntry(entry: ManagedContentEntry) {
  const sourceType = readString(entry.meta, 'sourceType');
  return sourceType === 'public-growth'
    || sourceType === 'public-growth-wave2'
    || sourceType === 'public-growth-global';
}

function resolvePublicationMode(
  stats: WorldYiPublicStats,
  recentPublishedGrowthEntries: ManagedContentEntry[],
  publishedGrowthEntries: ManagedContentEntry[]
) {
  if (stats.publicationMode !== 'seeded_publication') {
    return stats.publicationMode;
  }

  if ((stats.includesGrowthDistribution === true && stats.nonSeedContentCount > 0) || recentPublishedGrowthEntries.length > 0) {
    return 'ongoing_publication' as const;
  }

  if ((stats.includesGrowthDistribution === true && publishedGrowthEntries.length > 0) || publishedGrowthEntries.length > 0) {
    return 'mixed_publication' as const;
  }

  return stats.publicationMode;
}

function getEntryPublishedAt(entry: ManagedContentEntry) {
  const scheduledPublishedAt = readString(entry.meta, 'schedulePublishedAt');
  if (scheduledPublishedAt) {
    return scheduledPublishedAt;
  }

  return entry.updatedAt || entry.createdAt || '';
}

function isWithinDays(value: string, days = 7) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function createMetric(
  key: string,
  label: string,
  ratio: number,
  maxPoints: number,
  detail: string
): WorldYiAutoresearchMetric {
  const safeRatio = clamp01(ratio);
  return {
    key,
    label,
    ratio: round2(safeRatio),
    maxPoints,
    points: round1(safeRatio * maxPoints),
    detail,
  };
}

function getPublicationModeRatio(mode: WorldYiPublicStats['publicationMode']) {
  if (mode === 'ongoing_publication') {
    return 1;
  }

  if (mode === 'mixed_publication') {
    return 0.55;
  }

  return 0.15;
}

function getHeadline(score: number) {
  if (score >= 85) {
    return 'World Yi growth engine is compounding with strong doctrine and distribution coverage.';
  }

  if (score >= 70) {
    return 'World Yi growth engine is healthy, but one or two weak lanes should be tightened next.';
  }

  if (score >= 50) {
    return 'World Yi growth engine is usable, but momentum is uneven and the next round should stay narrow.';
  }

  return 'World Yi growth engine is still fragile; focus on one weak lane and rebuild compounding momentum.';
}

function buildRecommendations(metrics: WorldYiAutoresearchMetric[]) {
  const lowestMetrics = [...metrics]
    .sort((left, right) => left.ratio - right.ratio || left.points - right.points)
    .slice(0, 3);

  return lowestMetrics.map((metric) => {
    switch (metric.key) {
      case 'content-scale':
        return 'Expand public World Yi inventory with new publishable knowledge, case, or insight items tied to real user decisions.';
      case 'non-seed-momentum':
        return 'Raise the share of non-seed publication so World Yi feels alive, current, and continuously interpreted.';
      case 'publication-cadence':
        return 'Increase recent publish cadence and keep the scheduler producing visible fresh World Yi output every week.';
      case 'public-growth-coverage':
        return 'Fill uncovered public-growth targets or add better drafts where published coverage has gone thin.';
      case 'flagship-doctrine':
        return 'Reinforce flagship doctrine pieces so new users can quickly understand what World Yi is and how to use it.';
      case 'footprint-balance':
        return 'Strengthen the weakest layer across main, global Chinese, English, cases, and insights so the public footprint stays balanced.';
      case 'scheduler-readiness':
        return 'Rebuild scheduler reserve and operational readiness so publication can continue without manual scrambling.';
      default:
        return 'Tighten the weakest measured lane before broadening scope.';
    }
  });
}

export function buildWorldYiAutoresearchSnapshot(
  options: BuildWorldYiAutoresearchSnapshotOptions = {}
): WorldYiAutoresearchSnapshot {
  const entries = options.entries || listManagedContentEntries();
  const stats = options.stats || getWorldYiPublicStats();
  const reportIdeas = options.reportDerivedIdeas || [];
  const publicGrowthAudit = buildPublicGrowthAudit(entries);
  const publishedGrowthEntries = entries.filter((entry) => isPublishedEntry(entry) && isGrowthDistributionEntry(entry));
  const recentPublishedGrowthEntries = publishedGrowthEntries.filter((entry) => isWithinDays(getEntryPublishedAt(entry), 7));
  const statsIncludeGrowth = stats.includesGrowthDistribution === true;
  const publishedGrowthUnits = publicGrowthAudit.coverage.reduce((sum, item) => (
    sum + (item.publishedCount > 0 ? 1 : item.draftCount > 0 ? 0.45 : 0)
  ), 0);
  const publicGrowthRatio = publicGrowthAudit.coverage.length > 0
    ? publishedGrowthUnits / publicGrowthAudit.coverage.length
    : 0;
  const effectivePublicationMode = resolvePublicationMode(stats, recentPublishedGrowthEntries, publishedGrowthEntries);
  const growthContentIncrement = statsIncludeGrowth ? 0 : publishedGrowthEntries.length;
  const publicContentCount = Math.max(0, stats.publicContentCount + growthContentIncrement);
  const effectiveNonSeedCount = Math.max(0, stats.nonSeedContentCount + growthContentIncrement);
  const nonSeedShareRatio = publicContentCount > 0
    ? effectiveNonSeedCount / publicContentCount
    : 0;
  const recentGrowthIncrement = statsIncludeGrowth ? 0 : recentPublishedGrowthEntries.length;
  const cadenceRatio = (
    clamp01((stats.recentWorldYiPublishedCount7d + recentGrowthIncrement) / 4) * 0.6
    + clamp01(stats.recentSchedulerPublishedCount7d / 3) * 0.4
  );
  const footprintSignals = [
    stats.mainKnowledgeCount + stats.mainCaseCount > 0 ? 1 : 0,
    stats.globalKnowledgeCount + stats.globalCaseCount > 0 ? 1 : 0,
    stats.englishKnowledgeCount + stats.englishCaseCount > 0 ? 1 : 0,
    stats.publicCaseCount > 0 ? 1 : 0,
    stats.publicInsightCount > 0 ? 1 : 0,
  ];
  const footprintRatio = footprintSignals.reduce((sum, item) => sum + item, 0) / footprintSignals.length;
  const flagshipPublishedCount = FLAGSHIP_DOCTRINE_SLUGS.filter((slug) => (
    entries.some((entry) => entry.slug === slug && entry.status === 'published')
  )).length;
  const flagshipRatio = FLAGSHIP_DOCTRINE_SLUGS.length > 0
    ? flagshipPublishedCount / FLAGSHIP_DOCTRINE_SLUGS.length
    : 0;
  const schedulerReserveTarget = Math.max(1, stats.schedulerDraftReserveTarget);
  const schedulerReadinessRatio = (
    (stats.schedulerActive ? 1 : 0) * 0.5
    + clamp01(stats.schedulerDraftReserveCount / schedulerReserveTarget) * 0.5
  );

  const metrics = [
    createMetric(
      'content-scale',
      'Content Scale',
      clamp01(publicContentCount / Math.max(1, stats.targetArticleCount)),
      20,
      `${publicContentCount}/${stats.targetArticleCount} public World Yi and growth-distribution items are live.`
    ),
    createMetric(
      'non-seed-momentum',
      'Non-Seed Momentum',
      nonSeedShareRatio * 0.7 + getPublicationModeRatio(effectivePublicationMode) * 0.3,
      15,
      `${effectiveNonSeedCount}/${publicContentCount || 1} public items are non-seed or growth-published; mode is ${effectivePublicationMode}.`
    ),
    createMetric(
      'publication-cadence',
      'Publication Cadence',
      cadenceRatio,
      15,
      `${stats.recentWorldYiPublishedCount7d + recentGrowthIncrement} recent public items and ${stats.recentSchedulerPublishedCount7d} scheduler runs published in the last 7 days.`
    ),
    createMetric(
      'public-growth-coverage',
      'Public Growth Coverage',
      publicGrowthRatio,
      20,
      `${publishedGrowthUnits.toFixed(2)}/${publicGrowthAudit.coverage.length} public-growth target units are covered by published or draft inventory.`
    ),
    createMetric(
      'flagship-doctrine',
      'Flagship Doctrine',
      flagshipRatio,
      10,
      `${flagshipPublishedCount}/${FLAGSHIP_DOCTRINE_SLUGS.length} flagship doctrine slugs are publicly available.`
    ),
    createMetric(
      'footprint-balance',
      'Footprint Balance',
      footprintRatio,
      10,
      `Main, global Chinese, English, case, and insight layers each contribute to the public footprint.`
    ),
    createMetric(
      'scheduler-readiness',
      'Scheduler Readiness',
      schedulerReadinessRatio,
      10,
      `Scheduler active=${stats.schedulerActive}; draft reserve ${stats.schedulerDraftReserveCount}/${schedulerReserveTarget}.`
    ),
  ];

  const score = round1(metrics.reduce((sum, item) => sum + item.points, 0));

  const baseRecs = buildRecommendations(metrics);
  const ideaRecs = reportIdeas.length > 0
    ? reportIdeas.slice(0, 2).map((idea) => `Report feedback → 新 v2 内容选题：${idea}（经由 feedbackLoop.worldYiContentIdeas 注入 autoresearch）`)
    : [];

  return {
    checkedAt: new Date().toISOString(),
    score,
    maxScore: 100,
    headline: getHeadline(score),
    metrics,
    recommendations: [...baseRecs, ...ideaRecs],
  };
}
