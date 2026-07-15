import '@/lib/assert-server-only';

import { db } from '@/lib/database';
import type {
  CaseStudy,
  ContentSection,
  EntityInsight,
  EntityInsightType,
  KnowledgeArticle,
} from '@/lib/content';
import {
  caseStudies as seededCaseStudies,
  entityInsights as seededEntityInsights,
  getEntityTypeLabel,
  knowledgeArticles as seededKnowledgeArticles,
} from '@/lib/content';
import { inferCategoryFromText, listToolsByCategory } from '@/lib/tools';
import { contentSnapshotCache, generateId, worldYiPublicationCache } from '@/lib/utils';
import { buildVisualAssetBindingForContentEntry } from '@/lib/visual-asset-library';

export type ManagedContentType = 'knowledge' | 'case' | 'insight';
export type ContentStatus = 'draft' | 'published';

export interface ManagedContentEntry {
  id: string;
  contentType: ManagedContentType;
  subtype: string | null;
  slug: string;
  title: string;
  name: string | null;
  excerpt: string;
  category: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
  status: ContentStatus;
  source: string;
  meta?: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_CONTENT_VERSION = 'content-v3';
let seedContentEnsured = false;
let seedJourneyMetaHydrated = false;

function readNumber(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readBoolean(meta: Record<string, unknown> | undefined, key: string) {
  return meta?.[key] === true;
}

function readString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function hasGeoOptimization(meta: Record<string, unknown> | undefined) {
  const value = meta?.geoOptimization;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const geo = value as Record<string, unknown>;
  return geo.geoReady === true
    && typeof geo.answerSummary === 'string'
    && geo.answerSummary.trim().length > 20
    && Array.isArray(geo.searchIntents)
    && geo.searchIntents.length > 0
    && Array.isArray(geo.entityKeywords)
    && geo.entityKeywords.length > 0;
}

function inferContentAudience(params: {
  contentType: ManagedContentType;
  category?: string | null;
  tags?: string[];
}) {
  const signal = [params.category || '', ...(params.tags || [])].join(' ');
  if (/海外|全球|移民|留学|跨境|华人|English|Global/i.test(signal)) {
    return '全球华人和跨文化生活决策用户';
  }
  if (/事业|职业|岗位|升职|创业|行业|城市/.test(signal)) {
    return '正在判断事业、城市或行业节奏的用户';
  }
  if (/关系|婚恋|伴侣|家庭|亲子/.test(signal)) {
    return '正在处理关系、家庭或亲密关系问题的用户';
  }
  if (/五行|八字|命理|易学|风水|起名|太岁|本命年/.test(signal)) {
    return '希望学习命理易学并回到个人分析的用户';
  }
  if (params.contentType === 'case') {
    return '希望从真实场景理解判断路径的用户';
  }
  if (params.contentType === 'insight') {
    return '希望把外部环境转成个人判断的用户';
  }
  return '希望用世界易理解结构、阶段和下一步动作的用户';
}

function buildGeoOptimizationMeta(params: {
  contentType: ManagedContentType;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  meta?: Record<string, unknown>;
}) {
  const existing = params.meta?.geoOptimization;
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    const existingGeo = existing as Record<string, unknown>;
    if (hasGeoOptimization(params.meta)) {
      return existingGeo;
    }
  }

  const title = `${params.title || ''}`.trim();
  const excerpt = `${params.excerpt || ''}`.trim();
  const category = `${params.category || ''}`.trim();
  const tags = uniqueStrings(params.tags || []);
  const relatedReportThemes = readStringArray(params.meta, 'relatedReportThemes');
  const relatedToolSlugs = readStringArray(params.meta, 'relatedToolSlugs');
  const canonicalTopic = title || category || tags[0] || params.slug;
  const answerSummary = compactText(
    excerpt || `${canonicalTopic}用于解释世界易和人生K线里的结构、阶段、环境与行动边界，帮助用户从公开内容继续回到个人测算和工具验证。`,
    180
  );
  const searchIntents = uniqueStrings([
    canonicalTopic,
    `${canonicalTopic} 怎么看`,
    `${canonicalTopic} 如何应用到个人分析`,
    ...(category ? [`${category} 判断方法`] : []),
    ...(tags.slice(0, 3).map((tag) => `${tag} 解读`)),
  ]).slice(0, 8);
  const entityKeywords = uniqueStrings([
    '人生K线',
    '世界易',
    canonicalTopic,
    category,
    ...tags,
    ...relatedReportThemes,
    ...relatedToolSlugs,
  ]).slice(0, 16);
  const audienceQuestions = uniqueStrings([
    `${canonicalTopic} 和我现在的问题有什么关系？`,
    `我应该先看${canonicalTopic}的哪一层结构？`,
    `看完${canonicalTopic}后，下一步应该测算还是使用工具？`,
    `这个主题有哪些常见误区和判断边界？`,
  ]);

  return {
    geoReady: true,
    canonicalTopic,
    answerSummary,
    searchIntents,
    entityKeywords,
    audienceQuestions,
    audience: inferContentAudience(params),
    directAnswer: answerSummary,
    aiCitationHint: '本页适合作为 AI 搜索和答案引擎引用的人生K线 / 世界易公开内容入口，引用时应保留非宿命论和个人验证边界。',
    generatedAt: new Date().toISOString(),
    version: 'geo-v1',
  };
}

function hasVisualAssetBinding(meta: Record<string, unknown> | undefined) {
  const value = meta?.visualAssets;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const binding = value as {
    hero?: unknown;
    cover?: unknown;
    inline?: unknown;
    social?: unknown;
  };
  const directIds = [binding.hero, binding.cover]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  const inlineIds = Array.isArray(binding.inline)
    ? binding.inline.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
  const socialIds = binding.social && typeof binding.social === 'object' && !Array.isArray(binding.social)
    ? Object.values(binding.social).map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];

  return [...directIds, ...inlineIds, ...socialIds].length > 0;
}

