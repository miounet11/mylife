import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import {
  DOMAIN_KNOWLEDGE_CHAINS,
  getDomainKnowledgeChain,
  getDomainSourcePresets,
  getProductRelevantSourcePresets,
  type AcquisitionTier,
  type DomainKey,
  type DomainKnowledgeChain,
  type DomainSourcePreset,
} from '@/lib/domain-source-presets';
import {
  buildCoreReferenceSourceDocumentInputs,
  buildDomainAcquisitionBacklog,
  seedCoreReferenceSourcesToKnowledgeBase,
  seedDomainSourcesToKnowledgeBase,
} from '@/lib/domain-source-ingestion';
import { sourceDocumentOperations, type SourceDocumentRecord } from '@/lib/knowledge-base-store';

export interface PlannedSourceStatus {
  presetId: string;
  label: string;
  domain: DomainKey;
  tier: AcquisitionTier;
  productFit: DomainSourcePreset['productFit'];
  productRelevance: number;
  rightsStatus: DomainSourcePreset['rightsStatus'];
  canonicalUrl: string;
  alreadySeeded: boolean;
}

export interface DomainAcquisitionPlan {
  domain: DomainKey;
  title: string;
  priorityScore: number;
  productRelevanceAverage: number;
  totalSources: number;
  seededSources: number;
  unseededSources: number;
  coreSourceCount: number;
  exploratorySourceCount: number;
  byTier: Record<AcquisitionTier, number>;
  primaryGoals: string[];
  coreObjects: string[];
  recommendedActions: string[];
  nextWaveSources: PlannedSourceStatus[];
}

export interface CoreReferenceSeedPlan {
  totalPlanned: number;
  alreadySeeded: number;
  missingCount: number;
  domains: Array<{
    domain: DomainKey;
    count: number;
  }>;
  rightsSummary: Record<string, number>;
  nextWaveSources: PlannedSourceStatus[];
}

