import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import {
  getCoreReferenceSourcePresets,
  getDomainSourcePresets,
  type DomainKey,
  type DomainSourcePreset,
} from '@/lib/domain-source-presets';
import {
  sourceDocumentOperations,
  type SourceDocumentRecord,
  type UpsertSourceDocumentInput,
} from '@/lib/knowledge-base-store';

function mapPresetToSourceDocumentInput(preset: DomainSourcePreset): UpsertSourceDocumentInput {
  return {
    sourceType: preset.method === 'rss' ? 'rss' : preset.method === 'manual' ? 'manual' : 'site',
    platform: preset.platform,
    sourceId: preset.id,
    canonicalUrl: preset.url,
    title: preset.label,
    language: 'zh-CN',
    summary: [
      ...preset.acquisitionGoal,
      ...preset.extractionTargets,
      preset.notes,
    ].filter(Boolean).join(' | '),
    tags: [
      preset.domain,
      preset.tier,
      preset.role,
      preset.productFit,
      ...preset.acquisitionGoal,
      ...preset.relatedUseCases,
      ...preset.extractionTargets,
    ],
    rightsStatus: preset.rightsStatus,
    reusePolicy: preset.role === 'authority' || preset.role === 'catalog'
      ? 'review-before-publish'
      : 'summary-only',
    rawMeta: {
      presetId: preset.id,
      domain: preset.domain,
      tier: preset.tier,
      role: preset.role,
      method: preset.method,
      productFit: preset.productFit,
      productRelevance: preset.productRelevance,
      relatedUseCases: preset.relatedUseCases,
      acquisitionGoal: preset.acquisitionGoal,
      extractionTargets: preset.extractionTargets,
      fitNotes: preset.fitNotes,
    },
  };
}

export function buildDomainSourceDocumentInputs(domain: DomainKey): UpsertSourceDocumentInput[] {
  return getDomainSourcePresets(domain).map(mapPresetToSourceDocumentInput);
}

export function buildCoreReferenceSourceDocumentInputs(limit?: number): UpsertSourceDocumentInput[] {
  return getCoreReferenceSourcePresets(limit).map(mapPresetToSourceDocumentInput);
}

export function seedDomainSourcesToKnowledgeBase(
  domain: DomainKey,
  database: Database.Database = db
): SourceDocumentRecord[] {
  return buildDomainSourceDocumentInputs(domain)
    .map((input) => sourceDocumentOperations.upsert(database, input))
    .filter((item): item is SourceDocumentRecord => !!item);
}

export function seedCoreReferenceSourcesToKnowledgeBase(
  database: Database.Database = db,
  limit?: number
): SourceDocumentRecord[] {
  return buildCoreReferenceSourceDocumentInputs(limit)
    .map((input) => sourceDocumentOperations.upsert(database, input))
    .filter((item): item is SourceDocumentRecord => !!item);
}

export function buildDomainAcquisitionBacklog(domain: DomainKey) {
  const presets = getDomainSourcePresets(domain);
  return {
    domain,
    totalSources: presets.length,
    byTier: {
      P0: presets.filter((item) => item.tier === 'P0'),
      P1: presets.filter((item) => item.tier === 'P1'),
      P2: presets.filter((item) => item.tier === 'P2'),
      P3: presets.filter((item) => item.tier === 'P3'),
    },
  };
}