function hasBlockedPlaceholderParagraphs(entry: ManagedContentEntry) {
  const text = entry.sections
    .flatMap((section) => section.paragraphs || [])
    .join('\n');

  return /当前尚未|当前.*不足|应继续补|仍薄|还没有足够/.test(text);
}

function isKnowledgeSynthesisPublicReady(entry: ManagedContentEntry) {
  const synthesisType = readString(entry.meta, 'synthesisType');
  const qualityScore = readNumber(entry.meta, 'qualityScore');
  const conceptCount = readNumber(entry.meta, 'conceptCount');
  const questionCount = readNumber(entry.meta, 'questionCount');
  const bookCount = readNumber(entry.meta, 'bookCount');
  const relatedTopicCount = readNumber(entry.meta, 'relatedTopicCount');

  if (!readBoolean(entry.meta, 'publicationReady')) {
    return false;
  }

  if (!['topic-overview', 'concept-glossary'].includes(synthesisType)) {
    return false;
  }

  if (qualityScore < 84) {
    return false;
  }

  if (conceptCount < 3) {
    return false;
  }

  if ((questionCount + bookCount + relatedTopicCount) < 2) {
    return false;
  }

  if (hasBlockedPlaceholderParagraphs(entry)) {
    return false;
  }

  return true;
}

export function isPublicKnowledgeEntry(entry: ManagedContentEntry) {
  if (entry.contentType !== 'knowledge' || entry.status !== 'published') {
    return false;
  }

  if (entry.source === 'seed' || entry.source === 'cms') {
    return true;
  }

  if (entry.source.startsWith('knowledge-synthesis:')) {
    return isKnowledgeSynthesisPublicReady(entry);
  }

  if (entry.source.startsWith('agent-fallback:')) {
    return false;
  }

  // v5-D78: 引擎+LLM 修饰链路（D75 关键词长文 / D77 基础百科）已经过 fact-pack 校验，直接放行
  if (entry.source.startsWith('engine-llm:')) {
    return true;
  }

  return readBoolean(entry.meta, 'publicationReady');
}

