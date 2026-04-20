import mainTargets from '@/data/public-growth-targets.json';
import wave2Targets from '@/data/public-growth-targets-wave2.json';
import globalTargets from '@/data/public-growth-targets-global.json';
import publicationProgram from '@/data/world-yi-publication-program.json';
import { type ManagedContentEntry, type ManagedContentType } from '@/lib/content-store';
import { assessGrowthPublication, buildPublicGrowthAudit } from '@/lib/public-growth-plan';

export type LaneKey = 'main' | 'wave2' | 'global';
export type SourceType = 'public-growth' | 'public-growth-wave2' | 'public-growth-global';

export interface GrowthTarget {
  key: string;
  title: string;
  topic: string;
  angle: string;
  primaryType: ManagedContentType;
  locale: string;
  market: string;
  keywords: string[];
  audience: string;
  trafficPotential: number;
  conversionPotential: number;
}

export interface LaneConfig {
  key: LaneKey;
  label: string;
  sourceType: SourceType;
  targets: GrowthTarget[];
}

export interface PublicationLaneCoverageRow {
  key: string;
  title: string;
  locale: string;
  market: string;
  primaryType: ManagedContentType;
  publishedCount: number;
  draftCount: number;
  readyDraftCount: number;
  missing: boolean;
  priorityScore: number;
}

export interface PublicationLaneSummary {
  key: LaneKey;
  label: string;
  targetCount: number;
  publishedCount: number;
  missingCount: number;
  draftOnlyCount: number;
  readyPromoteCount: number;
  queueLength: number;
  promoteQueueLength: number;
  queue: PublicationLaneCoverageRow[];
  promoteQueue: PublicationLaneCoverageRow[];
}

const laneConfigs: LaneConfig[] = [
  {
    key: 'main',
    label: 'Public Growth Main',
    sourceType: 'public-growth',
    targets: mainTargets as GrowthTarget[],
  },
  {
    key: 'wave2',
    label: 'Public Growth Wave2',
    sourceType: 'public-growth-wave2',
    targets: wave2Targets as GrowthTarget[],
  },
  {
    key: 'global',
    label: 'Public Growth Global',
    sourceType: 'public-growth-global',
    targets: globalTargets as GrowthTarget[],
  },
];

function buildGenericLaneCoverage(entries: ManagedContentEntry[], config: LaneConfig): PublicationLaneCoverageRow[] {
  return config.targets.map((target) => {
    const matched = entries
      .filter((entry) => entry.meta?.sourceType === config.sourceType)
      .filter((entry) => entry.meta?.growthPlanKey === target.key);
    const published = matched.filter((entry) => entry.status === 'published' && entry.meta?.publicationReady === true);
    const drafts = matched.filter((entry) => entry.status === 'draft');
    const readyDraftCount = drafts.filter((entry) => assessGrowthPublication(entry, config.sourceType).ready).length;
    const missing = published.length === 0;
    const priorityScore = (
      target.trafficPotential * 18
      + target.conversionPotential * 16
      + (missing ? 36 : 0)
      + (drafts.length === 0 ? 14 : 0)
      - published.length * 12
      - drafts.length * 4
    );

    return {
      key: target.key,
      title: target.title,
      locale: target.locale,
      market: target.market,
      primaryType: target.primaryType,
      publishedCount: published.length,
      draftCount: drafts.length,
      readyDraftCount,
      missing,
      priorityScore,
    } satisfies PublicationLaneCoverageRow;
  }).sort((left, right) => right.priorityScore - left.priorityScore);
}

export function getWorldYiPublicationLaneConfigs() {
  return laneConfigs;
}

export function getWorldYiPublicationLaneConfigByKey(key: LaneKey) {
  return laneConfigs.find((config) => config.key === key) || null;
}

export function getWorldYiPublicationLaneConfigBySourceType(sourceType?: string | null) {
  return laneConfigs.find((config) => config.sourceType === sourceType) || null;
}

export function buildWorldYiPublicationLaneSummary(entries: ManagedContentEntry[], config: LaneConfig): PublicationLaneSummary {
  const coverage = config.key === 'main'
    ? buildPublicGrowthAudit(entries).coverage.map((item) => {
        const drafts = entries
          .filter((entry) => entry.meta?.sourceType === config.sourceType)
          .filter((entry) => entry.meta?.growthPlanKey === item.target.key)
          .filter((entry) => entry.status === 'draft');

        return {
          key: item.target.key,
          title: item.target.title,
          locale: item.target.locale,
          market: item.target.market,
          primaryType: item.target.primaryType,
          publishedCount: item.publishedCount,
          draftCount: item.draftCount,
          readyDraftCount: drafts.filter((entry) => assessGrowthPublication(entry, config.sourceType).ready).length,
          missing: item.missing,
          priorityScore: item.priorityScore,
        } satisfies PublicationLaneCoverageRow;
      })
    : buildGenericLaneCoverage(entries, config);

  const queue = coverage.filter((item) => item.missing);
  const promoteQueue = coverage.filter((item) => item.readyDraftCount > 0);

  return {
    key: config.key,
    label: config.label,
    targetCount: coverage.length,
    publishedCount: coverage.filter((item) => item.publishedCount > 0).length,
    missingCount: queue.length,
    draftOnlyCount: coverage.filter((item) => item.publishedCount === 0 && item.draftCount > 0).length,
    readyPromoteCount: promoteQueue.reduce((sum, item) => sum + item.readyDraftCount, 0),
    queueLength: queue.length,
    promoteQueueLength: promoteQueue.length,
    queue,
    promoteQueue,
  };
}

export function buildWorldYiPublicationLaneSummaries(entries: ManagedContentEntry[]) {
  return laneConfigs.map((config) => buildWorldYiPublicationLaneSummary(entries, config));
}

export function getWorldYiPublicationReserveFloor() {
  const configured = Number((publicationProgram.expansionRules || {}).minQueuedTargetsPerLane || 3);
  return Math.max(1, Number.isFinite(configured) ? configured : 3);
}

export function buildWorldYiPublicationReserveSignal(lanes: PublicationLaneSummary[]) {
  const minQueuedTargetsPerLane = getWorldYiPublicationReserveFloor();
  const queuedTargetsPerLane = lanes.reduce((accumulator, lane) => {
    accumulator[lane.key] = lane.queueLength + lane.promoteQueueLength;
    return accumulator;
  }, {} as Record<LaneKey, number>);
  const weakLaneKeys = lanes
    .filter((lane) => queuedTargetsPerLane[lane.key] < minQueuedTargetsPerLane)
    .map((lane) => lane.key);

  return {
    minQueuedTargetsPerLane,
    queuedTargetsPerLane,
    weakLaneKeys,
  };
}

export function findWorldYiLaneCoverageRow(params: {
  lanes: PublicationLaneSummary[];
  sourceType?: string | null;
  growthPlanKey?: string | null;
}) {
  if (!params.sourceType || !params.growthPlanKey) {
    return null;
  }

  const laneConfig = getWorldYiPublicationLaneConfigBySourceType(params.sourceType);
  if (!laneConfig) {
    return null;
  }

  const lane = params.lanes.find((item) => item.key === laneConfig.key);
  if (!lane) {
    return null;
  }

  const queueRow = lane.queue.find((item) => item.key === params.growthPlanKey) || null;
  const promoteRow = lane.promoteQueue.find((item) => item.key === params.growthPlanKey) || null;

  return {
    lane,
    laneConfig,
    queueRow,
    promoteRow,
  };
}
