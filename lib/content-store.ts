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

function ensureSeedContent() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO content_entries (
      id, content_type, subtype, slug, title, name, excerpt, category, read_time,
      tags, featured, seo_title, seo_description, sections, status, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'seed')
  `);

  const runSeed = db.transaction(() => {
    seededKnowledgeArticles.forEach((item) => {
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
        JSON.stringify(item.sections)
      );
    });

    seededCaseStudies.forEach((item) => {
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
        JSON.stringify(item.sections)
      );
    });

    seededEntityInsights.forEach((item) => {
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
        JSON.stringify(item.sections)
      );
    });
  });

  runSeed();
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
  return listPublishedEntriesByType('knowledge').map(toKnowledgeArticle);
}

export function getKnowledgeArticleBySlug(slug: string) {
  const entry = getPublishedEntryBySlug('knowledge', slug);
  return entry ? toKnowledgeArticle(entry) : null;
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
    meta: input.meta || {},
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
