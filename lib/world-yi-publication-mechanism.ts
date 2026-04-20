import publicationProgram from '@/data/world-yi-publication-program.json';
import { getContentSchedulerOverview } from '@/lib/content-ops';
import { listManagedContentEntries, type ManagedContentEntry, type ManagedContentType } from '@/lib/content-store';
import {
  buildWorldYiPublicationLaneSummaries,
  buildWorldYiPublicationReserveSignal,
  getWorldYiPublicationLaneConfigByKey,
  getWorldYiPublicationReserveFloor,
  type LaneKey,
  type PublicationLaneCoverageRow,
  type PublicationLaneSummary,
  type SourceType,
} from '@/lib/world-yi-publication-lanes';
import { buildWorldYiAutoresearchSnapshot } from '@/lib/world-yi-autoresearch';

export interface PublicationLogicLayer {
  key: string;
  title: string;
  description: string;
}

export interface PublicationPlanSlot {
  slot: number;
  lane: LaneKey;
  laneLabel: string;
  sourceType: SourceType;
  targetKey: string;
  title: string;
  contentType: ManagedContentType;
  locale: string;
  market: string;
  intent: 'traffic-capture' | 'judgment-education' | 'decision-conversion';
  action: 'generate' | 'promote';
  priorityScore: number;
  rationale: string;
}

export interface PublicationExpansionSignal {
  mode: 'gap-fill' | 'evergreen-expansion';
  shouldExpand: boolean;
  weakestMetrics: string[];
  weakMetricKeys: string[];
  weakLaneKeys: LaneKey[];
  minQueuedTargetsPerLane: number;
  queuedTargetsPerLane: Record<LaneKey, number>;
  reasons: string[];
}

export interface WorldYiPublicationMechanismSnapshot {
  checkedAt: string;
  logicLayers: PublicationLogicLayer[];
  weeklySlots: number;
  laneQuotas: Record<LaneKey, number>;
  contentTypeMix: Record<ManagedContentType, number>;
  expansion: PublicationExpansionSignal;
  scheduler: ReturnType<typeof getContentSchedulerOverview>;
  autoresearch: ReturnType<typeof buildWorldYiAutoresearchSnapshot>;
  lanes: PublicationLaneSummary[];
  nextSlots: PublicationPlanSlot[];
}

export interface BuildWorldYiPublicationMechanismOptions {
  entries?: ManagedContentEntry[];
}

function inferIntent(contentType: ManagedContentType): PublicationPlanSlot['intent'] {
  if (contentType === 'case') {
    return 'decision-conversion';
  }
  if (contentType === 'knowledge') {
    return 'traffic-capture';
  }
  return 'judgment-education';
}

function buildRationale(row: PublicationLaneCoverageRow, action: PublicationPlanSlot['action']) {
  if (action === 'promote') {
    return `${row.title} 已有可发布草稿，应优先转成公开页面，避免流量位空转。`;
  }

  return `${row.market} 的公开流量位仍缺内容，应先补 ${row.primaryType}，把现实问题转成世界易判断入口。`;
}

function buildNextSlots(lanes: PublicationLaneSummary[]) {
  const laneQuotas = publicationProgram.laneQuotas as Record<LaneKey, number>;
  const slots: PublicationPlanSlot[] = [];
  let slot = 1;

  for (const lane of lanes) {
    const quota = laneQuotas[lane.key] || 0;
    const promoteRows = lane.promoteQueue.slice(0, quota);
    const generateRows = lane.queue
      .filter((row) => !promoteRows.some((item) => item.key === row.key))
      .slice(0, Math.max(0, quota - promoteRows.length));
    const selected = [
      ...promoteRows.map((row) => ({ row, action: 'promote' as const })),
      ...generateRows.map((row) => ({ row, action: 'generate' as const })),
    ];

    for (const item of selected) {
      const laneConfig = getWorldYiPublicationLaneConfigByKey(lane.key);
      slots.push({
        slot,
        lane: lane.key,
        laneLabel: lane.label,
        sourceType: laneConfig?.sourceType || 'public-growth',
        targetKey: item.row.key,
        title: item.row.title,
        contentType: item.row.primaryType,
        locale: item.row.locale,
        market: item.row.market,
        intent: inferIntent(item.row.primaryType),
        action: item.action,
        priorityScore: item.row.priorityScore,
        rationale: buildRationale(item.row, item.action),
      });
      slot += 1;
    }
  }

  return slots;
}

function buildExpansionSignal(
  lanes: PublicationLaneSummary[],
  autoresearch: ReturnType<typeof buildWorldYiAutoresearchSnapshot>
): PublicationExpansionSignal {
  const expansionRules = (publicationProgram.expansionRules || {}) as {
    expandWhenMetricBelow?: Record<string, number>;
    minQueuedTargetsPerLane?: number;
    targetMode?: 'evergreen-expansion';
  };
  const metricThresholds = expansionRules.expandWhenMetricBelow || {};
  const weakMetrics = autoresearch.metrics.filter((metric) => (
    typeof metricThresholds[metric.key] === 'number' && metric.ratio < metricThresholds[metric.key]
  ));
  const reserveSignal = buildWorldYiPublicationReserveSignal(lanes);
  const minQueuedTargetsPerLane = getWorldYiPublicationReserveFloor();
  const queuedTargetsPerLane = reserveSignal.queuedTargetsPerLane;
  const weakLaneKeys = reserveSignal.weakLaneKeys;
  const shouldExpand = weakMetrics.length > 0 || weakLaneKeys.length > 0;
  const reasons: string[] = [];

  if (weakMetrics.length > 0) {
    reasons.push(`autoresearch weak metrics: ${weakMetrics.map((metric) => metric.label).join(', ')}`);
  }
  if (weakLaneKeys.length > 0) {
    reasons.push(`queued targets below reserve floor in lanes: ${weakLaneKeys.join(', ')}`);
  }

  return {
    mode: shouldExpand ? 'evergreen-expansion' : 'gap-fill',
    shouldExpand,
    weakestMetrics: weakMetrics.map((metric) => `${metric.label} (${metric.points}/${metric.maxPoints})`),
    weakMetricKeys: weakMetrics.map((metric) => metric.key),
    weakLaneKeys,
    minQueuedTargetsPerLane,
    queuedTargetsPerLane,
    reasons,
  };
}

export function buildWorldYiPublicationMechanismSnapshot(
  options: BuildWorldYiPublicationMechanismOptions = {}
): WorldYiPublicationMechanismSnapshot {
  const entries = options.entries || listManagedContentEntries();
  const lanes = buildWorldYiPublicationLaneSummaries(entries);
  const autoresearch = buildWorldYiAutoresearchSnapshot({ entries });

  return {
    checkedAt: new Date().toISOString(),
    logicLayers: (publicationProgram.logicLayers || []) as PublicationLogicLayer[],
    weeklySlots: publicationProgram.weeklySlots,
    laneQuotas: publicationProgram.laneQuotas as Record<LaneKey, number>,
    contentTypeMix: publicationProgram.contentTypeMix as Record<ManagedContentType, number>,
    expansion: buildExpansionSignal(lanes, autoresearch),
    scheduler: getContentSchedulerOverview(),
    autoresearch,
    lanes,
    nextSlots: buildNextSlots(lanes),
  };
}
