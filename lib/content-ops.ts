// @ts-nocheck
import {
  assessGeneratedManagedContentDraftQuality,
  generateManagedContentDrafts,
  type ContentGenerationLocale,
} from '@/lib/content-generation';
import { buildIllustrationMetaForEntry } from '@/lib/content-illustrations';
import { analyticsOperations, contentGenerationJobOperations, contentSchedulerRunOperations, contentSignalOperations, forumAnswerOperations, forumQuestionOperations, systemLockOperations } from '@/lib/database';
import {
  listManagedContentEntries,
  listManagedContentEntriesLight,
  countManagedContentEntries,
  refreshManagedContentJourneyMetadata,
  saveManagedContentEntry,
  type ManagedContentEntry,
  type ManagedContentEntryLight,
  type ManagedContentType,
} from '@/lib/content-store';
import type { EntityInsightType } from '@/lib/content';
import { runContentRadarCycle } from '@/lib/content-radar';
import { generateFromTrendJob } from '@/lib/forum-trend-generator';
import { assessGrowthPublication } from '@/lib/public-growth-plan';
import type { ContentSchedulerRunRecord } from '@/lib/user-types';
import { generateId, contentSnapshotCache, worldYiPublicationCache } from '@/lib/utils';
import {
  readOpenAgentContentAnalysisSnapshot,
  readWorldYiContentDecisionLedger,
  resolveWorldYiAutonomyRuntimePolicy,
  summarizeWorldYiContentDecisionLedger,
  summarizeOpenAgentAutonomyBacklogFocus,
  writeWorldYiContentDecisionLedgerEntry,
  type OpenAgentContentAnalysisPlan,
  type WorldYiContentDecision,
  type WorldYiAutonomyPolicy,
  type WorldYiContentDecisionSample,
} from '@/lib/world-yi-autonomous-state';
import {
  buildWorldYiPublicationLaneSummaries,
  buildWorldYiPublicationReserveSignal,
  findWorldYiLaneCoverageRow,
  getWorldYiPublicationLaneConfigByKey,
  type LaneKey,
  type PublicationLaneSummary,
  type SourceType,
} from '@/lib/world-yi-publication-lanes';
import {
  getContentSchedulerAdaptiveFreshnessWeight,
  getContentSchedulerAdaptiveRadarSourceWeight,
  getContentSchedulerAdaptiveTypeWeight,
  getContentSchedulerBacklogPressureRatio,
  getContentSchedulerDailyPublishLimit,
  getContentSchedulerDraftBatchSize,
  getContentSchedulerDraftReserveTarget,
  getContentSchedulerGenerateCooldownMinutes,
  getContentSchedulerMinPublishGapMinutes,
  getContentSchedulerPublishHoursRaw,
  getContentSchedulerPublishStaleRelaxMinutes,
  getContentSchedulerRadarRefreshMaxAgeHours,
  getContentSchedulerTimezoneOffsetMinutes,
  isContentSchedulerInterestPublishEnabled,
} from '@/lib/env';
import {
  STRATEGIC_CLUSTERS,
  getPublishedTypesForCluster,
  hasSchedulerPublishBacklogPressure,
  matchesKeywords,
  rowText,
} from '@/lib/content-interest-signals';
import { buildInterestPublishMeta } from '@/lib/content-editorial-mission';
import { selectInterestDrivenCandidates } from '@/lib/interest-driven-publish';

type AnalyticsRow = {
  event_name: string;
  page?: string | null;
  meta?: string | null;
  created_at: string;
};

export { STRATEGIC_CLUSTERS };

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
  market?: string;
  locale?: string;
  sourceType?: 'cluster' | 'radar' | SourceType;
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
  backlogPublishPressure: boolean;
  publishWindowOpen: boolean;
  canPublishNow: boolean;
  nextPublishSlotLabel: string;
  lastPublishedAt?: string;
  lastGeneratedAt?: string;
  minutesSinceLastPublish?: number;
  minutesSinceLastGenerate?: number;
  recentRuns: ContentSchedulerRunRecord[];
};

type ContentSchedulerExecutionMode = 'live' | 'validate';

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

type EvaluatedScheduledPublishCandidate = ScheduledPublishCandidate & {
  ready: boolean;
  hardBlockReasons: string[];
  sourceType?: string;
  growthPlanKey?: string;
  laneKey?: string;
  laneLabel?: string;
  laneTargetKey?: string;
  laneNeedsCoverage: boolean;
  weakLane: boolean;
  decision: WorldYiContentDecision;
  policySource: WorldYiAutonomyPolicy['source'];
  policyFocusKeys: string[];
  minimumScore: number;
};

type ScheduledPublishEvaluation = {
  autonomyPolicy: WorldYiAutonomyPolicy;
  candidates: EvaluatedScheduledPublishCandidate[];
};

type CandidateSuppressionSummary = {
  exactTitleBlockedCount: number;
  familyBlockedCount: number;
  topBlockedReasons: string[];
};

type CandidateSuppressionIndex = {
  exactTitleCounts: Record<string, number>;
  familyBuckets: Record<string, { count: number; reasonCounts: Record<string, number> }>;
};

type AutoPublishGateDecision = {
  ready: boolean;
  score: number;
  reasons: string[];
  hardBlockReasons: string[];
};

type OpenAgentBlockedPatternField =
  | 'key'
  | 'title'
  | 'topic'
  | 'reason'
  | 'source'
  | 'slug'
  | 'sourceType'
  | 'market'
  | 'locale'
  | 'audience'
  | 'contentType'
  | 'signature';