export interface KnowledgeSourceOperationsResult {
  mode: 'core' | 'domain';
  domain?: DomainKey;
  insertedOrUpdated: number;
  sourceIds: string[];
  recentDocuments: SourceDocumentRecord[];
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function buildSeededUrlSet(database: Database.Database) {
  return new Set(
    sourceDocumentOperations
      .list(database, { limit: 2000 })
      .map((item) => item.canonicalUrl)
  );
}

function buildPresetStatus(preset: DomainSourcePreset, seededUrls: Set<string>): PlannedSourceStatus {
  return {
    presetId: preset.id,
    label: preset.label,
    domain: preset.domain,
    tier: preset.tier,
    productFit: preset.productFit,
    productRelevance: preset.productRelevance,
    rightsStatus: preset.rightsStatus,
    canonicalUrl: preset.url,
    alreadySeeded: seededUrls.has(preset.url),
  };
}

function buildRecommendedActions(chain: DomainKnowledgeChain, presets: DomainSourcePreset[]) {
  const p0Count = presets.filter((item) => item.tier === 'P0').length;
  const p2Count = presets.filter((item) => item.tier === 'P2').length;
  const communityCount = presets.filter((item) => item.role === 'community').length;

  return [
    `先完成 ${p0Count} 个 P0 骨架源的索引和权限标注，再扩到书目与问题层。`,
    `围绕 ${chain.primaryGoals.slice(0, 2).join('、')} 建第一批知识对象，避免只做链接堆积。`,
    p2Count || communityCount
      ? `把 ${Math.max(p2Count, communityCount)} 个社区 / 平台源作为问题发现层，只保留摘要、标签和问题映射。`
      : '当前优先做高权威和目录型来源，暂不需要平台问题层扩张。',
  ];
}

export function buildDomainAcquisitionPlans(
  params?: {
    domains?: DomainKey[];
    nextWaveLimit?: number;
  },
  database: Database.Database = db
) {
  const domains = params?.domains || DOMAIN_KNOWLEDGE_CHAINS.map((item) => item.domain);
  const nextWaveLimit = params?.nextWaveLimit ?? 4;
  const seededUrls = buildSeededUrlSet(database);

  return domains
    .map((domain) => {
      const chain = getDomainKnowledgeChain(domain);
      const presets = getDomainSourcePresets(domain);
      const backlog = buildDomainAcquisitionBacklog(domain);

      if (!chain) {
        return null;
      }

      const totalRelevance = presets.reduce((sum, item) => sum + item.productRelevance, 0);
      const sourceStatuses = presets.map((item) => buildPresetStatus(item, seededUrls));
      const seededSources = sourceStatuses.filter((item) => item.alreadySeeded).length;
      const priorityScore = round(
        totalRelevance / Math.max(1, presets.length) + chain.primaryGoals.length * 2 + backlog.byTier.P0.length * 2.5
      );

      return {
        domain,
        title: chain.title,
        priorityScore,
        productRelevanceAverage: round(totalRelevance / Math.max(1, presets.length)),
        totalSources: presets.length,
        seededSources,
        unseededSources: presets.length - seededSources,
        coreSourceCount: presets.filter((item) => item.productFit === 'core').length,
        exploratorySourceCount: presets.filter((item) => item.productFit === 'exploratory').length,
        byTier: {
          P0: backlog.byTier.P0.length,
          P1: backlog.byTier.P1.length,
          P2: backlog.byTier.P2.length,
          P3: backlog.byTier.P3.length,
        },
        primaryGoals: chain.primaryGoals,
        coreObjects: chain.coreObjects,
        recommendedActions: buildRecommendedActions(chain, presets),
        nextWaveSources: sourceStatuses
          .filter((item) => !item.alreadySeeded)
          .slice(0, nextWaveLimit),
      } satisfies DomainAcquisitionPlan;
    })
    .filter((item): item is DomainAcquisitionPlan => !!item)
    .sort((left, right) => right.priorityScore - left.priorityScore || left.domain.localeCompare(right.domain));
}

export function buildCoreReferenceSeedPlan(
  params?: {
    limit?: number;
    minRelevance?: number;
  },
  database: Database.Database = db
): CoreReferenceSeedPlan {
  const limit = params?.limit ?? 18;
  const minRelevance = params?.minRelevance ?? 72;
  const presets = getProductRelevantSourcePresets({
    minRelevance,
    includeExploratory: false,
    limit,
  });
  const seededUrls = buildSeededUrlSet(database);
  const statuses = presets.map((item) => buildPresetStatus(item, seededUrls));

  return {
    totalPlanned: statuses.length,
    alreadySeeded: statuses.filter((item) => item.alreadySeeded).length,
    missingCount: statuses.filter((item) => !item.alreadySeeded).length,
    domains: [...new Set(statuses.map((item) => item.domain))]
      .map((domain) => ({
        domain,
        count: statuses.filter((item) => item.domain === domain).length,
      }))
      .sort((left, right) => right.count - left.count || left.domain.localeCompare(right.domain)),
    rightsSummary: statuses.reduce<Record<string, number>>((acc, item) => {
      acc[item.rightsStatus] = (acc[item.rightsStatus] || 0) + 1;
      return acc;
    }, {}),
    nextWaveSources: statuses,
  };
}

export function seedKnowledgeSourcePlans(
  params: {
    mode: 'core' | 'domain';
    domain?: DomainKey;
    limit?: number;
  },
  database: Database.Database = db
): KnowledgeSourceOperationsResult {
  const seeded = params.mode === 'domain' && params.domain
    ? seedDomainSourcesToKnowledgeBase(params.domain, database)
    : seedCoreReferenceSourcesToKnowledgeBase(database, params.limit);

  return {
    mode: params.mode,
    domain: params.mode === 'domain' ? params.domain : undefined,
    insertedOrUpdated: seeded.length,
    sourceIds: seeded.map((item) => item.sourceId || item.id).filter(Boolean) as string[],
    recentDocuments: seeded.slice(0, 12),
  };
}

export function previewCoreReferenceSeedInputs(limit?: number) {
  return buildCoreReferenceSourceDocumentInputs(limit).map((item) => ({
    sourceId: item.sourceId || '',
    title: item.title,
    platform: item.platform,
    canonicalUrl: item.canonicalUrl,
    rightsStatus: item.rightsStatus,
    reusePolicy: item.reusePolicy || null,
    tags: item.tags || [],
  }));
}

export function listRecentlySeededKnowledgeSources(
  params?: {
    limit?: number;
  },
  database: Database.Database = db
) {
  return sourceDocumentOperations.list(database, { limit: params?.limit ?? 20 });
}
