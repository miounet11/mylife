/**
 * Async Redis-backed wrappers for heavy content-store queries.
 * Use these in page components for automatic Redis caching.
 *
 * TTL: 300s (WARM) for lists that change slowly.
 * Invalidation: call invalidateContentCache() after content writes.
 */

import { cacheWithRedis, CacheTTL, invalidateCache } from "./redis-cache";
import {
  getKnowledgeArticles,
  getCaseStudies,
  getEntityInsights,
  getFeaturedKnowledgeArticles,
  getFeaturedCaseStudies,
  getFeaturedEntityInsights,
  getKnowledgeArticleBySlug,
  getCaseStudyBySlug,
  getEntityInsightByTypeAndSlug,
} from "./content-store";

// ── Knowledge ──────────────────────────────────────────────

export async function getKnowledgeArticlesCached() {
  return cacheWithRedis("query:knowledge:articles", CacheTTL.WARM, async () =>
    getKnowledgeArticles()
  );
}

export async function getFeaturedKnowledgeArticlesCached(limit = 3) {
  return cacheWithRedis(`query:knowledge:featured:${limit}`, CacheTTL.COLD, async () =>
    getFeaturedKnowledgeArticles(limit)
  );
}

export async function getKnowledgeArticleBySlugCached(slug: string) {
  return cacheWithRedis(`query:knowledge:slug:${slug}`, CacheTTL.COLD, async () =>
    getKnowledgeArticleBySlug(slug)
  );
}

// ── Cases ──────────────────────────────────────────────────

export async function getCaseStudiesCached() {
  return cacheWithRedis("query:cases:all", CacheTTL.WARM, async () =>
    getCaseStudies()
  );
}

export async function getFeaturedCaseStudiesCached(limit = 2) {
  return cacheWithRedis(`query:cases:featured:${limit}`, CacheTTL.COLD, async () =>
    getFeaturedCaseStudies(limit)
  );
}

export async function getCaseStudyBySlugCached(slug: string) {
  return cacheWithRedis(`query:case:slug:${slug}`, CacheTTL.COLD, async () =>
    getCaseStudyBySlug(slug)
  );
}

// ── Insights ───────────────────────────────────────────────

export async function getEntityInsightsCached() {
  return cacheWithRedis("query:insights:all", CacheTTL.WARM, async () =>
    getEntityInsights()
  );
}

export async function getFeaturedEntityInsightsCached(limit = 3) {
  return cacheWithRedis(`query:insights:featured:${limit}`, CacheTTL.COLD, async () =>
    getFeaturedEntityInsights(limit)
  );
}

export async function getEntityInsightByTypeAndSlugCached(type: string, slug: string) {
  return cacheWithRedis(`query:insight:${type}:${slug}`, CacheTTL.COLD, async () =>
    getEntityInsightByTypeAndSlug(type, slug)
  );
}

// ── Invalidation ───────────────────────────────────────────

export async function invalidateContentCache(): Promise<void> {
  await invalidateCache("query:knowledge:*");
  await invalidateCache("query:cases:*");
  await invalidateCache("query:insights:*");
}