export type OpenAgentBlockedPatternTarget = {
  key?: string;
  title?: string;
  topic?: string;
  reason?: string;
  source?: string;
  slug?: string;
  sourceType?: string;
  market?: string;
  locale?: string;
  audience?: string;
  contentType?: string;
  signatures?: string[];
};

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeBlockedPatternText(value: string) {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function readMetaString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isPublicGrowthSourceType(sourceType?: string) {
  return sourceType === 'public-growth'
    || sourceType === 'public-growth-wave2'
    || sourceType === 'public-growth-global';
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

function isSchedulerCountedPublish(entry: ManagedContentEntry) {
  const meta = entry.meta || {};
  if (readMetaString(meta, 'batchPublishedBy')) {
    return false;
  }
  // Seeds / silent backfills must not consume daily quota or min-gap.
  if (`${entry.source || ''}`.startsWith('seed')) {
    return false;
  }

  const trigger = readMetaString(meta, 'scheduleTrigger');
  return trigger === 'cron' || trigger === 'manual' || trigger === 'interest';
}

function getSchedulerCountedPublishedDate(entry: ManagedContentEntry) {
  if (!isSchedulerCountedPublish(entry)) {
    return null;
  }

  return parseUtcDate(readMetaString(entry.meta || {}, 'schedulePublishedAt'));
}

function hasStructuredAutoPublishQuality(entry: ManagedContentEntry, relaxed = false) {
  const minSections = relaxed ? 4 : 4;
  const minParagraphLen = relaxed ? 12 : 18;
  const minExcerpt = relaxed ? 60 : 72;
  const minSeoDescription = relaxed ? 60 : 72;
  const minTags = 4;
  const paragraphs = entry.sections.flatMap((section) => section.paragraphs || []).map((paragraph) => paragraph.trim()).filter(Boolean);
  const averageParagraphLength = paragraphs.length > 0
    ? paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0) / paragraphs.length
    : 0;
  const paragraphQualityOk = entry.sections.every((section) => (
    section.title.trim().length >= 4 &&
    section.paragraphs.length >= 2 &&
    section.paragraphs.every((paragraph) => paragraph.trim().length >= minParagraphLen)
  ));
  const publicQuality = typeof entry.meta?.qualityScore === 'number'
    ? entry.meta.qualityScore >= (relaxed ? 76 : 82)
    : true;

  return (
    entry.excerpt.trim().length >= minExcerpt &&
    entry.seoTitle.trim().length >= 12 &&
    entry.seoDescription.trim().length >= minSeoDescription &&
    entry.tags.length >= minTags &&
    entry.sections.length >= minSections &&
    paragraphs.length >= 8 &&
    averageParagraphLength >= minParagraphLen &&
    paragraphQualityOk &&
    publicQuality
  );
}

function isSchedulerTrustedAutoPublishSource(entry: ManagedContentEntry, sourceType: string) {
  if (entry.source.startsWith('agent-llm:')) {
    return true;
  }
  if (/^world-yi/i.test(entry.source)) {
    return true;
  }
  return sourceType === 'public-growth'
    || sourceType === 'public-growth-wave2'
    || sourceType === 'public-growth-global';
}

function applyPublishStarvationRelaxation(
  policy: WorldYiAutonomyPolicy,
  minutesSinceLastPublish: number | null | undefined,
): { policy: WorldYiAutonomyPolicy; relaxedStructure: boolean } {
  const relaxAfter = getContentSchedulerPublishStaleRelaxMinutes();
  if (minutesSinceLastPublish === null || minutesSinceLastPublish === undefined || minutesSinceLastPublish < relaxAfter) {
    return { policy, relaxedStructure: false };
  }

  const severe = minutesSinceLastPublish >= relaxAfter * 2;
  return {
    policy: {
      ...policy,
      publishGate: {
        ...policy.publishGate,
        minScore: Math.max(severe ? 130 : 155, policy.publishGate.minScore - (severe ? 85 : 60)),
        requireLlmSource: severe ? false : policy.publishGate.requireLlmSource,
        requireGrowthPublicationReady: severe ? false : policy.publishGate.requireGrowthPublicationReady,
      },
    },
    relaxedStructure: true,
  };
}

function resolveSchedulerCanPublishNow(params: {
  publishWindowOpen: boolean;
  publishedToday: number;
  dailyPublishLimit: number;
  minutesSinceLastPublish: number | null | undefined;
  minPublishGapMinutes: number;
}) {
  const relaxAfter = getContentSchedulerPublishStaleRelaxMinutes();
  let minGap = params.minPublishGapMinutes;
  const stale = params.minutesSinceLastPublish;

  if (stale !== null && stale !== undefined && stale >= relaxAfter) {
    minGap = Math.min(minGap, 45);
  }
  if (stale !== null && stale !== undefined && stale >= relaxAfter * 2) {
    minGap = 0;
  }

  return params.publishWindowOpen &&
    params.publishedToday < params.dailyPublishLimit &&
    (stale === null || stale === undefined || stale >= minGap);
}

function normalizeTitleKey(value: string) {
  return normalizeText(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleFamilyKey(value: string) {
  return normalizeTitleKey(value)
    .replace(/的深度解读|的深度解讀|deep dive/gi, ' ')
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\b\d{1,2}\b/g, ' ')
    .replace(/[-–—:："“”'’.,()/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeContentSignature(value: string) {
  return normalizeText(value)
    .replace(/[\s\-–—:："“”'’.,()/，。！？、]/g, ' ')
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function contentSignatureSimilarity(left: string, right: string) {
  const leftTokens = new Set(tokenizeContentSignature(left));
  const rightTokens = new Set(tokenizeContentSignature(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return { overlap: 0, shared: 0 };
  }

  let shared = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      shared += 1;
    }
  });

  return {
    overlap: shared / Math.min(leftTokens.size, rightTokens.size),
    shared,
  };
}

function buildDraftContentSignature(input: Pick<ManagedContentEntry, 'title' | 'excerpt' | 'tags' | 'contentType'>) {
  return [input.contentType, input.title, input.excerpt, ...(input.tags || [])].join(' ');
}

function findSimilarExistingContent(params: {
  draft: Pick<ManagedContentEntry, 'title' | 'excerpt' | 'tags' | 'contentType'>;
  entries: ManagedContentEntry[];
}) {
  const draftSignature = buildDraftContentSignature(params.draft);

  return params.entries.find((entry) => {
    if (entry.contentType !== params.draft.contentType) {
      return false;
    }

    const draftFamily = normalizeTitleFamilyKey(params.draft.title);
    const entryFamily = normalizeTitleFamilyKey(entry.title);
    if (draftFamily && entryFamily && draftFamily === entryFamily) {
      return true;
    }

    const titleSimilarity = contentSignatureSimilarity(params.draft.title, entry.title);
    if (titleSimilarity.shared === 0) {
      return false;
    }

    const similarity = contentSignatureSimilarity(draftSignature, buildDraftContentSignature(entry));
    return similarity.shared >= 3 && similarity.overlap >= 0.72;
  }) || null;
}

function buildCandidateSuppressionIndex(): CandidateSuppressionIndex {
  return readWorldYiContentDecisionLedger(6)
    .flatMap((ledgerEntry) => ledgerEntry.decisions || [])
    .filter((sample) => sample.decision === 'blocked')
    .reduce<CandidateSuppressionIndex>((accumulator, sample) => {
      const exactTitleKey = normalizeTitleKey(sample.title);
      const familyKey = normalizeTitleFamilyKey(sample.title);

      if (exactTitleKey) {
        accumulator.exactTitleCounts[exactTitleKey] = (accumulator.exactTitleCounts[exactTitleKey] || 0) + 1;
      }

      if (familyKey.length >= 12) {
        if (!accumulator.familyBuckets[familyKey]) {
          accumulator.familyBuckets[familyKey] = {
            count: 0,
            reasonCounts: {},
          };
        }

        accumulator.familyBuckets[familyKey].count += 1;
        sample.hardBlockReasons.forEach((reason) => {
          accumulator.familyBuckets[familyKey].reasonCounts[reason] = (
            accumulator.familyBuckets[familyKey].reasonCounts[reason] || 0
          ) + 1;
        });
      }

      return accumulator;
    }, {
      exactTitleCounts: {},
      familyBuckets: {},
    });
}

function summarizeRecentCandidateSuppression(
  entry: ManagedContentEntry,
  suppressionIndex: CandidateSuppressionIndex
): CandidateSuppressionSummary {
  const exactTitleBlockedCount = suppressionIndex.exactTitleCounts[normalizeTitleKey(entry.title)] || 0;
  const familyBucket = suppressionIndex.familyBuckets[normalizeTitleFamilyKey(entry.title)];
  const topBlockedReasons = Object.entries(familyBucket?.reasonCounts || {})
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([reason]) => reason);

  return {
    exactTitleBlockedCount,
    familyBlockedCount: familyBucket?.count || 0,
    topBlockedReasons,
  };
}

function buildCandidateSuppressionReason(
  entry: ManagedContentEntry,
  suppressionIndex: CandidateSuppressionIndex
) {
  const suppression = summarizeRecentCandidateSuppression(entry, suppressionIndex);
  const dominatedBySameReasons = suppression.topBlockedReasons.some((reason) => (
    /仅允许 LLM 草稿进入自动发布候选|历史转化过弱|热点来源历史反馈过弱|结构质量未达自动发布阈值/.test(reason)
  ));

  // D31-B: LLM 草稿的精确标题历史窗口不再硬 block
  // 生成端 D31-A 已按 titleFamilyKey 限流，发布端继续依赖
  // hasStructuredAutoPublishQuality + publishGate.minScore 把关；
  // suppression 改用更宽的阈值，避免 6 期 ledger 残留把当前合格草稿误杀。
  const isLlmSource = entry.source.startsWith('agent-llm:');
  const exactBlockThreshold = isLlmSource ? 8 : 2;

  if (suppression.exactTitleBlockedCount >= exactBlockThreshold) {
    return `重复标题预过滤：最近 ${suppression.exactTitleBlockedCount} 次同标题候选均已被阻断`;
  }

  if (
    suppression.familyBlockedCount >= 3
    && dominatedBySameReasons
    && !isLlmSource
  ) {
    return `重复题材/来源疲劳预过滤：最近 ${suppression.familyBlockedCount} 次同题材候选已因相近原因被阻断`;
  }

  return '';
}

function buildAutoPublishGateDecision(params: {
  entry: ManagedContentEntry;
  performance: ContentPerformanceContext;
  lanes: PublicationLaneSummary[];
  autonomyPolicy: WorldYiAutonomyPolicy;
  relaxedStructure?: boolean;
  now?: Date;
  config?: ContentSchedulerConfig;
}): AutoPublishGateDecision {
  const now = params.now || new Date();
  const config = params.config || getContentSchedulerConfig();
  const entry = params.entry;
  const reasons: string[] = [];
  const hardBlockReasons: string[] = [];
  const sourceType = readMetaString(entry.meta, 'sourceType');
  const growthPlanKey = readMetaString(entry.meta, 'growthPlanKey');
  const laneSignal = findWorldYiLaneCoverageRow({
    lanes: params.lanes,
    sourceType,
    growthPlanKey,
  });
  const reserveSignal = buildWorldYiPublicationReserveSignal(params.lanes);

  if (
    params.autonomyPolicy.publishGate.requireLlmSource
    && !isSchedulerTrustedAutoPublishSource(entry, sourceType)
  ) {
    hardBlockReasons.push('仅允许 LLM / 世界易 / 增长计划草稿进入自动发布候选');
  }

  if (!hasStructuredAutoPublishQuality(entry, params.relaxedStructure)) {
    hardBlockReasons.push('结构质量未达自动发布阈值');
  } else {
    reasons.push('结构质量通过');
  }

  let score = computeAutoPublishScore(entry);
  reasons.push(`基础质量分 ${score}`);

  // Daily mix: prefer knowledge/insight when cases dominate historical publishes.
  const typeBench = params.performance.contentTypeBenchmarks?.[entry.contentType];
  const allTypePublished = Object.values(params.performance.contentTypeBenchmarks || {}).reduce(
    (sum, bench) => sum + (bench?.publishedCount || 0),
    0,
  );
  if (allTypePublished > 0 && typeBench) {
    const share = (typeBench.publishedCount || 0) / allTypePublished;
    if (entry.contentType === 'knowledge' && share < 0.35) {
      score += 28;
      reasons.push('知识型占比偏低，优先补齐 +28');
    } else if (entry.contentType === 'insight' && share < 0.15) {
      score += 22;
      reasons.push('洞察型占比偏低，优先补齐 +22');
    } else if (entry.contentType === 'case' && share > 0.7) {
      score -= 12;
      reasons.push('案例占比过高，轻微降权 -12');
    }
  }
  if (typeof entry.meta?.qualityScore === 'number' && entry.meta.qualityScore >= 90) {
    score += 18;
    reasons.push(`高质量分 ${entry.meta.qualityScore} +18`);
  }
  if (`${entry.source || ''}`.startsWith('agent-llm')) {
    score += 14;
    reasons.push('LLM 自动生成稿 +14');
  }

  if (laneSignal?.queueRow) {
    score += params.autonomyPolicy.publishGate.laneGapBoost;
    reasons.push(`补齐 ${laneSignal.lane.label} 缺口 +${params.autonomyPolicy.publishGate.laneGapBoost}`);
  } else if (laneSignal?.lane && reserveSignal.weakLaneKeys.includes(laneSignal.lane.key)) {
    score += params.autonomyPolicy.publishGate.weakLaneBoost;
    reasons.push(`补强 ${laneSignal.lane.label} 保底储备 +${params.autonomyPolicy.publishGate.weakLaneBoost}`);
  }

  if (params.autonomyPolicy.publishGate.backlogLaneReserveBoost > 0 && laneSignal?.lane) {
    score += params.autonomyPolicy.publishGate.backlogLaneReserveBoost;
    reasons.push(`OpenAgent backlog 强化 lane reserve +${params.autonomyPolicy.publishGate.backlogLaneReserveBoost}`);
  }

  if (
    sourceType === 'public-growth'
    || sourceType === 'public-growth-wave2'
    || sourceType === 'public-growth-global'
  ) {
    const publicationAssessment = assessGrowthPublication(entry, sourceType);
    score += Math.round(publicationAssessment.score / 2);
    reasons.push(`公开流量位质量校验 +${Math.round(publicationAssessment.score / 2)}`);

    if (params.autonomyPolicy.publishGate.requireGrowthPublicationReady && !publicationAssessment.ready) {
      hardBlockReasons.push('公开流量位质量校验未通过');
    }
  }

  const typeBenchmark = params.performance.contentTypeBenchmarks[entry.contentType];
  if (typeBenchmark) {
    const typeBoost = typeBenchmark.avgConversionRate * config.adaptiveTypeWeight / 10
      + typeBenchmark.avgQuickStarts * 4;
    score += typeBoost;
    reasons.push(`${entry.contentType} 历史转化加权 +${Math.round(typeBoost)}`);

    if (
      params.autonomyPolicy.publishGate.blockLowPerformanceTypes
      && typeBenchmark.publishedCount >= params.autonomyPolicy.publishGate.lowPerformanceTypeMinPublishedCount
      && typeBenchmark.avgConversionRate === 0
      && typeBenchmark.avgQuickStarts === 0
      && !laneSignal?.queueRow
    ) {
      hardBlockReasons.push(`${entry.contentType} 历史转化过弱，优先补缺口而不是继续发布`);
    }
  }

  const radarSourceId = readMetaString(entry.meta, 'radarSourceId');
  if (radarSourceId && params.performance.radarSourceBenchmarks[radarSourceId]) {
    const sourceBenchmark = params.performance.radarSourceBenchmarks[radarSourceId];
    const sourceBoost = sourceBenchmark.avgConversionRate * config.adaptiveRadarSourceWeight / 10
      + sourceBenchmark.avgQuickStarts * 6;
    score += sourceBoost;
    reasons.push(`热点源反馈加权 +${Math.round(sourceBoost)}`);

    if (
      params.autonomyPolicy.publishGate.blockLowPerformanceRadarSources
      && sourceBenchmark.publishedCount >= params.autonomyPolicy.publishGate.lowPerformanceRadarSourceMinPublishedCount
      && sourceBenchmark.avgConversionRate === 0
      && sourceBenchmark.avgQuickStarts === 0
      && !laneSignal?.queueRow
    ) {
      hardBlockReasons.push('热点来源历史反馈过弱，暂停自动发布');
    }
  }

  const updatedAt = parseUtcDate(entry.updatedAt);
  const ageHours = updatedAt ? Math.max(0, (now.getTime() - updatedAt.getTime()) / 3_600_000) : 48;
  const freshnessBoost = Math.max(0, 24 - ageHours) * config.adaptiveFreshnessWeight / 24;
  score += freshnessBoost;
  reasons.push(`新鲜度加权 +${Math.round(freshnessBoost)}`);

  const minimumScore = params.autonomyPolicy.publishGate.minScore;
  if (score < minimumScore) {
    hardBlockReasons.push(`综合评分不足 ${minimumScore}`);
  }

  return {
    ready: hardBlockReasons.length === 0,
    score: Math.round(score),
    reasons,
    hardBlockReasons,
  };
}

function classifyScheduledCandidateDecision(decision: AutoPublishGateDecision): WorldYiContentDecision {
  if (decision.ready) {
    return 'hold';
  }

  if (decision.hardBlockReasons.some((reason) => (
    /仅允许 LLM 草稿进入自动发布候选|历史转化过弱|热点来源历史反馈过弱/.test(reason)
  ))) {
    return 'blocked';
  }

  return 'revise';
}

function sortEvaluatedScheduledCandidates(
  left: EvaluatedScheduledPublishCandidate,
  right: EvaluatedScheduledPublishCandidate
) {
  if (left.ready !== right.ready) {
    return left.ready ? -1 : 1;
  }

  const scoreGap = right.score - left.score;
  if (scoreGap !== 0) {
    return scoreGap;
  }

  return (parseUtcDate(right.entry.updatedAt)?.getTime() || 0) - (parseUtcDate(left.entry.updatedAt)?.getTime() || 0);
}

function evaluateDraftEntries(params: {
  entries: ManagedContentEntry[];
  performance: ContentPerformanceContext;
  lanes: PublicationLaneSummary[];
  autonomyPolicy: WorldYiAutonomyPolicy;
  relaxedStructure?: boolean;
  analysisPlan?: OpenAgentContentAnalysisPlan | null;
  now?: Date;
  config?: ContentSchedulerConfig;
}) {
  const reserveSignal = buildWorldYiPublicationReserveSignal(params.lanes);
  const suppressionIndex = buildCandidateSuppressionIndex();

  return params.entries
    .filter((entry) => entry.status === 'draft')
    .map((entry) => {
      const sourceType = readMetaString(entry.meta, 'sourceType') || undefined;
      const growthPlanKey = readMetaString(entry.meta, 'growthPlanKey') || undefined;
      const laneSignal = findWorldYiLaneCoverageRow({
        lanes: params.lanes,
        sourceType,
        growthPlanKey,
      });
      const openAgentBlockedPatternReason = buildDraftEntryBlockedPatternReason({
        entry,
        sourceType,
        growthPlanKey,
        analysisPlan: params.analysisPlan || null,
      });
      const suppressionReason = buildCandidateSuppressionReason(entry, suppressionIndex);
      const prefilterReasons = [
        openAgentBlockedPatternReason,
        suppressionReason,
      ].filter(Boolean);

      if (prefilterReasons.length > 0) {
        return {
          entry,
          score: 0,
          reasons: prefilterReasons,
          ready: false,
          hardBlockReasons: prefilterReasons,
          sourceType,
          growthPlanKey,
          laneKey: laneSignal?.lane.key,
          laneLabel: laneSignal?.lane.label,
          laneTargetKey: laneSignal?.queueRow?.key,
          laneNeedsCoverage: !!laneSignal?.queueRow,
          weakLane: laneSignal?.lane ? reserveSignal.weakLaneKeys.includes(laneSignal.lane.key) : false,
          decision: 'blocked' as const,
          policySource: params.autonomyPolicy.source,
          policyFocusKeys: params.autonomyPolicy.focusKeys,
          minimumScore: params.autonomyPolicy.publishGate.minScore,
        } satisfies EvaluatedScheduledPublishCandidate;
      }

      const decision = buildAutoPublishGateDecision({
        entry,
        performance: params.performance,
        lanes: params.lanes,
        autonomyPolicy: params.autonomyPolicy,
        relaxedStructure: params.relaxedStructure,
        now: params.now,
        config: params.config,
      });

      return {
        entry,
        score: decision.score,
        reasons: decision.reasons,
        ready: decision.ready,
        hardBlockReasons: decision.hardBlockReasons,
        sourceType,
        growthPlanKey,
        laneKey: laneSignal?.lane.key,
        laneLabel: laneSignal?.lane.label,
        laneTargetKey: laneSignal?.queueRow?.key,
        laneNeedsCoverage: !!laneSignal?.queueRow,
        weakLane: laneSignal?.lane ? reserveSignal.weakLaneKeys.includes(laneSignal.lane.key) : false,
        decision: classifyScheduledCandidateDecision(decision),
        policySource: params.autonomyPolicy.source,
        policyFocusKeys: params.autonomyPolicy.focusKeys,
        minimumScore: params.autonomyPolicy.publishGate.minScore,
      } satisfies EvaluatedScheduledPublishCandidate;
    })
    .sort(sortEvaluatedScheduledCandidates);
}

function evaluateScheduledPublishCandidates(params: {
  entries: ManagedContentEntry[];
  analyticsRows: AnalyticsRow[];
  now?: Date;
  config?: ContentSchedulerConfig;
}): ScheduledPublishEvaluation {
  const now = params.now || new Date();
  const config = params.config || getContentSchedulerConfig();
  const performance = buildContentPerformanceContext({
    entries: params.entries,
    analyticsRows: params.analyticsRows,
  });
  const lanes = buildWorldYiPublicationLaneSummaries(params.entries);
  const backlogFocus = summarizeOpenAgentAutonomyBacklogFocus();
  const openAgentContentAnalysis = readActiveOpenAgentContentAnalysisPlan();
  const policyResolution = resolveWorldYiAutonomyRuntimePolicy({
    fallbackFocus: backlogFocus,
    analysisPlan: openAgentContentAnalysis,
  });
  const lastPublishedDate = params.entries
    .filter((entry) => entry.status === 'published' && isSchedulerCountedPublish(entry))
    .map((entry) => getSchedulerCountedPublishedDate(entry))
    .filter((date): date is Date => !!date)
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
  const minutesSinceLastPublish = minutesBetweenDates(now, lastPublishedDate);
  const starvation = applyPublishStarvationRelaxation(
    policyResolution.effectivePolicy,
    minutesSinceLastPublish ?? undefined,
  );

  return {
    autonomyPolicy: starvation.policy,
    candidates: evaluateDraftEntries({
      entries: params.entries,
      performance,
      lanes,
      autonomyPolicy: starvation.policy,
      relaxedStructure: starvation.relaxedStructure,
      analysisPlan: openAgentContentAnalysis,
      now,
      config,
    }),
  };
}

function readActiveOpenAgentContentAnalysisPlan(maxAgeHours = 12) {
  const snapshot = readOpenAgentContentAnalysisSnapshot();
  if (!snapshot || snapshot.status !== 'success') {
    return null;
  }

  const updatedAt = parseUtcDate(snapshot.updatedAt);
  if (!updatedAt) {
    return null;
  }

  const ageHours = (Date.now() - updatedAt.getTime()) / 3_600_000;
  if (ageHours > maxAgeHours) {
    return null;
  }

  return snapshot.plan;
}

function rankOpenAgentQueueOverridePriority(priority?: OpenAgentContentAnalysisPlan['queueOverrides'][number]['priority']) {
  switch (priority) {
    case 'critical':
      return 1200;
    case 'high':
      return 800;
    case 'medium':
      return 500;
    default:
      return 0;
  }
}

function splitOpenAgentBlockedPattern(pattern: string) {
  const raw = `${pattern || ''}`.trim();
  const matched = raw.match(/^(key|title|topic|reason|source|slug|sourceType|market|locale|audience|contentType|signature)\s*:\s*(.+)$/i);
  if (!matched) {
    return {
      field: null,
      needle: normalizeBlockedPatternText(raw),
    };
  }

  const fieldMap: Record<string, OpenAgentBlockedPatternField> = {
    key: 'key',
    title: 'title',
    topic: 'topic',
    reason: 'reason',
    source: 'source',
    slug: 'slug',
    sourcetype: 'sourceType',
    market: 'market',
    locale: 'locale',
    audience: 'audience',
    contenttype: 'contentType',
    signature: 'signature',
  };

  return {
    field: fieldMap[matched[1].toLowerCase()] || null,
    needle: normalizeBlockedPatternText(matched[2]),
  };
}

function buildOpenAgentBlockedPatternFields(target: OpenAgentBlockedPatternTarget) {
  const signatures = uniqueStrings(target.signatures || []);

  return {
    key: [target.key || ''],
    title: [target.title || ''],
    topic: [target.topic || ''],
    reason: [target.reason || ''],
    source: uniqueStrings([target.source || '', ...signatures]),
    slug: [target.slug || ''],
    sourceType: [target.sourceType || ''],
    market: [target.market || ''],
    locale: [target.locale || ''],
    audience: [target.audience || ''],
    contentType: [target.contentType || ''],
    signature: signatures,
  } satisfies Record<OpenAgentBlockedPatternField, string[]>;
}

function matchOpenAgentBlockedNeedle(candidate: string, needle: string) {
  const normalizedCandidate = normalizeBlockedPatternText(candidate);
  if (!normalizedCandidate || !needle) {
    return false;
  }

  if (needle.includes('*')) {
    const regex = new RegExp(needle.split('*').map(escapeRegex).join('.*'), 'i');
    return regex.test(normalizedCandidate);
  }

  return normalizedCandidate.includes(needle);
}

export function matchesOpenAgentBlockedPattern(pattern: string, target: OpenAgentBlockedPatternTarget) {
  const { field, needle } = splitOpenAgentBlockedPattern(pattern);
  if (!needle) {
    return false;
  }

  const fields = buildOpenAgentBlockedPatternFields(target);
  const candidates = field
    ? fields[field]
    : Object.values(fields).flat();

  return candidates.some((candidate) => matchOpenAgentBlockedNeedle(candidate, needle));
}

function buildDraftEntryBlockedPatternReason(params: {
  entry: ManagedContentEntry;
  sourceType?: string;
  growthPlanKey?: string;
  analysisPlan: OpenAgentContentAnalysisPlan | null;
}) {
  const blockedPatterns = params.analysisPlan?.blockedPatterns || [];
  if (blockedPatterns.length === 0) {
    return '';
  }

  const protectedKeys = buildOpenAgentProtectedGenerationKeySet(params.analysisPlan);
  if (
    (params.growthPlanKey && protectedKeys.has(params.growthPlanKey))
    || (params.entry.slug && protectedKeys.has(params.entry.slug))
  ) {
    return '';
  }

  const sourceSegments = `${params.entry.source || ''}`.split(':').filter(Boolean);
  const sourceFamily = sourceSegments[0] || '';
  const sourceLeaf = sourceSegments[sourceSegments.length - 1] || '';
  const synthesisType = readMetaString(params.entry.meta, 'synthesisType');

  const matchedPattern = blockedPatterns.find((pattern) => matchesOpenAgentBlockedPattern(pattern, {
    title: params.entry.title,
    source: params.entry.source,
    slug: params.entry.slug,
    sourceType: params.sourceType,
    contentType: params.entry.contentType,
    signatures: uniqueStrings([
      params.entry.source && params.entry.slug ? `${params.entry.source}:${params.entry.slug}` : '',
      sourceFamily && params.entry.slug ? `${sourceFamily}:${params.entry.slug}` : '',
      sourceFamily && params.entry.slug && sourceLeaf ? `${sourceFamily}:${params.entry.slug}:${sourceLeaf}` : '',
      params.sourceType && params.growthPlanKey ? `${params.sourceType}:${params.growthPlanKey}` : '',
      params.sourceType && params.entry.slug ? `${params.sourceType}:${params.entry.slug}` : '',
      synthesisType && params.entry.slug ? `knowledge-synthesis:${params.entry.slug}:${synthesisType}` : '',
    ]),
  }));

  return matchedPattern ? `OpenAgent 模式预过滤：匹配阻断模式 ${matchedPattern}` : '';
}

function buildGenerationQueueBlockedPatternTarget(item: GenerationQueueItem): OpenAgentBlockedPatternTarget {
  return {
    key: item.key,
    title: item.title,
    topic: item.topic,
    reason: item.reason,
    source: item.sourceType,
    sourceType: item.sourceType,
    market: item.market,
    locale: item.locale,
    audience: item.audience,
    contentType: item.contentType,
    signatures: uniqueStrings([
      item.sourceType && item.key ? `${item.sourceType}:${item.key}` : '',
      item.sourceType && item.key && item.contentType ? `${item.sourceType}:${item.key}:${item.contentType}` : '',
    ]),
  };
}

function buildOpenAgentProtectedGenerationKeySet(analysisPlan: OpenAgentContentAnalysisPlan | null) {
  return new Set([
    ...(analysisPlan?.queueOverrides || []).map((item) => item.key),
    ...(analysisPlan?.laneContracts || []).flatMap((item) => item.targetKeys),
  ].filter(Boolean));
}

function prioritizeLaneQueueByOpenAgentPlan(params: {
  lane: PublicationLaneSummary;
  items: GenerationQueueItem[];
  analysisPlan: OpenAgentContentAnalysisPlan | null;
  weakLaneKeys: LaneKey[];
  perLaneQuota: number;
}) {
  const contract = params.analysisPlan?.laneContracts.find((item) => item.lane === params.lane.key) || null;
  const targetRank = new Map<string, number>((contract?.targetKeys || []).map((key, index) => [key, 100 - index]));
  const isWeakLane = params.weakLaneKeys.includes(params.lane.key);

  return [...params.items]
    .sort((left, right) => {
      const leftRank = targetRank.get(left.key) || 0;
      const rightRank = targetRank.get(right.key) || 0;
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }

      if (isWeakLane && left.sourceType === right.sourceType) {
        return right.priorityScore - left.priorityScore;
      }

      return right.priorityScore - left.priorityScore;
    })
    .slice(0, Math.max(params.perLaneQuota, isWeakLane ? Math.max(2, params.perLaneQuota) : params.perLaneQuota));
}

export function applyOpenAgentAnalysisToGenerationQueue(params: {
  queue: GenerationQueueItem[];
  analysisPlan: OpenAgentContentAnalysisPlan | null;
}) {
  if (!params.analysisPlan) {
    return params.queue;
  }

  const overrideRank = new Map(
    params.analysisPlan.queueOverrides.map((item) => [item.key, rankOpenAgentQueueOverridePriority(item.priority)])
  );
  const blockedPatterns = params.analysisPlan.blockedPatterns.map((item) => `${item || ''}`.trim()).filter(Boolean);
  const protectedKeys = buildOpenAgentProtectedGenerationKeySet(params.analysisPlan);

  return [...params.queue]
    .filter((item) => (
      protectedKeys.has(item.key)
      || !blockedPatterns.some((pattern) => matchesOpenAgentBlockedPattern(
        pattern,
        buildGenerationQueueBlockedPatternTarget(item)
      ))
    ))
    .sort((left, right) => {
      const leftRank = overrideRank.get(left.key) || 0;
      const rightRank = overrideRank.get(right.key) || 0;
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }

      return right.priorityScore - left.priorityScore;
    });
}

function buildWeakLaneGenerationContract(params: {
  publicationReserve: ReturnType<typeof buildWorldYiPublicationReserveSignal>;
  draftBatchSize: number;
}) {
  const weakLaneGaps = params.publicationReserve.weakLaneKeys.map((laneKey) => ({
    laneKey,
    gap: Math.max(1, params.publicationReserve.minQueuedTargetsPerLane - (params.publicationReserve.queuedTargetsPerLane[laneKey] || 0)),
  }));
  const generationLimit = Math.min(
    params.draftBatchSize,
    weakLaneGaps.reduce((sum, item) => sum + item.gap, 0)
  );

  return {
    weakLaneKeys: weakLaneGaps.map((item) => item.laneKey),
    generationLimit,
  };
}

function shouldBypassSchedulerLock(mode: ContentSchedulerExecutionMode) {
  return mode === 'validate' || process.env.CONTENT_SCHEDULER_DISABLE_LOCK === '1';
}

async function withContentSchedulerLock<T>(
  params: {
    trigger: 'cron' | 'manual';
    mode: ContentSchedulerExecutionMode;
    cycleRunId?: string;
  },
  run: () => Promise<T>
): Promise<T | null> {
  if (shouldBypassSchedulerLock(params.mode)) {
    return run();
  }

  const owner = params.cycleRunId || `scheduler-${generateId()}`;
  const acquired = systemLockOperations.acquire('content_scheduler_cycle', owner, 1000 * 60 * 25, {
    trigger: params.trigger,
    mode: params.mode,
  });

  if (!acquired) {
    return null;
  }

  try {
    return await run();
  } finally {
    systemLockOperations.release('content_scheduler_cycle', owner);
  }
}

function buildContentDecisionSamples(params: {
  candidates: EvaluatedScheduledPublishCandidate[];
  publishedEntry?: ManagedContentEntry | null;
  evaluatedAt?: string;
}): WorldYiContentDecisionSample[] {
  const publishedKey = params.publishedEntry
    ? buildEntryKey(params.publishedEntry.contentType, params.publishedEntry.slug)
    : '';
  const evaluatedAt = params.evaluatedAt || new Date().toISOString();

  return params.candidates.map((candidate) => {
    const candidateKey = buildEntryKey(candidate.entry.contentType, candidate.entry.slug);

    return {
      id: candidateKey,
      entryId: candidate.entry.id,
      slug: candidate.entry.slug,
      title: candidate.entry.title,
      contentType: candidate.entry.contentType,
      source: candidate.entry.source,
      sourceType: candidate.sourceType,
      growthPlanKey: candidate.growthPlanKey,
      laneKey: candidate.laneKey,
      laneLabel: candidate.laneLabel,
      laneTargetKey: candidate.laneTargetKey,
      laneNeedsCoverage: candidate.laneNeedsCoverage,
      weakLane: candidate.weakLane,
      decision: publishedKey && candidateKey === publishedKey ? 'publish' : candidate.decision,
      score: candidate.score,
      reasons: candidate.reasons,
      hardBlockReasons: candidate.hardBlockReasons,
      policySource: candidate.policySource,
      policyFocusKeys: candidate.policyFocusKeys,
      minimumScore: candidate.minimumScore,
      evaluatedAt,
    };
  });
}

function persistContentDecisionLedger(params: {
  cycleRunId?: string;
  trigger: 'cron' | 'manual';
  mode: ContentSchedulerExecutionMode;
  reason: string;
  state: ContentSchedulerState;
  autonomyPolicy: WorldYiAutonomyPolicy;
  candidates: EvaluatedScheduledPublishCandidate[];
  generatedCount: number;
  publishedCount: number;
  publishedEntry?: ManagedContentEntry | null;
  radarRefreshed: boolean;
  preview?: {
    wouldRefreshRadar: boolean;
    wouldGenerateCount: number;
    wouldPublishTitle: string | null;
    wouldPublishSlug: string | null;
  } | null;
  evaluatedAt?: string;
}) {
  return writeWorldYiContentDecisionLedgerEntry({
    id: params.cycleRunId ? `${params.cycleRunId}_content_decisions` : `content_decisions_${generateId()}`,
    cycleRunId: params.cycleRunId,
    trigger: params.trigger,
    mode: params.mode,
    reason: params.reason,
    publishWindowOpen: params.state.publishWindowOpen,
    canPublishNow: params.state.canPublishNow,
    generatedCount: params.generatedCount,
    publishedCount: params.publishedCount,
    publishedTitle: params.publishedEntry?.title || null,
    publishedSlug: params.publishedEntry?.slug || null,
    radarRefreshed: params.radarRefreshed,
    policySource: params.autonomyPolicy.source,
    policyFocusKeys: params.autonomyPolicy.focusKeys,
    preview: params.preview || null,
    decisions: buildContentDecisionSamples({
      candidates: params.candidates,
      publishedEntry: params.publishedEntry,
      evaluatedAt: params.evaluatedAt,
    }),
    createdAt: params.evaluatedAt || new Date().toISOString(),
  });
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

function getEntryPublishedDate(entry: ManagedContentEntry) {
  const meta = entry.meta || {};
  const candidates = [
    readMetaString(meta, 'schedulePublishedAt'),
    readMetaString(meta, 'autoPublishedAt'),
    readMetaString(meta, 'publishedAt'),
    entry.source === 'seed' ? entry.createdAt : '',
    entry.createdAt,
  ];

  for (const candidate of candidates) {
    const parsed = parseUtcDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function getEntryScheduledPublishedDate(entry: ManagedContentEntry) {
  return parseUtcDate(readMetaString(entry.meta || {}, 'schedulePublishedAt'));
}

function minutesBetween(now: Date, value?: string) {
  const parsed = parseUtcDate(value);
  if (!parsed) return null;
  return Math.max(0, Math.round((now.getTime() - parsed.getTime()) / 60_000));
}

function minutesBetweenDates(now: Date, value?: Date | null) {
  if (!value) return null;
  return Math.max(0, Math.round((now.getTime() - value.getTime()) / 60_000));
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
    timezoneOffsetMinutes: getContentSchedulerTimezoneOffsetMinutes(),
    publishHours: parsePublishHours(getContentSchedulerPublishHoursRaw()),
    dailyPublishLimit: getContentSchedulerDailyPublishLimit(),
    minPublishGapMinutes: getContentSchedulerMinPublishGapMinutes(),
    draftReserveTarget: getContentSchedulerDraftReserveTarget(),
    draftBatchSize: getContentSchedulerDraftBatchSize(),
    generateCooldownMinutes: getContentSchedulerGenerateCooldownMinutes(),
    radarRefreshMaxAgeHours: getContentSchedulerRadarRefreshMaxAgeHours(),
    adaptiveTypeWeight: getContentSchedulerAdaptiveTypeWeight(),
    adaptiveRadarSourceWeight: getContentSchedulerAdaptiveRadarSourceWeight(),
    adaptiveFreshnessWeight: getContentSchedulerAdaptiveFreshnessWeight(),
  };
}

function computeAutoPublishScore(entry: ManagedContentEntry) {
  const qualityScore = typeof entry.meta?.qualityScore === 'number' ? entry.meta.qualityScore : 0;

  return (
    entry.sections.length * 12 +
    entry.tags.length * 6 +
    Math.min(entry.excerpt.length, 80) +
    Math.min(entry.seoDescription.length, 80) +
    Math.round(qualityScore / 2) +
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
  const backlogPublishPressure = hasSchedulerPublishBacklogPressure(
    draftReserveCount,
    config.draftReserveTarget,
    getContentSchedulerBacklogPressureRatio(),
  );
  const publishedToday = params.entries.filter((entry) => (
    entry.status === 'published' &&
    isSchedulerCountedPublish(entry) &&
    localDateKey(getSchedulerCountedPublishedDate(entry) || new Date(0), config.timezoneOffsetMinutes) === todayKey
  )).length;
  const lastPublishedDate = params.entries
    .filter((entry) => entry.status === 'published' && isSchedulerCountedPublish(entry))
    .map((entry) => getSchedulerCountedPublishedDate(entry))
    .filter((date): date is Date => !!date)
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
  const lastPublishedAt = lastPublishedDate?.toISOString();
  const lastGeneratedAt = params.runs
    .filter((run) => run.status === 'success' && (run.generatedCount || 0) > 0)
    .sort((left, right) => (parseUtcDate(right.createdAt)?.getTime() || 0) - (parseUtcDate(left.createdAt)?.getTime() || 0))[0]?.createdAt;
  const minutesSinceLastPublish = minutesBetweenDates(now, lastPublishedDate);
  const minutesSinceLastGenerate = minutesBetween(now, lastGeneratedAt);
  const publishWindowOpen = config.publishHours.includes(localHour(now, config.timezoneOffsetMinutes));
  const canPublishNow = resolveSchedulerCanPublishNow({
    publishWindowOpen,
    publishedToday,
    dailyPublishLimit: config.dailyPublishLimit,
    minutesSinceLastPublish,
    minPublishGapMinutes: config.minPublishGapMinutes,
  });

  return {
    localNow: formatLocalClock(now, config.timezoneOffsetMinutes),
    publishHours: config.publishHours,
    dailyPublishLimit: config.dailyPublishLimit,
    publishedToday,
    draftReserveTarget: config.draftReserveTarget,
    draftReserveCount,
    needsDraftReplenishment: !backlogPublishPressure &&
      draftReserveCount < config.draftReserveTarget &&
      (minutesSinceLastGenerate === null || minutesSinceLastGenerate >= config.generateCooldownMinutes),
    backlogPublishPressure,
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
  return evaluateScheduledPublishCandidates(params).candidates
    .filter((candidate) => candidate.ready)
    .map(({ ready: _ready, hardBlockReasons: _hardBlockReasons, sourceType: _sourceType, growthPlanKey: _growthPlanKey, laneKey: _laneKey, laneLabel: _laneLabel, laneTargetKey: _laneTargetKey, laneNeedsCoverage: _laneNeedsCoverage, weakLane: _weakLane, decision: _decision, policySource: _policySource, policyFocusKeys: _policyFocusKeys, minimumScore: _minimumScore, ...candidate }) => candidate);
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
  const publicationLanes = buildWorldYiPublicationLaneSummaries(params.entries);
  const publicationReserve = buildWorldYiPublicationReserveSignal(publicationLanes);
  const autonomyFocus = summarizeOpenAgentAutonomyBacklogFocus();
  const openAgentContentAnalysis = readActiveOpenAgentContentAnalysisPlan();
  const policyResolution = resolveWorldYiAutonomyRuntimePolicy({
    fallbackFocus: autonomyFocus,
    analysisPlan: openAgentContentAnalysis,
  });
  const autonomyPolicy = policyResolution.effectivePolicy;
  const evaluatedDraftCandidates = evaluateDraftEntries({
    entries: params.entries,
    performance,
    lanes: publicationLanes,
    autonomyPolicy,
    analysisPlan: openAgentContentAnalysis,
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
    const priorityScore = demandScore + Math.max(0, 2 - publishedCount) * 18 + missingTypes.length * 10 - draftCount * 8 - Math.max(0, publishedCount - 2) * 22;

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

  const laneQueue: GenerationQueueItem[] = publicationLanes.flatMap((lane) => {
    const laneConfig = getWorldYiPublicationLaneConfigByKey(lane.key);
    if (!laneConfig) {
      return [];
    }

    return lane.queue.flatMap<GenerationQueueItem>((row) => {
      const target = laneConfig.targets.find((item) => item.key === row.key);
      if (!target) {
        return [];
      }

      const laneReserveBoost = publicationReserve.weakLaneKeys.includes(lane.key)
        ? autonomyPolicy.queueWeights.weakLaneBoost
        : 0;
      const backlogBoost = autonomyPolicy.queueWeights.backlogLaneReserveBoost;
      const reasonParts = [
        `${target.market} 的公开流量位仍缺核心内容，当前已发布 ${row.publishedCount} 篇、草稿 ${row.draftCount} 篇。`,
      ];

      if (publicationReserve.weakLaneKeys.includes(lane.key)) {
        reasonParts.push(`${lane.label} 当前低于 reserve floor，优先补齐这一条 lane。`);
      }
      if (autonomyFocus.laneReserve) {
        reasonParts.push('OpenAgent backlog 正在强调 lane reserve，补稿优先级已上调。');
      }

      return [{
        key: target.key,
        title: target.title,
        topic: target.topic,
        angle: target.angle,
        contentType: target.primaryType,
        keywords: target.keywords,
        reason: reasonParts.join(' '),
        priorityScore: row.priorityScore + autonomyPolicy.queueWeights.laneGapBaseBoost + laneReserveBoost + backlogBoost,
        audience: target.audience,
        market: target.market,
        locale: target.locale,
        sourceType: laneConfig.sourceType,
      } satisfies GenerationQueueItem];
    });
  });

  const balancedLaneQueue = publicationLanes.flatMap((lane) => {
    const laneConfig = getWorldYiPublicationLaneConfigByKey(lane.key);
    if (!laneConfig) {
      return [];
    }

    return prioritizeLaneQueueByOpenAgentPlan({
      lane,
      items: laneQueue.filter((item) => item.sourceType === laneConfig.sourceType),
      analysisPlan: openAgentContentAnalysis,
      weakLaneKeys: publicationReserve.weakLaneKeys,
      perLaneQuota: autonomyPolicy.queueWeights.perLaneQuota,
    });
  });

  const mergedQueue = applyOpenAgentAnalysisToGenerationQueue({
    queue: [
    ...balancedLaneQueue,
    ...radarQueue.slice(0, autonomyPolicy.queueWeights.radarQuota),
    ...generationQueue.slice(0, autonomyPolicy.queueWeights.clusterQuota),
    ],
    analysisPlan: openAgentContentAnalysis,
  })
    .slice(0, 10);

  const autoPublishCandidates: AutoPublishCandidate[] = evaluatedDraftCandidates
    .filter((candidate) => candidate.ready && candidate.entry.source.startsWith('agent-llm:'))
    .map((candidate) => ({
      id: candidate.entry.id,
      title: candidate.entry.title,
      slug: candidate.entry.slug,
      source: candidate.entry.source,
      score: candidate.score,
    }))
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
    publicationReserve,
    autonomyFocus,
    autonomyPolicy,
    autonomyPolicyBase: policyResolution.basePolicy,
    autonomyPolicySignalApplications: policyResolution.appliedSignals,
    autonomyPolicyIgnoredSignals: policyResolution.ignoredSignals,
    openAgentContentAnalysis,
    decisionLedgerSummary: summarizeWorldYiContentDecisionLedger(),
  };
}

export function getContentOpsSnapshot() {
  const cacheKey = 'ops-snapshot:v1';
  const cached = contentSnapshotCache.get(cacheKey);
  if (cached) return cached;

  const entries = listManagedContentEntries();
  const analyticsRows = listRecentContentAnalyticsRows();

  const result = buildContentOpsSnapshot({
    entries,
    analyticsRows,
    radarSignals: contentSignalOperations.listRecent(20),
  });

  // Guard: estimate size from entry count + rough analytics (protects Next cache layers + heap)
  const roughSize = (entries.length * 1800) + (analyticsRows.length * 120);
  contentSnapshotCache.set(cacheKey, result, roughSize);
  return result;
}

export function getContentSchedulerOverview() {
  const cacheKey = 'scheduler-overview:v1';
  const cached = contentSnapshotCache.get(cacheKey);
  if (cached) return cached;

  // DB projection: use light entries (no sections) + fast counts. Massive memory win for web tier.
  const lightEntries = listManagedContentEntriesLight();
  const result = buildContentSchedulerState({
    entries: lightEntries as any, // compatible shape for most scheduler logic (title/status/meta etc)
    runs: contentSchedulerRunOperations.listRecent(20),
  });

  // Bounded guard - scheduler state includes full lane summaries + performance graphs
  const roughSize = 420 * 1024; // conservative ~420KB even for 4000 entries (internal reductions)
  contentSnapshotCache.set(cacheKey, result, roughSize);
  return result;
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
  const skippedDuplicateTitles: { title: string; familyKey: string; draftCount: number; publishedCount: number }[] = [];
  const skippedQualityDrafts: { title: string; score: number; reasons: string[] }[] = [];
  const skippedSimilarDrafts: { title: string; similarTitle: string; similarSlug: string }[] = [];
  const analyticsRows = listRecentContentAnalyticsRows();
  const baseEntries = listManagedContentEntries();

  // D31-A: 题材族 (titleFamilyKey) 重复抑制 — 阻止生成端持续产同题草稿
  // 阈值：每 family + contentType 最多 3 篇草稿 / 1 篇已发布
  const TITLE_FAMILY_DRAFT_MAX = 3;
  const TITLE_FAMILY_PUBLISHED_MAX = 1;
  const familyCounts = new Map<string, { draft: number; published: number }>();
  for (const entry of baseEntries) {
    const familyKey = normalizeTitleFamilyKey(entry.title);
    if (!familyKey || familyKey.length < 12) continue;
    const mapKey = `${entry.contentType}:${familyKey}`;
    const bucket = familyCounts.get(mapKey) || { draft: 0, published: 0 };
    if (entry.status === 'published') bucket.published += 1;
    else if (entry.status === 'draft') bucket.draft += 1;
    familyCounts.set(mapKey, bucket);
  }

  const performance = buildContentPerformanceContext({
    entries: baseEntries,
    analyticsRows,
  });
  const lanes = buildWorldYiPublicationLaneSummaries(baseEntries);
  const backlogFocus = summarizeOpenAgentAutonomyBacklogFocus();
  const openAgentContentAnalysis = readActiveOpenAgentContentAnalysisPlan();
  const autonomyPolicy = resolveWorldYiAutonomyRuntimePolicy({
    fallbackFocus: backlogFocus,
    analysisPlan: openAgentContentAnalysis,
  }).effectivePolicy;

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
      locale: item.locale as ContentGenerationLocale | undefined,
      market: item.market,
      sourceSignals: item.reason,
      status: 'draft',
      featured: false,
    });

    for (const draft of generated.entries) {
      const quality = assessGeneratedManagedContentDraftQuality(draft);
      if (!quality.ready) {
        skippedQualityDrafts.push({
          title: draft.title,
          score: quality.score,
          reasons: quality.reasons,
        });
        continue;
      }

      const similarEntry = findSimilarExistingContent({
        draft,
        entries: [...baseEntries, ...savedEntries],
      });
      if (similarEntry) {
        skippedSimilarDrafts.push({
          title: draft.title,
          similarTitle: similarEntry.title,
          similarSlug: similarEntry.slug,
        });
        continue;
      }

      // D31-A: 跳过题材族已饱和的草稿（含本批新增）
      const familyKey = normalizeTitleFamilyKey(draft.title);
      if (familyKey && familyKey.length >= 12) {
        const mapKey = `${draft.contentType}:${familyKey}`;
        const bucket = familyCounts.get(mapKey) || { draft: 0, published: 0 };
        if (
          bucket.draft >= TITLE_FAMILY_DRAFT_MAX
          || bucket.published >= TITLE_FAMILY_PUBLISHED_MAX
        ) {
          skippedDuplicateTitles.push({
            title: draft.title,
            familyKey,
            draftCount: bucket.draft,
            publishedCount: bucket.published,
          });
          continue;
        }
      }

      const growthPlanKey = item.sourceType?.startsWith('public-growth') ? item.key : undefined;
      const draftEntry: ManagedContentEntry = {
        id: '',
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
        status: 'draft',
        source: `${draft.source}:automation`,
        meta: {
          growthPlanKey,
          market: item.market,
          locale: item.locale,
          sourceType: item.sourceType,
          automationReason: item.reason,
        },
        createdBy: params.userId,
        updatedBy: params.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const autoPublishDecision = params.autoPublish
        ? buildAutoPublishGateDecision({
            entry: draftEntry,
            performance,
            lanes,
            autonomyPolicy,
          })
        : null;
      const finalStatus = autoPublishDecision?.ready ? 'published' : 'draft';
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
        createdBy: params.userId,
        updatedBy: params.userId,
        status: finalStatus,
        source: `${draft.source}:automation`,
        meta: {
          growthPlanKey,
          market: item.market,
          locale: item.locale,
          sourceType: item.sourceType,
          automationReason: item.reason,
          qualityScore: quality.score,
          qualityReasons: quality.reasons,
          averageParagraphLength: quality.averageParagraphLength,
          autoPublishScore: autoPublishDecision?.score,
          autoPublishReasons: autoPublishDecision?.reasons,
          autoPublishBlockedBy: autoPublishDecision?.hardBlockReasons,
        },
      }, params.userId);

      if (entry) {
        savedEntries.push(entry);
        // D31-A: 本批次新增也计入 family，防止同 cycle 内继续产同题
        const savedFamilyKey = normalizeTitleFamilyKey(entry.title);
        if (savedFamilyKey && savedFamilyKey.length >= 12) {
          const mapKey = `${entry.contentType}:${savedFamilyKey}`;
          const bucket = familyCounts.get(mapKey) || { draft: 0, published: 0 };
          if (entry.status === 'published') bucket.published += 1;
          else bucket.draft += 1;
          familyCounts.set(mapKey, bucket);
        }
      }
    }
  }

  return {
    plan,
    savedEntries,
    generatedCount: savedEntries.length,
    publishedCount: savedEntries.filter((entry) => entry.status === 'published').length,
    draftCount: savedEntries.filter((entry) => entry.status === 'draft').length,
    skippedDuplicateTitles,
    skippedQualityDrafts,
    skippedSimilarDrafts,
  };
}

export async function runContentSchedulerCycle(params?: {
  trigger?: 'cron' | 'manual';
  mode?: ContentSchedulerExecutionMode;
  cycleRunId?: string;
}) {
  const trigger = params?.trigger || 'cron';
  const mode = params?.mode || 'live';
  const lockedResult = await withContentSchedulerLock({
    trigger,
    mode,
    cycleRunId: params?.cycleRunId,
  }, () => runContentSchedulerCycleUnlocked({
    trigger,
    mode,
    cycleRunId: params?.cycleRunId,
  }));

  if (lockedResult) {
    return lockedResult;
  }

  const opsSnapshot = getContentOpsSnapshot();
  return {
    success: true,
    generatedCount: 0,
    publishedCount: 0,
    publishedEntry: null,
    generatedTitles: [],
    reason: '已有内容调度任务正在执行，本轮跳过以避免重复生成和重叠发布',
    radarRefreshed: false,
    scheduler: getContentSchedulerOverview(),
    opsSnapshot,
    preview: null,
    decisionLedgerSummary: summarizeWorldYiContentDecisionLedger(),
  };
}

async function runContentSchedulerCycleUnlocked(params: {
  trigger: 'cron' | 'manual';
  mode: ContentSchedulerExecutionMode;
  cycleRunId?: string;
}) {
  const trigger = params.trigger;
  const mode = params.mode;
  const validationMode = mode === 'validate';
  const journeyRefresh = validationMode
    ? { refreshedCount: 0 }
    : refreshManagedContentJourneyMetadata({
        limit: 80,
        userId: 'system_scheduler',
      });
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
  let publicationReserve = buildWorldYiPublicationReserveSignal(buildWorldYiPublicationLaneSummaries(entries));
  let weakLaneGenerationContract = buildWeakLaneGenerationContract({
    publicationReserve,
    draftBatchSize: config.draftBatchSize,
  });

  const recentSignal = contentSignalOperations.listRecent(1)[0];
  const signalAgeMinutes = minutesBetween(now, recentSignal?.createdAt);
  const shouldRefreshRadar = signalAgeMinutes === null || signalAgeMinutes >= config.radarRefreshMaxAgeHours * 60;
  let radarRefreshed = false;

  if (!validationMode && shouldRefreshRadar) {
    await runContentRadarCycle();
    radarRefreshed = true;
  }

  // Phase 4: consume pending content_generation_jobs from forum trend scanner
  let trendGeneratedCount = 0;
  try {
    for (let i = 0; i < 2; i++) {
      const job = contentGenerationJobOperations.claimNextRunnable();
      if (!job) break;
      const genResult = generateFromTrendJob(job);
      if (genResult.error || !genResult.question || !genResult.answer) {
        contentGenerationJobOperations.markFailed(job.id, {
          lastError: genResult.error || 'generation_failed',
          lockedAt: job.lockedAt,
        });
        continue;
      }
      const { question, answer } = genResult;
      forumQuestionOperations.create({
        id: question.id, slug: question.slug, authorId: 'system_trend',
        title: question.title, body: question.body, category: question.category,
        industry: '', tags: question.tags, privacyMode: 'public',
        metadata: { source: 'trend_generator', jobId: job.id },
        status: 'visible', publishedAt: new Date().toISOString(),
        viewCount: 0, answerCount: 1,
      });
      forumAnswerOperations.create({
        id: answer.id, questionId: answer.questionId, authorId: 'system_trend',
        body: answer.body, isOfficial: true,
        status: 'visible', publishedAt: new Date().toISOString(),
        responseDelayMinutes: 0,
      });
      contentGenerationJobOperations.markCompleted(job.id, {
        generatedCount: 1,
        lockedAt: job.lockedAt,
        meta: { ...((job.meta as Record<string,unknown>) || {}), questionId: question.id, answerId: answer.id },
      });
      trendGeneratedCount++;
    }
  } catch (err) {
    console.error('[content-scheduler] trend generation failed:', err instanceof Error ? err.message : err);
  }

  if (validationMode) {
    const scheduledEvaluation = evaluateScheduledPublishCandidates({
      entries,
      analyticsRows,
      now,
      config,
    });
    const publishQuota = state.canPublishNow
      ? Math.max(0, Math.min(
          config.draftBatchSize,
          config.dailyPublishLimit - state.publishedToday,
        ))
      : 0;
    const readyPreviewCandidates = scheduledEvaluation.candidates.filter((candidate) => candidate.ready);
    const previewPublishCount = Math.min(publishQuota, readyPreviewCandidates.length);
    const previewCandidate = previewPublishCount > 0 ? readyPreviewCandidates[0] || null : null;
    const draftReserveGenerationLimit = state.needsDraftReplenishment
      ? Math.min(config.draftBatchSize, Math.max(1, state.draftReserveTarget - state.draftReserveCount))
      : 0;
    const canGenerateAfterPublish = state.minutesSinceLastGenerate === undefined ||
      state.minutesSinceLastGenerate >= config.generateCooldownMinutes;
    const postPublishDraftReserveCount = Math.max(0, state.draftReserveCount - previewPublishCount);
    const postPublishReserveGenerationLimit = previewPublishCount > 0 && canGenerateAfterPublish && postPublishDraftReserveCount < state.draftReserveTarget
      ? Math.min(config.draftBatchSize, Math.max(1, state.draftReserveTarget - postPublishDraftReserveCount))
      : 0;
    const previewGenerationLimit = Math.max(
      draftReserveGenerationLimit,
      postPublishReserveGenerationLimit,
      weakLaneGenerationContract.generationLimit
    );
    const finalReason = postPublishReserveGenerationLimit > 0
      ? 'validation_mode_detected_post_publish_reserve_gap'
      : previewCandidate
        ? 'validation_mode_detected_publish_candidate'
        : weakLaneGenerationContract.generationLimit > 0
          ? 'validation_mode_detected_weak_lane_contract'
          : previewGenerationLimit > 0
            ? 'validation_mode_detected_reserve_gap'
            : shouldRefreshRadar
              ? 'validation_mode_detected_radar_refresh'
              : 'validation_mode_no_action';
    const preview = {
      mode: 'validate' as const,
      wouldRefreshRadar: shouldRefreshRadar,
      wouldGenerateCount: previewGenerationLimit,
      wouldPublishTitle: previewCandidate?.entry.title || null,
      wouldPublishSlug: previewCandidate?.entry.slug || null,
    };
    const decisionLedgerEntry = persistContentDecisionLedger({
      cycleRunId: params?.cycleRunId,
      trigger,
      mode,
      reason: finalReason,
      state,
      autonomyPolicy: scheduledEvaluation.autonomyPolicy,
      candidates: scheduledEvaluation.candidates,
      generatedCount: 0,
      publishedCount: 0,
      publishedEntry: null,
      radarRefreshed: false,
      preview,
      evaluatedAt: now.toISOString(),
    });
    const opsSnapshot = getContentOpsSnapshot();

    return {
      success: true,
      generatedCount: 0,
      publishedCount: 0,
      publishedEntry: null,
      generatedTitles: [],
      reason: finalReason,
      radarRefreshed: false,
      scheduler: getContentSchedulerOverview(),
      opsSnapshot,
      preview,
      decisionLedgerSummary: summarizeWorldYiContentDecisionLedger([decisionLedgerEntry]),
    };
  }

  let generatedCount = 0;
  let publishedCount = 0;
  let publishedEntry: ManagedContentEntry | null = null;
  let generatedTitles: string[] = [];
  let publishRescueGenerated = false;
  let weakLaneContractTriggered = weakLaneGenerationContract.generationLimit > 0;
  let scheduledEvaluation = evaluateScheduledPublishCandidates({
    entries,
    analyticsRows,
    now,
    config,
  });

  if (
    !state.backlogPublishPressure &&
    (state.needsDraftReplenishment || weakLaneGenerationContract.generationLimit > 0)
  ) {
    const reserveGap = state.needsDraftReplenishment
      ? Math.max(1, state.draftReserveTarget - state.draftReserveCount)
      : 0;
    const generationLimit = Math.min(
      config.draftBatchSize,
      Math.max(reserveGap, weakLaneGenerationContract.generationLimit)
    );
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
    publicationReserve = buildWorldYiPublicationReserveSignal(buildWorldYiPublicationLaneSummaries(entries));
    weakLaneGenerationContract = buildWeakLaneGenerationContract({
      publicationReserve,
      draftBatchSize: config.draftBatchSize,
    });
    scheduledEvaluation = evaluateScheduledPublishCandidates({
      entries,
      analyticsRows,
      now,
      config,
    });
  }

  let interestPublishedCount = 0;

  if (state.canPublishNow) {
    const publishQuota = Math.max(0, Math.min(
      config.draftBatchSize,
      config.dailyPublishLimit - state.publishedToday,
    ));
    let readyCandidates = scheduledEvaluation.candidates.filter((item) => item.ready);
    const performance = buildContentPerformanceContext({
      entries,
      analyticsRows,
    });
    let interestCandidates = isContentSchedulerInterestPublishEnabled()
      ? selectInterestDrivenCandidates({
        entries,
        clusterSignalBuckets: performance.clusterSignalBuckets,
        limit: publishQuota,
        excludeIds: new Set(readyCandidates.map((item) => item.entry.id)),
        now,
      })
      : [];

    if (
      readyCandidates.length === 0 &&
      interestCandidates.length === 0 &&
      publishQuota > 0 &&
      !state.backlogPublishPressure
    ) {
      const rescueGeneration = await runContentAutomationCycle({
        userId: 'system_scheduler',
        limit: 1,
        autoPublish: false,
      });
      generatedCount += rescueGeneration.generatedCount;
      generatedTitles = uniqueStrings([...generatedTitles, ...rescueGeneration.savedEntries.map((entry) => entry.title)]).slice(0, 6);
      publishRescueGenerated = rescueGeneration.generatedCount > 0;
      entries = listManagedContentEntries();
      scheduledEvaluation = evaluateScheduledPublishCandidates({
        entries,
        analyticsRows,
        now,
        config,
      });
      readyCandidates = scheduledEvaluation.candidates.filter((item) => item.ready);
      interestCandidates = isContentSchedulerInterestPublishEnabled()
        ? selectInterestDrivenCandidates({
          entries,
          clusterSignalBuckets: performance.clusterSignalBuckets,
          limit: publishQuota,
          excludeIds: new Set(readyCandidates.map((item) => item.entry.id)),
          now,
        })
        : [];
    }

    for (const candidate of readyCandidates.slice(0, publishQuota)) {
      const publishedAt = new Date().toISOString();
      const sourceType = candidate.sourceType || readMetaString(candidate.entry.meta, 'sourceType');
      const growthPublicationMeta = isPublicGrowthSourceType(sourceType)
        ? {
          publicationReady: true,
          editorialScore: candidate.score,
          surfaceVisibility: 'public',
          autoPublishedAt: publishedAt,
          publishReasons: candidate.reasons,
        }
        : {};
      const nextPublishedEntry = saveManagedContentEntry({
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
        createdBy: candidate.entry.createdBy,
        updatedBy: 'system_scheduler',
        status: 'published',
        source: candidate.entry.source,
        meta: {
          ...(candidate.entry.meta || {}),
          ...growthPublicationMeta,
          ...buildIllustrationMetaForEntry({
            contentType: candidate.entry.contentType,
            slug: candidate.entry.slug,
            title: candidate.entry.title,
            excerpt: candidate.entry.excerpt,
            category: candidate.entry.category,
            tags: candidate.entry.tags,
            meta: candidate.entry.meta,
            sectionCount: Array.isArray(candidate.entry.sections) ? candidate.entry.sections.length : 0,
          }),
          schedulePublishedAt: publishedAt,
          scheduleTrigger: trigger,
          scheduleScore: candidate.score,
          scheduleReasons: candidate.reasons,
        },
      }, 'system_scheduler');

      if (nextPublishedEntry) {
        publishedEntry = nextPublishedEntry;
        publishedCount += 1;
      }
    }

    const remainingQuota = Math.max(0, publishQuota - publishedCount);
    for (const candidate of interestCandidates.slice(0, remainingQuota)) {
      const publishedAt = new Date().toISOString();
      const missionMeta = buildInterestPublishMeta({
        entry: candidate.entry,
        clusterKey: candidate.clusterKey,
        clusterTitle: candidate.clusterTitle,
        score: candidate.score,
        reasons: candidate.reasons,
        publishedAt,
      });
      const nextPublishedEntry = saveManagedContentEntry({
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
        createdBy: candidate.entry.createdBy,
        updatedBy: 'system_scheduler',
        status: 'published',
        source: candidate.entry.source,
        meta: {
          ...(candidate.entry.meta || {}),
          ...missionMeta,
          ...buildIllustrationMetaForEntry({
            contentType: candidate.entry.contentType,
            slug: candidate.entry.slug,
            title: candidate.entry.title,
            excerpt: candidate.entry.excerpt,
            category: candidate.entry.category,
            tags: candidate.entry.tags,
            meta: {
              ...(candidate.entry.meta || {}),
              ...missionMeta,
            },
            sectionCount: Array.isArray(candidate.entry.sections) ? candidate.entry.sections.length : 0,
          }),
        },
      }, 'system_scheduler');

      if (nextPublishedEntry) {
        publishedEntry = nextPublishedEntry;
        publishedCount += 1;
        interestPublishedCount += 1;
      }
    }

    entries = listManagedContentEntries();
    state = buildContentSchedulerState({
      entries,
      runs,
      now,
      config,
    });
    publicationReserve = buildWorldYiPublicationReserveSignal(buildWorldYiPublicationLaneSummaries(entries));
    weakLaneGenerationContract = buildWeakLaneGenerationContract({
      publicationReserve,
      draftBatchSize: config.draftBatchSize,
    });

    if (
      !state.backlogPublishPressure &&
      (state.needsDraftReplenishment || weakLaneGenerationContract.generationLimit > 0)
    ) {
      const reserveGap = state.needsDraftReplenishment
        ? Math.max(1, state.draftReserveTarget - state.draftReserveCount)
        : 0;
      const generationLimit = Math.min(
        config.draftBatchSize,
        Math.max(reserveGap, weakLaneGenerationContract.generationLimit)
      );
      const replenishment = await runContentAutomationCycle({
        userId: 'system_scheduler',
        limit: generationLimit,
        autoPublish: false,
      });
      generatedCount += replenishment.generatedCount;
      generatedTitles = uniqueStrings([...generatedTitles, ...replenishment.savedEntries.map((entry) => entry.title)]).slice(0, 6);
      entries = listManagedContentEntries();
      state = buildContentSchedulerState({
        entries,
        runs,
        now,
        config,
      });
      publicationReserve = buildWorldYiPublicationReserveSignal(buildWorldYiPublicationLaneSummaries(entries));
      weakLaneGenerationContract = buildWeakLaneGenerationContract({
        publicationReserve,
        draftBatchSize: config.draftBatchSize,
      });
      scheduledEvaluation = evaluateScheduledPublishCandidates({
        entries,
        analyticsRows,
        now,
        config,
      });
    }
  }

  let finalReason = '当前不在发布窗口，维持观察';
  if (publishedCount > 0 && interestPublishedCount > 0) {
    finalReason = '根据用户兴趣与三线内容使命（命理普及/世界易/人生K线）完成发布';
  } else if (publishedCount > 0 && publishRescueGenerated) {
    finalReason = '发布窗口内主动补稿并完成自动发布';
  } else if (publishedCount > 0) {
    finalReason = '按发布节奏完成本轮自动发布';
  } else if (publishRescueGenerated) {
    finalReason = '发布窗口内已尝试补稿，但仍未达到自动发布阈值';
  } else if (weakLaneContractTriggered && generatedCount > 0) {
    finalReason = `弱 lane 保底合同已触发，优先补齐 ${publicationReserve.weakLaneKeys.join(', ') || '目标 lane'} 草稿`;
  } else if (generatedCount > 0) {
    finalReason = '稿池低于阈值，已自动补充草稿';
  } else if (state.publishWindowOpen && !state.canPublishNow) {
    if (state.publishedToday >= state.dailyPublishLimit) {
      finalReason = `已达今日发布上限 ${state.publishedToday}/${state.dailyPublishLimit}，等待次日窗口`;
    } else if (
      typeof state.minutesSinceLastPublish === 'number' &&
      state.minutesSinceLastPublish < config.minPublishGapMinutes
    ) {
      finalReason = `距上次发布仅 ${state.minutesSinceLastPublish} 分钟，未满最小间隔 ${config.minPublishGapMinutes} 分钟`;
    } else {
      finalReason = '当前处于发布窗口，但已达到日上限或未满足最小发布时间间隔';
    }
  } else if (state.backlogPublishPressure && state.canPublishNow) {
    finalReason = '稿池积压较多，但本轮未匹配到可发布的兴趣主题草稿';
  } else if (state.canPublishNow) {
    finalReason = state.minutesSinceLastPublish !== undefined &&
      state.minutesSinceLastPublish >= getContentSchedulerPublishStaleRelaxMinutes()
      ? '发布窗口内允许发布，但候选仍未达阈值（已启用断粮放宽策略，下一轮继续）'
      : '当前允许发布，但没有达到阈值的优质草稿';
  }

  const run: ContentSchedulerRunRecord = {
    id: `scheduler_${generateId()}`,
    trigger,
    status: generatedCount > 0 || publishedCount > 0 ? 'success' : 'skipped',
    reason: finalReason,
    generatedCount,
    publishedCount,
    meta: {
      journeyRefreshedCount: journeyRefresh.refreshedCount,
      executionMode: mode,
      localNow: state.localNow,
      radarRefreshed,
      publishWindowOpen: state.publishWindowOpen,
      canPublishNow: state.canPublishNow,
      publishedToday: state.publishedToday,
      backlogPublishPressure: state.backlogPublishPressure,
      interestPublishedCount,
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
  const decisionLedgerEntry = persistContentDecisionLedger({
    cycleRunId: params?.cycleRunId,
    trigger,
    mode,
    reason: finalReason,
    state,
    autonomyPolicy: scheduledEvaluation.autonomyPolicy,
    candidates: scheduledEvaluation.candidates,
    generatedCount,
    publishedCount,
    publishedEntry,
    radarRefreshed,
    preview: null,
    evaluatedAt: now.toISOString(),
  });
  const opsSnapshot = getContentOpsSnapshot();

  return {
    success: true,
    generatedCount,
    publishedCount,
    publishedEntry,
    generatedTitles,
    reason: finalReason,
    radarRefreshed,
    scheduler: getContentSchedulerOverview(),
    opsSnapshot,
    preview: null,
    decisionLedgerSummary: summarizeWorldYiContentDecisionLedger([decisionLedgerEntry]),
  };
}