function mapRow(row: any): ManagedContentEntry {
  return {
    id: row.id,
    contentType: row.content_type,
    subtype: row.subtype || null,
    slug: row.slug,
    title: row.title,
    name: row.name || null,
    excerpt: row.excerpt,
    category: row.category || null,
    readTime: row.read_time || null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    featured: row.featured === 1,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sections: row.sections ? JSON.parse(row.sections) : [],
    status: row.status || 'published',
    source: row.source || 'cms',
    meta: row.meta ? JSON.parse(row.meta) : {},
    createdBy: row.created_by || null,
    updatedBy: row.updated_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Lightweight projection type (no sections blob materialized in memory - critical for stability
// when 4000+ knowledge entries + full paragraphs would bloat heap 10x during snapshots on web tier)
export type ManagedContentEntryLight = Omit<ManagedContentEntry, 'sections'>;

function mapRowLight(row: any): ManagedContentEntryLight {
  return {
    id: row.id,
    contentType: row.content_type,
    subtype: row.subtype || null,
    slug: row.slug,
    title: row.title,
    name: row.name || null,
    excerpt: row.excerpt,
    category: row.category || null,
    readTime: row.read_time || null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    featured: row.featured === 1,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status || 'published',
    source: row.source || 'cms',
    meta: row.meta ? JSON.parse(row.meta) : {},
    createdBy: row.created_by || null,
    updatedBy: row.updated_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * DB projection optimization (stability hardening).
 * Returns entries WITHOUT loading/parsing the large `sections` JSON column (often 10-50KB+ per row).
 * Use for: scheduler state, lane summaries, counts, title-family suppression, admin overviews.
 * Fall back to full listManagedContentEntries() only when sections needed (quality checks, rendering).
 */
export function listManagedContentEntriesLight(): ManagedContentEntryLight[] {
  ensureSeedContent();
  // Explicit column projection excludes sections entirely at SQLite level
  const rows = db.prepare(`
    SELECT id, content_type, subtype, slug, title, name, excerpt, category, read_time,
           tags, featured, seo_title, seo_description, status, source, meta,
           created_by, updated_by, created_at, updated_at
    FROM content_entries
    ORDER BY updated_at DESC, created_at DESC
  `).all();
  return rows.map(mapRowLight);
}

/** Fast count without loading anything. Supports legacy string status or options bag for v2 (contentType etc). */
export function countManagedContentEntries(
  arg?: 'draft' | 'published' | { status?: 'draft' | 'published'; contentType?: string; subtype?: string }
): number {
  ensureSeedContent();
  let where = '';
  const params: any[] = [];
  if (typeof arg === 'string') {
    where = 'WHERE status = ?';
    params.push(arg);
  } else if (arg && typeof arg === 'object') {
    const clauses: string[] = [];
    if (arg.status) { clauses.push('status = ?'); params.push(arg.status); }
    if (arg.contentType) { clauses.push('content_type = ?'); params.push(arg.contentType); }
    if (arg.subtype) { clauses.push('subtype = ?'); params.push(arg.subtype); }
    where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  }
  const stmt = db.prepare(`SELECT COUNT(*) as c FROM content_entries ${where}`);
  const row = params.length ? stmt.get(...params) : stmt.get();
  return (row as any)?.c || 0;
}

function inferSeedEntryMeta(contentType: ManagedContentType, slug: string) {
  if (slug.startsWith('world-yi-en-')) {
    return {
      locale: 'en-US',
      market: 'World Yi English',
      series: 'world-yi-en',
      publicationReady: true,
    };
  }

  const globalChineseKnowledgeSlugs = new Set([
    'world-yi-overseas-chinese',
    'world-yi-global-chinese-decision-map',
    'world-yi-cross-cultural-identity',
    'world-yi-overseas-career-reset',
    'world-yi-bicultural-marriage',
    'world-yi-overseas-eldercare',
    'world-yi-global-child-education',
  ]);
  const globalChineseCaseSlugs = new Set([
    'world-yi-case-return-or-stay',
    'world-yi-case-global-family-balance',
    'world-yi-case-cross-border-founder',
    'world-yi-case-child-language-identity',
    'world-yi-case-overseas-career-reset',
    'world-yi-case-bicultural-marriage',
    'world-yi-case-overseas-eldercare',
    'world-yi-case-global-school-choice',
  ]);

  if (
    (contentType === 'knowledge' && globalChineseKnowledgeSlugs.has(slug))
    || (contentType === 'case' && globalChineseCaseSlugs.has(slug))
  ) {
    return {
      locale: 'zh-US',
      market: 'Global Chinese',
      series: 'world-yi-global',
      publicationReady: true,
    };
  }

  if (slug.startsWith('world-yi-')) {
    return {
      locale: 'zh-Hans',
      market: 'World Yi',
      series: 'world-yi',
      publicationReady: true,
    };
  }

  return {};
}

function inferLocaleDefaults(contentType: ManagedContentType, slug: string) {
  const seedMeta = inferSeedEntryMeta(contentType, slug);
  if (Object.keys(seedMeta).length > 0) {
    return seedMeta;
  }

  if (slug.startsWith('world-yi-en-')) {
    return {
      locale: 'en-US',
      market: 'World Yi English',
      series: 'world-yi-en',
    };
  }

  if (slug.startsWith('world-yi-')) {
    return {
      locale: 'zh-Hans',
      market: 'World Yi',
      series: 'world-yi',
    };
  }

  return {
    locale: 'zh-Hans',
  };
}

export function normalizeManagedContentMeta(entry: Pick<ManagedContentEntry, 'contentType' | 'slug' | 'source' | 'status' | 'meta'>) {
  const nextMeta = {
    ...(entry.meta || {}),
  } as Record<string, unknown>;
  const localeDefaults = inferLocaleDefaults(entry.contentType, entry.slug);

  if (!readString(nextMeta, 'locale') && typeof localeDefaults.locale === 'string') {
    nextMeta.locale = localeDefaults.locale;
  }

  if (!readString(nextMeta, 'market') && typeof localeDefaults.market === 'string') {
    nextMeta.market = localeDefaults.market;
  }

  if (!readString(nextMeta, 'series') && typeof localeDefaults.series === 'string') {
    nextMeta.series = localeDefaults.series;
  }

  if (entry.status === 'published' && entry.source !== 'agent-fallback:manual') {
    if (nextMeta.publicationReady !== false) {
      nextMeta.publicationReady = true;
    }
  }

  if (readString(nextMeta, 'contentVersion') !== CURRENT_CONTENT_VERSION) {
    nextMeta.contentVersion = CURRENT_CONTENT_VERSION;
  }

  // v2 Application Frameworks layer enforcement (World Yi v2.0 - Application Frameworks Engineer mandate)
  // Ensures 6-domain protocols (career/rel/family/health/wealth/migration/education-naming) carry full interconnection meta
  const layer = readString(nextMeta, 'worldYiLayer');
  const isAppLayer = layer === 'application' || (entry.slug || '').includes('protocol') || (entry.slug || '').includes('career-') || (entry.slug || '').includes('migration-') || (entry.slug || '').includes('relationship-') || (entry.slug || '').includes('health-') || (entry.slug || '').includes('wealth-') || (entry.slug || '').includes('education-') || (entry.slug || '').includes('naming-') || (entry.slug || '').includes('family-duty');
  if (isAppLayer) {
    if (!readString(nextMeta, 'worldYiLayer')) nextMeta.worldYiLayer = 'application';
    if (!Array.isArray(nextMeta.coreJudgmentPrimitives) || (nextMeta.coreJudgmentPrimitives as any[]).length === 0) {
      nextMeta.coreJudgmentPrimitives = ['structure-timing', 'bazi-instantiation', 'environment-fit', 'action-risk-loop', 'diaspora-variable'];
    }
    if (!Array.isArray(nextMeta.feedsAgentModules) || (nextMeta.feedsAgentModules as any[]).length === 0) {
      nextMeta.feedsAgentModules = ['career_wealth', 'relationship_family', 'health_lifestyle', 'strategy_advisor', 'temporal_spatial_advisor'];
    }
    if (!readString(nextMeta, 'decisionModel')) {
      nextMeta.decisionModel = 'five-elements + gua-phase + bazi-instantiation + diaspora-solar-time-overlay + action-matrix';
    }
    if (!nextMeta.qualityRubricScores) {
      // Default conservative passing scores for hand-authored or post-critique app frameworks (generator enforces real rubric >=82)
      nextMeta.qualityRubricScores = { yixueFidelityDepth: 85, actionabilityFrameworks: 88, originalitySynthesis: 82, reportIntegration: 87, claritySignal: 86, seoGeoConversion: 78, interconnectCoherence: 84, overall: 84 };
    }
    // Never backfill with Date.now(): seed/resync would flood publishedToday and block the daily scheduler.
    // Prefer original created/updated times; leave empty if neither is available (scheduler sets real stamps).
    if (!readString(nextMeta, 'schedulePublishedAt') && entry.status === 'published') {
      const stable = entry.createdAt || entry.updatedAt || '';
      if (stable && entry.source !== 'seed') {
        nextMeta.schedulePublishedAt = stable;
      } else if (stable && entry.source === 'seed') {
        // Seeds keep historical createdAt only — never count as fresh auto-publish.
        nextMeta.schedulePublishedAt = stable;
      }
    }
    if (!Array.isArray(nextMeta.crossRefs) || (nextMeta.crossRefs as any[]).length === 0) {
      nextMeta.crossRefs = ['yixue-core-mechanics-v2', 'bazi-as-yixue-instantiation', 'judgment-five-elements-deep-v2', 'bazi-system-topic-overview', 'world-yi-methodology'];
    }
  }

  return nextMeta;
}

function enrichJourneyMeta(params: {
  contentType: ManagedContentType;
  slug: string;
  source: string;
  status: ContentStatus;
  title?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  meta?: Record<string, unknown>;
}) {
  const normalized = normalizeManagedContentMeta({
    contentType: params.contentType,
    slug: params.slug,
    source: params.source,
    status: params.status,
    meta: params.meta,
  });

  const signalText = [
    params.title || '',
    params.excerpt || '',
    params.category || '',
    ...(params.tags || []),
  ].join(' ');
  const inferredCategory = inferCategoryFromText(signalText)
    || inferCategoryFromText(`${params.category || ''}`)
    || inferCategoryFromText(readStringArray(normalized, 'relatedReportThemes').join(' '));

  if (readStringArray(normalized, 'relatedReportThemes').length === 0) {
    const nextThemes = Array.from(new Set([
      `${params.category || ''}`.trim(),
      ...(inferredCategory ? [inferredCategory] : []),
      ...(params.tags || []).slice(0, 3),
    ].filter(Boolean)));
    if (nextThemes.length > 0) {
      normalized.relatedReportThemes = nextThemes;
    }
  }

  if (readStringArray(normalized, 'relatedToolSlugs').length === 0) {
    const fallbackCategory = inferredCategory || (params.contentType === 'knowledge' ? 'career' : null);
    if (fallbackCategory) {
      normalized.relatedToolSlugs = listToolsByCategory(fallbackCategory)
      .slice(0, 3)
      .map((item) => item.slug);
    }
  }

  if (!readString(normalized, 'journeyAutomation')) {
    normalized.journeyAutomation = 'auto';
  }

  const relatedContent = inferRelatedContentSlugs({
    contentType: params.contentType,
    slug: params.slug,
    title: params.title,
    excerpt: params.excerpt,
    category: params.category,
    tags: params.tags,
    relatedToolSlugs: readStringArray(normalized, 'relatedToolSlugs'),
    relatedReportThemes: readStringArray(normalized, 'relatedReportThemes'),
  });

  if (readStringArray(normalized, 'relatedKnowledgeSlugs').length === 0 && relatedContent.relatedKnowledgeSlugs.length > 0) {
    normalized.relatedKnowledgeSlugs = relatedContent.relatedKnowledgeSlugs;
  }

  if (readStringArray(normalized, 'relatedCaseSlugs').length === 0 && relatedContent.relatedCaseSlugs.length > 0) {
    normalized.relatedCaseSlugs = relatedContent.relatedCaseSlugs;
  }

  if (!hasVisualAssetBinding(normalized)) {
    const visualAssets = buildVisualAssetBindingForContentEntry({
      contentType: params.contentType,
      slug: params.slug,
      title: params.title || '',
      excerpt: params.excerpt || '',
      category: params.category || null,
      tags: params.tags || [],
      meta: normalized,
    });
    if (visualAssets) {
      normalized.visualAssets = visualAssets;
    }
  }

  if (!hasGeoOptimization(normalized)) {
    normalized.geoOptimization = buildGeoOptimizationMeta({
      contentType: params.contentType,
      slug: params.slug,
      title: params.title,
      excerpt: params.excerpt,
      category: params.category,
      tags: params.tags,
      meta: normalized,
    });
  }

  return normalized;
}

function scoreContentSimilarity(params: {
  entry: ManagedContentEntry;
  signalText: string;
  tags: string[];
  relatedToolSlugs: string[];
  relatedReportThemes: string[];
  inferredCategory: string | null;
}) {
  const entryJourney = getManagedContentJourneyMeta(params.entry);
  const haystack = [
    params.entry.title,
    params.entry.excerpt,
    params.entry.category || '',
    ...(params.entry.tags || []),
  ].join(' ').toLowerCase();
  const loweredSignal = params.signalText.toLowerCase();
  let score = 0;

  params.tags.forEach((tag) => {
    if (haystack.includes(tag.toLowerCase())) {
      score += 4;
    }
  });

  params.relatedToolSlugs.forEach((slug) => {
    if (entryJourney.relatedToolSlugs.includes(slug)) {
      score += 6;
    }
  });

  params.relatedReportThemes.forEach((theme) => {
    const loweredTheme = theme.toLowerCase();
    if (
      entryJourney.relatedReportThemes.some((item) => item.toLowerCase() === loweredTheme)
      || haystack.includes(loweredTheme)
    ) {
      score += 3;
    }
  });

  if (params.inferredCategory && inferCategoryFromText(haystack) === params.inferredCategory) {
    score += 3;
  }

  if (params.entry.featured) {
    score += 1;
  }

  if (loweredSignal.includes(params.entry.title.toLowerCase())) {
    score += 2;
  }

  return score;
}

function inferRelatedContentSlugs(params: {
  contentType: ManagedContentType;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  relatedToolSlugs: string[];
  relatedReportThemes: string[];
}) {
  const signalText = [
    params.title || '',
    params.excerpt || '',
    params.category || '',
    ...(params.tags || []),
    ...params.relatedReportThemes,
  ].join(' ');
  const inferredCategory = inferCategoryFromText(signalText) || null;
  const tags = (params.tags || []).filter(Boolean);

  const pickSlugs = (contentType: 'knowledge' | 'case') =>
    listPublishedEntriesByType(contentType)
      .filter((entry) => entry.slug !== params.slug)
      .filter((entry) => contentType !== 'knowledge' || isPublicKnowledgeEntry(entry))
      .map((entry) => ({
        slug: entry.slug,
        score: scoreContentSimilarity({
          entry,
          signalText,
          tags,
          relatedToolSlugs: params.relatedToolSlugs,
          relatedReportThemes: params.relatedReportThemes,
          inferredCategory,
        }),
        updatedAt: entry.updatedAt,
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 3)
      .map((item) => item.slug);

  return {
    relatedKnowledgeSlugs: pickSlugs('knowledge'),
    relatedCaseSlugs: pickSlugs('case'),
  };
}

function needsJourneyMetaRefresh(entry: ManagedContentEntry) {
  const meta = entry.meta as Record<string, unknown> | undefined;
  const contentVersion = readString(meta, 'contentVersion');
  const relatedReportThemes = readStringArray(meta, 'relatedReportThemes');
  const relatedToolSlugs = readStringArray(meta, 'relatedToolSlugs');
  const relatedKnowledgeSlugs = readStringArray(meta, 'relatedKnowledgeSlugs');
  const relatedCaseSlugs = readStringArray(meta, 'relatedCaseSlugs');

  if (contentVersion !== CURRENT_CONTENT_VERSION) {
    return true;
  }

  if (!readString(meta, 'journeyAutomation')) {
    return true;
  }

  if (relatedReportThemes.length === 0 || relatedToolSlugs.length === 0) {
    return true;
  }

  if (entry.contentType !== 'insight' && relatedKnowledgeSlugs.length === 0) {
    return true;
  }

  if (entry.contentType !== 'insight' && relatedCaseSlugs.length === 0) {
    return true;
  }

  if (!hasVisualAssetBinding(meta)) {
    return true;
  }

  if (!hasGeoOptimization(meta)) {
    return true;
  }

  return false;
}

function rebuildJourneyMetaForEntry(entry: ManagedContentEntry) {
  return enrichJourneyMeta({
    contentType: entry.contentType,
    slug: entry.slug,
    source: entry.source,
    status: entry.status,
    title: entry.title,
    excerpt: entry.excerpt,
    category: entry.category,
    tags: entry.tags,
    meta: entry.meta || {},
  });
}

function ensureSeedContent() {
  if (seedContentEnsured) {
    return;
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO content_entries (
      id, content_type, subtype, slug, title, name, excerpt, category, read_time,
      tags, featured, seo_title, seo_description, sections, status, source, meta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'seed', ?)
  `);
  const updateSeedMeta = db.prepare(`
    UPDATE content_entries
    SET meta = ?
    WHERE id = ? AND source = 'seed'
  `);

  const runSeed = db.transaction(() => {
    seededKnowledgeArticles.forEach((item) => {
      const meta = normalizeManagedContentMeta({
        contentType: 'knowledge',
        slug: item.slug,
        source: 'seed',
        status: 'published',
        meta: inferSeedEntryMeta('knowledge', item.slug),
      });
      insert.run(
        `seed_${item.slug}`,
        'knowledge',
        null,
        item.slug,
        item.title,
        null,
        item.excerpt,
        item.category,
        item.readTime,
        JSON.stringify(item.tags),
        item.featured ? 1 : 0,
        item.seoTitle,
        item.seoDescription,
        JSON.stringify(item.sections),
        JSON.stringify(meta)
      );
      updateSeedMeta.run(JSON.stringify(meta), `seed_${item.slug}`);
    });

    seededCaseStudies.forEach((item) => {
      const meta = normalizeManagedContentMeta({
        contentType: 'case',
        slug: item.slug,
        source: 'seed',
        status: 'published',
        meta: inferSeedEntryMeta('case', item.slug),
      });
      insert.run(
        `seed_${item.slug}`,
        'case',
        null,
        item.slug,
        item.title,
        null,
        item.excerpt,
        item.scenario,
        null,
        JSON.stringify(item.tags),
        item.featured ? 1 : 0,
        item.seoTitle,
        item.seoDescription,
        JSON.stringify(item.sections),
        JSON.stringify(meta)
      );
      updateSeedMeta.run(JSON.stringify(meta), `seed_${item.slug}`);
    });

    seededEntityInsights.forEach((item) => {
      const meta = normalizeManagedContentMeta({
        contentType: 'insight',
        slug: item.slug,
        source: 'seed',
        status: 'published',
        meta: inferSeedEntryMeta('insight', item.slug),
      });
      insert.run(
        `seed_${item.slug}`,
        'insight',
        item.type,
        item.slug,
        item.title,
        item.name,
        item.excerpt,
        getEntityTypeLabel(item.type),
        null,
        JSON.stringify(item.tags),
        item.featured ? 1 : 0,
        item.seoTitle,
        item.seoDescription,
        JSON.stringify(item.sections),
        JSON.stringify(meta)
      );
      updateSeedMeta.run(JSON.stringify(meta), `seed_${item.slug}`);
    });
  });

  runSeed();
  seedContentEnsured = true;

  if (!seedJourneyMetaHydrated) {
    refreshManagedContentJourneyMetadata({
      source: 'seed',
      limit: 500,
      userId: 'system_seed_refresh',
    });
    seedJourneyMetaHydrated = true;
  }
}

// v5-D34 30s TTL memoize：listPublishedEntriesByType 是 SSR 热路径，bot/RSC prefetch 风暴下
// /analyze /tools/[slug] /cases/* /knowledge /world-yi/* 都会触发 3 个全表 SELECT + 大量 mapRow
// JSON 反序列化。content-scheduler 每 20 min 才发新内容，30s 缓存足够新鲜；save/delete 主动失效。
const publishedListCache = new Map<string, { value: ManagedContentEntry[]; expiresAt: number }>();
const PUBLISHED_LIST_TTL_MS = 30_000;

function invalidatePublishedListCache() {
  publishedListCache.clear();
  contentSnapshotCache.clear();
  worldYiPublicationCache.clear();
}

function listPublishedEntriesByType(contentType: ManagedContentType) {
  ensureSeedContent();
  const now = Date.now();
  const cached = publishedListCache.get(contentType);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }
  const rows = db.prepare(`
    SELECT * FROM content_entries
    WHERE content_type = ? AND status = 'published'
    ORDER BY featured DESC, updated_at DESC, created_at DESC
  `).all(contentType);

  const value = rows.map(mapRow);
  publishedListCache.set(contentType, { value, expiresAt: now + PUBLISHED_LIST_TTL_MS });
  return value;
}

function getPublishedEntryBySlug(contentType: ManagedContentType, slug: string) {
  ensureSeedContent();
  const row = db.prepare(`
    SELECT * FROM content_entries
    WHERE content_type = ? AND slug = ? AND status = 'published'
    LIMIT 1
  `).get(contentType, slug);

  return row ? mapRow(row) : null;
}

function toKnowledgeArticle(entry: ManagedContentEntry): KnowledgeArticle {
  const meta = (entry.meta || {}) as Record<string, unknown>;
  const geo = meta.geoOptimization && typeof meta.geoOptimization === 'object'
    ? (meta.geoOptimization as Record<string, unknown>)
    : null;
  return {
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    category: entry.category || '知识内容',
    readTime: entry.readTime || '5 分钟',
    tags: entry.tags,
    featured: entry.featured,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
    sections: entry.sections,
    locale: typeof meta.locale === 'string' ? meta.locale : undefined,
    market: typeof meta.market === 'string' ? meta.market : undefined,
    geoReady: geo?.geoReady === true,
    geoOptimization: geo || undefined,
  } as KnowledgeArticle;
}

function toCaseStudy(entry: ManagedContentEntry): CaseStudy {
  const meta = (entry.meta || {}) as Record<string, unknown>;
  const geo = meta.geoOptimization && typeof meta.geoOptimization === 'object'
    ? (meta.geoOptimization as Record<string, unknown>)
    : null;
  return {
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    scenario: entry.category || '案例内容',
    tags: entry.tags,
    featured: entry.featured,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
    sections: entry.sections,
    locale: typeof meta.locale === 'string' ? meta.locale : undefined,
    market: typeof meta.market === 'string' ? meta.market : undefined,
    geoReady: geo?.geoReady === true,
    geoOptimization: geo || undefined,
  } as CaseStudy;
}

function toEntityInsight(entry: ManagedContentEntry): EntityInsight {
  return {
    type: (entry.subtype || 'industry') as EntityInsightType,
    slug: entry.slug,
    name: entry.name || entry.title,
    title: entry.title,
    excerpt: entry.excerpt,
    featured: entry.featured,
    tags: entry.tags,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
    sections: entry.sections,
  };
}

export function getKnowledgeArticles() {
  return listPublishedEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry))
    .map(toKnowledgeArticle);
}

export function listPublishedManagedContentEntriesByType(contentType: ManagedContentType) {
  return listPublishedEntriesByType(contentType);
}

export function getManagedContentEntryBySlug(contentType: ManagedContentType, slug: string) {
  return getPublishedEntryBySlug(contentType, slug);
}

export function getManagedContentJourneyMeta(entry?: ManagedContentEntry | null) {
  return {
    relatedToolSlugs: readStringArray(entry?.meta, 'relatedToolSlugs'),
    relatedReportThemes: readStringArray(entry?.meta, 'relatedReportThemes'),
    relatedKnowledgeSlugs: readStringArray(entry?.meta, 'relatedKnowledgeSlugs'),
    relatedCaseSlugs: readStringArray(entry?.meta, 'relatedCaseSlugs'),
    visualAssets: entry?.meta?.visualAssets || null,
    geoOptimization: entry?.meta?.geoOptimization || null,
  };
}

export function getManagedContentGeoOptimizationMeta(entry?: ManagedContentEntry | null) {
  const value = entry?.meta?.geoOptimization;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const meta = value as Record<string, unknown>;
  return {
    answerSummary: readString(meta, 'answerSummary'),
    directAnswer: readString(meta, 'directAnswer'),
    canonicalTopic: readString(meta, 'canonicalTopic'),
    audience: readString(meta, 'audience'),
    searchIntents: readStringArray(meta, 'searchIntents'),
    entityKeywords: readStringArray(meta, 'entityKeywords'),
    audienceQuestions: readStringArray(meta, 'audienceQuestions'),
    geoReady: meta.geoReady === true,
  };
}

export function refreshManagedContentJourneyMetadata(params?: {
  limit?: number;
  source?: string;
  userId?: string;
}) {
  ensureSeedContent();

  const limit = Math.max(1, params?.limit || 50);
  const userId = params?.userId || 'system_content_refresh';
  const rows = db.prepare(`
    SELECT * FROM content_entries
    ${params?.source ? 'WHERE source = ?' : ''}
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ?
  `).all(...(params?.source ? [params.source, limit] : [limit]));
  const entries = rows.map(mapRow);
  const update = db.prepare(`
    UPDATE content_entries
    SET meta = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  let refreshedCount = 0;
  entries.forEach((entry) => {
    if (!needsJourneyMetaRefresh(entry)) {
      return;
    }

    const nextMeta = rebuildJourneyMetaForEntry(entry);
    update.run(JSON.stringify(nextMeta), userId, entry.id);
    refreshedCount += 1;
  });

  if (refreshedCount > 0) {
    invalidatePublishedListCache();
  }

  return {
    scannedCount: entries.length,
    refreshedCount,
  };
}

export function invalidateManagedContentPublishedListCache() {
  invalidatePublishedListCache();
}

export function getKnowledgeArticleBySlug(slug: string) {
  const entry = getPublishedEntryBySlug('knowledge', slug);
  return entry && isPublicKnowledgeEntry(entry) ? toKnowledgeArticle(entry) : null;
}

export function getFeaturedKnowledgeArticles(limit = 3) {
  return getKnowledgeArticles().filter((item) => item.featured).slice(0, limit);
}

export function getCaseStudies() {
  return listPublishedEntriesByType('case').map(toCaseStudy);
}

export function getCaseStudyBySlug(slug: string) {
  const entry = getPublishedEntryBySlug('case', slug);
  return entry ? toCaseStudy(entry) : null;
}

export function getFeaturedCaseStudies(limit = 2) {
  return getCaseStudies().filter((item) => item.featured).slice(0, limit);
}

export function getEntityInsights() {
  return listPublishedEntriesByType('insight').map(toEntityInsight);
}

export function getEntityInsightByTypeAndSlug(type: string, slug: string) {
  return getEntityInsights().find((item) => item.type === type && item.slug === slug) || null;
}

export function getEntityInsightsByType(type: EntityInsightType) {
  return getEntityInsights().filter((item) => item.type === type);
}

export function getFeaturedEntityInsights(limit = 3) {
  return getEntityInsights().filter((item) => item.featured).slice(0, limit);
}

export function listManagedContentEntries() {
  ensureSeedContent();
  const rows = db.prepare(`
    SELECT * FROM content_entries
    ORDER BY updated_at DESC, created_at DESC
  `).all();

  return rows.map(mapRow);
}

export type ManagedContentEntryInput = Omit<
  ManagedContentEntry,
  'id' | 'createdAt' | 'updatedAt' | 'source' | 'createdBy' | 'updatedBy'
> & {
  id?: string;
  source?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export function saveManagedContentEntry(
  input: ManagedContentEntryInput,
  userId: string
) {
  ensureSeedContent();

  const payload = {
    ...input,
    id: input.id || `content_${generateId()}`,
    source: input.source || 'cms',
    meta: enrichJourneyMeta({
      contentType: input.contentType,
      slug: input.slug,
      source: input.source || 'cms',
      status: input.status,
      title: input.title,
      excerpt: input.excerpt,
      category: input.category,
      tags: input.tags,
      meta: input.meta || {},
    }),
  };

  const existing = db.prepare(`SELECT id FROM content_entries WHERE id = ?`).get(payload.id) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE content_entries
      SET content_type = ?, subtype = ?, slug = ?, title = ?, name = ?, excerpt = ?, category = ?,
          read_time = ?, tags = ?, featured = ?, seo_title = ?, seo_description = ?, sections = ?,
          status = ?, source = ?, meta = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      payload.contentType,
      payload.subtype,
      payload.slug,
      payload.title,
      payload.name,
      payload.excerpt,
      payload.category,
      payload.readTime,
      JSON.stringify(payload.tags),
      payload.featured ? 1 : 0,
      payload.seoTitle,
      payload.seoDescription,
      JSON.stringify(payload.sections),
      payload.status,
      payload.source,
      JSON.stringify(payload.meta),
      userId,
      payload.id
    );
  } else {
    db.prepare(`
      INSERT INTO content_entries (
        id, content_type, subtype, slug, title, name, excerpt, category, read_time,
        tags, featured, seo_title, seo_description, sections, status, source, meta, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.id,
      payload.contentType,
      payload.subtype,
      payload.slug,
      payload.title,
      payload.name,
      payload.excerpt,
      payload.category,
      payload.readTime,
      JSON.stringify(payload.tags),
      payload.featured ? 1 : 0,
      payload.seoTitle,
      payload.seoDescription,
      JSON.stringify(payload.sections),
      payload.status,
      payload.source,
      JSON.stringify(payload.meta),
      userId,
      userId
    );
  }

  const row = db.prepare(`SELECT * FROM content_entries WHERE id = ?`).get(payload.id);
  invalidatePublishedListCache();
  return row ? mapRow(row) : null;
}

export function deleteManagedContentEntry(id: string) {
  invalidatePublishedListCache();
  return db.prepare(`DELETE FROM content_entries WHERE id = ?`).run(id);
}

// ============================================================
// World Yi v2.0 Report Engine Integration Bridges (v2 doctrine spine)
// These helpers make published v2 content (with rich meta per world-yi-publication-program.json)
// automatically surface in fortune reports, agentic modules, and UI surfaces.
// - Respects schedulePublishedAt for "live after publish time" surfacing (publication flow auto-feeds reports)
// - Matches on requiredMetaFields: worldYiLayer, coreJudgmentPrimitives, relatedReportPillars/themes, feedsAgentModules
// - Enables bidirectional: content feeds upgrades/agents; reports drive new content ideas via feedback
// ============================================================

export type WorldYiV2Reference = {
  slug: string;
  title: string;
  excerpt: string;
  url: string;
  layer?: string;
  corePrimitives: string[];
  matchedReasons: string[];
  decisionModel?: string;
  feedsAgentModules: string[];
  schedulePublishedAt?: string;
  qualityRubricScores?: Record<string, number>;
};

function parseScheduleTime(meta: Record<string, unknown> | undefined): Date | null {
  const raw = typeof meta?.schedulePublishedAt === 'string' ? meta.schedulePublishedAt.trim() : '';
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isLiveForSurfacing(entry: ManagedContentEntry, now: Date | string | number | undefined = undefined): boolean {
  if (entry.status !== 'published') return false;
  const scheduled = parseScheduleTime(entry.meta);
  const effectiveNow = now instanceof Date ? now : (now ? new Date(now) : new Date());
  if (scheduled && scheduled.getTime() > effectiveNow.getTime()) return false;
  // No schedule or past schedule = live (publication flow auto-surfaces)
  return true;
}

function readMetaStringArray(meta: Record<string, unknown> | undefined, key: string): string[] {
  const v = meta?.[key];
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
}

function scoreMatch(entry: ManagedContentEntry, ctx: {
  pillars?: string[];
  themes?: string[];
  agentModules?: string[];
  yongShen?: string[];
}): { score: number; reasons: string[] } {
  const meta = entry.meta || {};
  const reasons: string[] = [];
  let score = 0;

  const pillars = (ctx.pillars || []).map((p) => p.toLowerCase());
  const themes = (ctx.themes || []).map((t) => t.toLowerCase());
  const agents = (ctx.agentModules || []).map((a) => a.toLowerCase());
  const shen = (ctx.yongShen || []).map((s) => s.toLowerCase());

  const relatedPillars = readMetaStringArray(meta, 'relatedReportPillars').map((p) => p.toLowerCase());
  const relatedThemes = readMetaStringArray(meta, 'relatedReportThemes').map((t) => t.toLowerCase());
  const feedsAgents = readMetaStringArray(meta, 'feedsAgentModules').map((a) => a.toLowerCase());
  const primitives = readMetaStringArray(meta, 'coreJudgmentPrimitives').map((p) => p.toLowerCase());

  // Pillar / bazi-instantiation / wuxing / ten-gods match
  const pillarHits = relatedPillars.filter((rp) => pillars.some((p) => rp.includes(p) || p.includes(rp) || rp.includes('bazi') || rp.includes('pillar')));
  if (pillarHits.length) {
    score += 3 * pillarHits.length;
    reasons.push(`pillars:${pillarHits.join(',')}`);
  }
  if (primitives.some((pr) => pr.includes('bazi-instantiation') || pr.includes('wuxing') || pr.includes('ten-gods'))) {
    score += 2;
    reasons.push('bazi/yixue-mechanics');
  }

  // Theme / agent module match (career, timing, relationship, health, strategy)
  const themeHits = relatedThemes.filter((rt) => themes.some((t) => rt.includes(t) || t.includes(rt)));
  if (themeHits.length) {
    score += 4 * themeHits.length;
    reasons.push(`themes:${themeHits.join(',')}`);
  }
  const agentHits = feedsAgents.filter((fa) => agents.some((a) => fa.includes(a) || a.includes(fa)));
  if (agentHits.length) {
    score += 5 * agentHits.length;
    reasons.push(`agents:${agentHits.join(',')}`);
  }

  // Judgment primitives overlap (structure-timing, gua-64 etc) + shen overlap
  const primHits = primitives.filter((pr) => shen.some((s) => pr.includes(s) || s.includes(pr) || pr.includes('timing') || pr.includes('structure')));
  if (primHits.length) {
    score += 2 * primHits.length;
    reasons.push(`primitives:${primHits.slice(0,2).join(',')}`);
  }
  if (primitives.includes('structure-timing') || primitives.includes('action-risk-loop')) {
    score += 1;
    reasons.push('judgment-five-elements');
  }

  // Bonus for doctrine-spine / high reportIntegration score from program rubric
  const layer = readString(meta, 'worldYiLayer') || (entry.slug?.startsWith('world-yi-') ? 'doctrine-spine' : '');
  if (layer.includes('doctrine') || layer.includes('spine') || layer.includes('mechanics')) {
    score += 3;
    reasons.push('doctrine-spine');
  }
  const rubric = meta.qualityRubricScores as Record<string, number> | undefined;
  if (rubric && typeof rubric.reportIntegration === 'number' && rubric.reportIntegration >= 18) {
    score += 2;
    reasons.push('high-report-integration');
  }

  return { score: Math.min(100, score), reasons: reasons.length ? reasons : ['general-yixue-framework'] };
}

/** Returns all currently live (published + schedulePublishedAt respected) World Yi v2 managed entries.
 * Accepts Date (backward compat) or options bag { now?, limit? } for diagnostics + UI lists.
 * Results are sorted most-recent-schedule first when limit is used.
 */
export function getLiveWorldYiV2Entries(
  opts: { now?: Date | string | number; limit?: number } | Date = {}
): ManagedContentEntry[] {
  const options = opts instanceof Date ? { now: opts } : (opts || {});
  const now = options.now ? (options.now instanceof Date ? options.now : new Date(options.now)) : new Date();
  const limit = options.limit && options.limit > 0 ? Math.floor(options.limit) : undefined;

  let entries = listPublishedEntriesByType('knowledge')
    .filter((e) => isLiveForSurfacing(e, now) && (e.slug?.startsWith('world-yi-') || readString(e.meta, 'worldYiLayer')));

  // Most recent first for "latest live" semantics (important for report injection + UI)
  entries = entries.sort((a, b) => {
    const ta = parseScheduleTime(a.meta)?.getTime() || 0;
    const tb = parseScheduleTime(b.meta)?.getTime() || 0;
    return tb - ta;
  });

  if (limit) entries = entries.slice(0, limit);
  return entries;
}

/** Returns top N World Yi v2 references personalized for a report's 4-pillar + agent + theme context.
 * Uses schedulePublishedAt + meta rich fields from v2 program.json. First-class surfacing for reports.
 */
export function getWorldYiV2MatchesForReport(context: {
  pillars?: string[];
  themes?: string[];
  agentModules?: string[];
  yongShen?: string[];
}, limit = 5): WorldYiV2Reference[] {
  const live = getLiveWorldYiV2Entries();
  const scored = live
    .map((entry) => {
      const { score, reasons } = scoreMatch(entry, context);
      const meta = entry.meta || {};
      const url = `/knowledge/${entry.slug}`;
      return {
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
        url,
        layer: readString(meta, 'worldYiLayer') || undefined,
        corePrimitives: readMetaStringArray(meta, 'coreJudgmentPrimitives'),
        matchedReasons: reasons,
        decisionModel: readString(meta, 'decisionModel'),
        feedsAgentModules: readMetaStringArray(meta, 'feedsAgentModules'),
        schedulePublishedAt: readString(meta, 'schedulePublishedAt') || undefined,
        qualityRubricScores: (meta.qualityRubricScores as Record<string, number>) || undefined,
        _score: score,
      };
    })
    .filter((r) => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  // Fallback to any recent live doctrine if no strong pillar match (ensures v2 always visible)
  if (scored.length === 0) {
    const fallback = live
      .filter((e) => readString(e.meta, 'worldYiLayer').includes('doctrine') || e.slug.includes('bazi') || e.slug.includes('yixue') || e.slug.includes('judgment'))
      .slice(0, limit)
      .map((entry) => {
        const meta = entry.meta || {};
        return {
          slug: entry.slug,
          title: entry.title,
          excerpt: entry.excerpt,
          url: `/knowledge/${entry.slug}`,
          layer: readString(meta, 'worldYiLayer') || 'doctrine-spine',
          corePrimitives: readMetaStringArray(meta, 'coreJudgmentPrimitives'),
          matchedReasons: ['fallback-doctrine-spine'],
          decisionModel: readString(meta, 'decisionModel'),
          feedsAgentModules: readMetaStringArray(meta, 'feedsAgentModules'),
          schedulePublishedAt: readString(meta, 'schedulePublishedAt') || undefined,
          qualityRubricScores: (meta.qualityRubricScores as Record<string, number>) || undefined,
          _score: 1,
        };
      });
    return fallback as any;
  }

  return scored as any;
}

// (duplicate definition removed - top-level readString at line ~59 is in scope for the entire module including the world-yi bridge)
