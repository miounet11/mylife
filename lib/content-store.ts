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
import { generateId } from '@/lib/utils';

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

export const CURRENT_CONTENT_VERSION = 'content-v2';
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

function listPublishedEntriesByType(contentType: ManagedContentType) {
  ensureSeedContent();
  const rows = db.prepare(`
    SELECT * FROM content_entries
    WHERE content_type = ? AND status = 'published'
    ORDER BY featured DESC, updated_at DESC, created_at DESC
  `).all(contentType);

  return rows.map(mapRow);
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
  };
}

function toCaseStudy(entry: ManagedContentEntry): CaseStudy {
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
  };
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

  return {
    scannedCount: entries.length,
    refreshedCount,
  };
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

export function saveManagedContentEntry(
  input: Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string },
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
  return row ? mapRow(row) : null;
}

export function deleteManagedContentEntry(id: string) {
  return db.prepare(`DELETE FROM content_entries WHERE id = ?`).run(id);
}
