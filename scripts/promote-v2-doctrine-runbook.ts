#!/usr/bin/env tsx
/**
 * Promote recent high-rubric World Yi v2 doctrine drafts through the managed
 * content store so publication metadata, journey enrichment, and caches stay coherent.
 *
 * Run via: npx tsx scripts/promote-v2-doctrine-runbook.ts
 */

import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';

function readOverallScore(entry: ManagedContentEntry): number {
  const score = entry.meta?.qualityRubricScores;
  if (!score || typeof score !== 'object' || Array.isArray(score)) {
    return 0;
  }

  const overall = (score as Record<string, unknown>).overall;
  return typeof overall === 'number' && Number.isFinite(overall) ? overall : 0;
}

function isCoreP0Topic(entry: ManagedContentEntry): boolean {
  const signal = `${entry.slug} ${entry.title}`;
  return /易学核心机理|决策时序|64卦|变易判断|大运叠加|四柱-易学复合/.test(signal);
}

function isRecent(entry: ManagedContentEntry): boolean {
  const updatedAt = new Date(entry.updatedAt).getTime();
  return Number.isFinite(updatedAt) && updatedAt > Date.now() - 1000 * 60 * 60 * 6;
}

function buildPromotionMeta(entry: ManagedContentEntry) {
  const now = new Date();
  const safePast = new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString();
  const meta = {
    ...(entry.meta || {}),
    schedulePublishedAt: safePast,
    publicationReady: true,
    v2ElevationPass: true,
    lastPromotedAt: now.toISOString(),
    promotionRunbook: 'doctrine-spine-p0-2026-05-31',
  } as Record<string, unknown>;

  if (typeof meta.worldYiLayer !== 'string' || !meta.worldYiLayer.trim()) {
    meta.worldYiLayer = 'doctrine-core';
  }
  if (!Array.isArray(meta.feedsAgentModules) || meta.feedsAgentModules.length === 0) {
    meta.feedsAgentModules = [
      'core_constitution',
      'temporal_spatial_advisor',
      'strategy_advisor',
      'kline_narrative',
    ];
  }

  return meta;
}

function main() {
  const candidates = listManagedContentEntries()
    .filter((entry) => (
      entry.contentType === 'knowledge' &&
      (
        entry.slug.includes('world-yi-') ||
        entry.slug.includes('v2') ||
        entry.title.includes('易学核心机理')
      )
    ))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 40);

  let promoted = 0;
  const promotedSlugs: string[] = [];

  for (const entry of candidates) {
    const overall = readOverallScore(entry);
    if (!isRecent(entry) || (overall < 82 && !isCoreP0Topic(entry))) {
      continue;
    }

    const saved = saveManagedContentEntry({
      id: entry.id,
      contentType: entry.contentType,
      subtype: entry.subtype,
      slug: entry.slug,
      title: entry.title,
      name: entry.name,
      excerpt: entry.excerpt,
      category: entry.category,
      readTime: entry.readTime,
      tags: entry.tags,
      featured: entry.featured,
      seoTitle: entry.seoTitle,
      seoDescription: entry.seoDescription,
      sections: entry.sections,
      status: 'published',
      source: entry.source,
      createdBy: entry.createdBy,
      updatedBy: 'system:doctrine-promotion',
      meta: buildPromotionMeta(entry),
    }, 'system:doctrine-promotion');

    if (saved) {
      promoted += 1;
      promotedSlugs.push(saved.slug);
      console.log(`Promoted: ${saved.slug} (overall=${overall || 'n/a'})`);
    }
  }

  console.log(`Promotion complete: ${promoted} entries updated`);
  if (promotedSlugs.length) {
    console.log(`Promoted slugs: ${promotedSlugs.slice(0, 8).join(', ')}`);
  }
}

main();
