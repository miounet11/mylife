import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import type { RightsStatus } from '@/lib/knowledge-taxonomy';
import { generateId } from '@/lib/utils';

export type KnowledgeSourceType = 'rss' | 'site' | 'manual' | 'import';
export type BibliographyEntryType = 'classic' | 'commentary' | 'modern_intro' | 'research' | 'translation';
export type KnowledgeEntityType = 'concept' | 'person' | 'school' | 'method' | 'place' | 'text' | 'topic' | 'question';

export interface SourceDocumentRecord {
  id: string;
  sourceType: KnowledgeSourceType;
  platform: string;
  sourceId: string | null;
  canonicalUrl: string;
  title: string;
  author: string | null;
  publishedAt: string | null;
  language: string;
  summary: string | null;
  tags: string[];
  rawMeta: Record<string, unknown>;
  rightsStatus: RightsStatus;
  licenseName: string | null;
  reusePolicy: string | null;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BibliographyEntryRecord {
  id: string;
  title: string;
  slug: string;
  altTitles: string[];
  originalTitle: string | null;
  author: string | null;
  translators: string[];
  editors: string[];
  dynastyOrPeriod: string | null;
  publicationYear: number | null;
  editionNote: string | null;
  publisher: string | null;
  isbn: string | null;
  language: string | null;
  bookType: BibliographyEntryType;
  rightsStatus: RightsStatus;
  sourceUrl: string | null;
  summary: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntityRecord {
  id: string;
  entityType: KnowledgeEntityType;
  name: string;
  aliases: string[];
  slug: string;
  summary: string | null;
  description: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRelationRecord {
  id: string;
  subjectEntityId: string;
  relationType: string;
  objectEntityId: string;
  evidenceSourceId: string | null;
  confidenceScore: number;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface UpsertSourceDocumentInput {
  id?: string;
  sourceType: KnowledgeSourceType;
  platform: string;
  sourceId?: string | null;
  canonicalUrl: string;
  title: string;
  author?: string | null;
  publishedAt?: string | null;
  language?: string;
  summary?: string | null;
  tags?: string[];
  rawMeta?: Record<string, unknown>;
  rightsStatus?: RightsStatus;
  licenseName?: string | null;
  reusePolicy?: string | null;
  contentHash?: string | null;
}

export interface UpsertBibliographyEntryInput {
  id?: string;
  title: string;
  slug?: string;
  altTitles?: string[];
  originalTitle?: string | null;
  author?: string | null;
  translators?: string[];
  editors?: string[];
  dynastyOrPeriod?: string | null;
  publicationYear?: number | null;
  editionNote?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  language?: string | null;
  bookType?: BibliographyEntryType;
  rightsStatus?: RightsStatus;
  sourceUrl?: string | null;
  summary?: string | null;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface UpsertKnowledgeEntityInput {
  id?: string;
  entityType: KnowledgeEntityType;
  name: string;
  aliases?: string[];
  slug?: string;
  summary?: string | null;
  description?: string | null;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface CreateKnowledgeRelationInput {
  id?: string;
  subjectEntityId: string;
  relationType: string;
  objectEntityId: string;
  evidenceSourceId?: string | null;
  confidenceScore?: number;
  meta?: Record<string, unknown>;
}

type RawSourceDocumentRow = {
  id: string;
  source_type: KnowledgeSourceType;
  platform: string;
  source_id?: string | null;
  canonical_url: string;
  title: string;
  author?: string | null;
  published_at?: string | null;
  language?: string | null;
  summary?: string | null;
  tags?: string | null;
  raw_meta?: string | null;
  rights_status?: RightsStatus | null;
  license_name?: string | null;
  reuse_policy?: string | null;
  content_hash?: string | null;
  created_at: string;
  updated_at: string;
};

type RawBibliographyEntryRow = {
  id: string;
  title: string;
  slug: string;
  alt_titles?: string | null;
  original_title?: string | null;
  author?: string | null;
  translators?: string | null;
  editors?: string | null;
  dynasty_or_period?: string | null;
  publication_year?: number | null;
  edition_note?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  language?: string | null;
  book_type?: BibliographyEntryType | null;
  rights_status?: RightsStatus | null;
  source_url?: string | null;
  summary?: string | null;
  tags?: string | null;
  meta?: string | null;
  created_at: string;
  updated_at: string;
};

type RawKnowledgeEntityRow = {
  id: string;
  entity_type: KnowledgeEntityType;
  name: string;
  aliases?: string | null;
  slug: string;
  summary?: string | null;
  description?: string | null;
  tags?: string | null;
  meta?: string | null;
  created_at: string;
  updated_at: string;
};

type RawKnowledgeRelationRow = {
  id: string;
  subject_entity_id: string;
  relation_type: string;
  object_entity_id: string;
  evidence_source_id?: string | null;
  confidence_score?: number | null;
  meta?: string | null;
  created_at: string;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function uniqueStrings(values: string[] | undefined) {
  return [...new Set((values || []).map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function sanitizeSlug(value: string, fallbackPrefix: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (normalized) {
    return normalized.slice(0, 100);
  }

  const fallbackSuffix = generateId()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(-12);

  return `${fallbackPrefix}-${fallbackSuffix}`;
}

function mapSourceDocumentRow(row: RawSourceDocumentRow): SourceDocumentRecord {
  return {
    id: row.id,
    sourceType: row.source_type,
    platform: row.platform,
    sourceId: row.source_id || null,
    canonicalUrl: row.canonical_url,
    title: row.title,
    author: row.author || null,
    publishedAt: row.published_at || null,
    language: row.language || 'zh-CN',
    summary: row.summary || null,
    tags: parseJson(row.tags, []),
    rawMeta: parseJson(row.raw_meta, {}),
    rightsStatus: row.rights_status || 'unknown',
    licenseName: row.license_name || null,
    reusePolicy: row.reuse_policy || null,
    contentHash: row.content_hash || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBibliographyRow(row: RawBibliographyEntryRow): BibliographyEntryRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    altTitles: parseJson(row.alt_titles, []),
    originalTitle: row.original_title || null,
    author: row.author || null,
    translators: parseJson(row.translators, []),
    editors: parseJson(row.editors, []),
    dynastyOrPeriod: row.dynasty_or_period || null,
    publicationYear: row.publication_year || null,
    editionNote: row.edition_note || null,
    publisher: row.publisher || null,
    isbn: row.isbn || null,
    language: row.language || null,
    bookType: row.book_type || 'classic',
    rightsStatus: row.rights_status || 'unknown',
    sourceUrl: row.source_url || null,
    summary: row.summary || null,
    tags: parseJson(row.tags, []),
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKnowledgeEntityRow(row: RawKnowledgeEntityRow): KnowledgeEntityRecord {
  return {
    id: row.id,
    entityType: row.entity_type,
    name: row.name,
    aliases: parseJson(row.aliases, []),
    slug: row.slug,
    summary: row.summary || null,
    description: row.description || null,
    tags: parseJson(row.tags, []),
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKnowledgeRelationRow(row: RawKnowledgeRelationRow): KnowledgeRelationRecord {
  return {
    id: row.id,
    subjectEntityId: row.subject_entity_id,
    relationType: row.relation_type,
    objectEntityId: row.object_entity_id,
    evidenceSourceId: row.evidence_source_id || null,
    confidenceScore: typeof row.confidence_score === 'number' ? row.confidence_score : 0.5,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

export function ensureKnowledgeBaseSchema(database: Database.Database = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS source_documents (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      platform TEXT NOT NULL,
      source_id TEXT,
      canonical_url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      published_at TEXT,
      language TEXT DEFAULT 'zh-CN',
      summary TEXT,
      tags JSON,
      raw_meta JSON,
      rights_status TEXT DEFAULT 'unknown',
      license_name TEXT,
      reuse_policy TEXT,
      content_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bibliography_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      alt_titles JSON,
      original_title TEXT,
      author TEXT,
      translators JSON,
      editors JSON,
      dynasty_or_period TEXT,
      publication_year INTEGER,
      edition_note TEXT,
      publisher TEXT,
      isbn TEXT,
      language TEXT,
      book_type TEXT DEFAULT 'classic',
      rights_status TEXT DEFAULT 'unknown',
      source_url TEXT,
      summary TEXT,
      tags JSON,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_entities (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      name TEXT NOT NULL,
      aliases JSON,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT,
      description TEXT,
      tags JSON,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_relations (
      id TEXT PRIMARY KEY,
      subject_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      object_entity_id TEXT NOT NULL,
      evidence_source_id TEXT,
      confidence_score REAL DEFAULT 0.5,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(subject_entity_id, relation_type, object_entity_id, evidence_source_id)
    );

    CREATE INDEX IF NOT EXISTS idx_source_documents_platform ON source_documents(platform);
    CREATE INDEX IF NOT EXISTS idx_source_documents_source_id ON source_documents(source_id);
    CREATE INDEX IF NOT EXISTS idx_source_documents_rights_status ON source_documents(rights_status);
    CREATE INDEX IF NOT EXISTS idx_bibliography_entries_book_type ON bibliography_entries(book_type);
    CREATE INDEX IF NOT EXISTS idx_bibliography_entries_author ON bibliography_entries(author);
    CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON knowledge_entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_knowledge_relations_subject ON knowledge_relations(subject_entity_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_relations_object ON knowledge_relations(object_entity_id);
  `);
}

export const sourceDocumentOperations = {
  upsert(database: Database.Database = db, input: UpsertSourceDocumentInput) {
    ensureKnowledgeBaseSchema(database);

    const payload = {
      id: input.id || `srcdoc_${generateId()}`,
      sourceType: input.sourceType,
      platform: input.platform.trim(),
      sourceId: input.sourceId || null,
      canonicalUrl: input.canonicalUrl.trim(),
      title: input.title.trim(),
      author: input.author?.trim() || null,
      publishedAt: input.publishedAt || null,
      language: input.language?.trim() || 'zh-CN',
      summary: input.summary?.trim() || null,
      tags: uniqueStrings(input.tags),
      rawMeta: input.rawMeta || {},
      rightsStatus: input.rightsStatus || 'unknown',
      licenseName: input.licenseName?.trim() || null,
      reusePolicy: input.reusePolicy?.trim() || null,
      contentHash: input.contentHash?.trim() || null,
    };

    const existing = database.prepare(`
      SELECT id FROM source_documents WHERE canonical_url = ? LIMIT 1
    `).get(payload.canonicalUrl) as { id: string } | undefined;

    if (existing) {
      database.prepare(`
        UPDATE source_documents
        SET source_type = ?, platform = ?, source_id = ?, title = ?, author = ?, published_at = ?,
            language = ?, summary = ?, tags = ?, raw_meta = ?, rights_status = ?, license_name = ?,
            reuse_policy = ?, content_hash = ?, updated_at = datetime('now')
        WHERE canonical_url = ?
      `).run(
        payload.sourceType,
        payload.platform,
        payload.sourceId,
        payload.title,
        payload.author,
        payload.publishedAt,
        payload.language,
        payload.summary,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.rawMeta),
        payload.rightsStatus,
        payload.licenseName,
        payload.reusePolicy,
        payload.contentHash,
        payload.canonicalUrl
      );
    } else {
      database.prepare(`
        INSERT INTO source_documents (
          id, source_type, platform, source_id, canonical_url, title, author, published_at, language,
          summary, tags, raw_meta, rights_status, license_name, reuse_policy, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        payload.sourceType,
        payload.platform,
        payload.sourceId,
        payload.canonicalUrl,
        payload.title,
        payload.author,
        payload.publishedAt,
        payload.language,
        payload.summary,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.rawMeta),
        payload.rightsStatus,
        payload.licenseName,
        payload.reusePolicy,
        payload.contentHash
      );
    }

    const row = database.prepare(`SELECT * FROM source_documents WHERE canonical_url = ?`).get(payload.canonicalUrl) as RawSourceDocumentRow | undefined;
    return row ? mapSourceDocumentRow(row) : null;
  },

  getById(database: Database.Database = db, id: string) {
    ensureKnowledgeBaseSchema(database);
    const row = database.prepare(`SELECT * FROM source_documents WHERE id = ? LIMIT 1`).get(id) as RawSourceDocumentRow | undefined;
    return row ? mapSourceDocumentRow(row) : null;
  },

  getByCanonicalUrl(database: Database.Database = db, canonicalUrl: string) {
    ensureKnowledgeBaseSchema(database);
    const row = database.prepare(`SELECT * FROM source_documents WHERE canonical_url = ? LIMIT 1`).get(canonicalUrl) as RawSourceDocumentRow | undefined;
    return row ? mapSourceDocumentRow(row) : null;
  },

  list(database: Database.Database = db, filters?: { platform?: string; rightsStatus?: RightsStatus; limit?: number }) {
    ensureKnowledgeBaseSchema(database);
    const clauses: string[] = [];
    const values: Array<string | number> = [];

    if (filters?.platform) {
      clauses.push('platform = ?');
      values.push(filters.platform);
    }
    if (filters?.rightsStatus) {
      clauses.push('rights_status = ?');
      values.push(filters.rightsStatus);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Number.isFinite(filters?.limit) ? `LIMIT ${Math.max(1, filters?.limit || 20)}` : '';
    const rows = database.prepare(`
      SELECT * FROM source_documents
      ${where}
      ORDER BY updated_at DESC, created_at DESC
      ${limit}
    `).all(...values) as RawSourceDocumentRow[];

    return rows.map(mapSourceDocumentRow);
  },
};

export const bibliographyOperations = {
  upsert(database: Database.Database = db, input: UpsertBibliographyEntryInput) {
    ensureKnowledgeBaseSchema(database);

    const slug = sanitizeSlug(input.slug || input.title, 'book');
    const payload = {
      id: input.id || `book_${generateId()}`,
      title: input.title.trim(),
      slug,
      altTitles: uniqueStrings(input.altTitles),
      originalTitle: input.originalTitle?.trim() || null,
      author: input.author?.trim() || null,
      translators: uniqueStrings(input.translators),
      editors: uniqueStrings(input.editors),
      dynastyOrPeriod: input.dynastyOrPeriod?.trim() || null,
      publicationYear: typeof input.publicationYear === 'number' ? input.publicationYear : null,
      editionNote: input.editionNote?.trim() || null,
      publisher: input.publisher?.trim() || null,
      isbn: input.isbn?.trim() || null,
      language: input.language?.trim() || null,
      bookType: input.bookType || 'classic',
      rightsStatus: input.rightsStatus || 'unknown',
      sourceUrl: input.sourceUrl?.trim() || null,
      summary: input.summary?.trim() || null,
      tags: uniqueStrings(input.tags),
      meta: input.meta || {},
    };

    const existing = database.prepare(`
      SELECT id FROM bibliography_entries WHERE slug = ? LIMIT 1
    `).get(payload.slug) as { id: string } | undefined;

    if (existing) {
      database.prepare(`
        UPDATE bibliography_entries
        SET title = ?, alt_titles = ?, original_title = ?, author = ?, translators = ?, editors = ?,
            dynasty_or_period = ?, publication_year = ?, edition_note = ?, publisher = ?, isbn = ?,
            language = ?, book_type = ?, rights_status = ?, source_url = ?, summary = ?, tags = ?,
            meta = ?, updated_at = datetime('now')
        WHERE slug = ?
      `).run(
        payload.title,
        JSON.stringify(payload.altTitles),
        payload.originalTitle,
        payload.author,
        JSON.stringify(payload.translators),
        JSON.stringify(payload.editors),
        payload.dynastyOrPeriod,
        payload.publicationYear,
        payload.editionNote,
        payload.publisher,
        payload.isbn,
        payload.language,
        payload.bookType,
        payload.rightsStatus,
        payload.sourceUrl,
        payload.summary,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.meta),
        payload.slug
      );
    } else {
      database.prepare(`
        INSERT INTO bibliography_entries (
          id, title, slug, alt_titles, original_title, author, translators, editors, dynasty_or_period,
          publication_year, edition_note, publisher, isbn, language, book_type, rights_status,
          source_url, summary, tags, meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        payload.title,
        payload.slug,
        JSON.stringify(payload.altTitles),
        payload.originalTitle,
        payload.author,
        JSON.stringify(payload.translators),
        JSON.stringify(payload.editors),
        payload.dynastyOrPeriod,
        payload.publicationYear,
        payload.editionNote,
        payload.publisher,
        payload.isbn,
        payload.language,
        payload.bookType,
        payload.rightsStatus,
        payload.sourceUrl,
        payload.summary,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.meta)
      );
    }

    const row = database.prepare(`SELECT * FROM bibliography_entries WHERE slug = ?`).get(payload.slug) as RawBibliographyEntryRow | undefined;
    return row ? mapBibliographyRow(row) : null;
  },

  getBySlug(database: Database.Database = db, slug: string) {
    ensureKnowledgeBaseSchema(database);
    const row = database.prepare(`SELECT * FROM bibliography_entries WHERE slug = ? LIMIT 1`).get(slug) as RawBibliographyEntryRow | undefined;
    return row ? mapBibliographyRow(row) : null;
  },

  list(database: Database.Database = db, filters?: { bookType?: BibliographyEntryType; author?: string; limit?: number }) {
    ensureKnowledgeBaseSchema(database);
    const clauses: string[] = [];
    const values: Array<string | number> = [];

    if (filters?.bookType) {
      clauses.push('book_type = ?');
      values.push(filters.bookType);
    }
    if (filters?.author) {
      clauses.push('author = ?');
      values.push(filters.author);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Number.isFinite(filters?.limit) ? `LIMIT ${Math.max(1, filters?.limit || 20)}` : '';
    const rows = database.prepare(`
      SELECT * FROM bibliography_entries
      ${where}
      ORDER BY updated_at DESC, created_at DESC
      ${limit}
    `).all(...values) as RawBibliographyEntryRow[];

    return rows.map(mapBibliographyRow);
  },
};

export const knowledgeEntityOperations = {
  upsert(database: Database.Database = db, input: UpsertKnowledgeEntityInput) {
    ensureKnowledgeBaseSchema(database);

    const slug = sanitizeSlug(input.slug || input.name, input.entityType);
    const payload = {
      id: input.id || `entity_${generateId()}`,
      entityType: input.entityType,
      name: input.name.trim(),
      aliases: uniqueStrings(input.aliases),
      slug,
      summary: input.summary?.trim() || null,
      description: input.description?.trim() || null,
      tags: uniqueStrings(input.tags),
      meta: input.meta || {},
    };

    const existing = database.prepare(`
      SELECT id FROM knowledge_entities WHERE slug = ? LIMIT 1
    `).get(payload.slug) as { id: string } | undefined;

    if (existing) {
      database.prepare(`
        UPDATE knowledge_entities
        SET entity_type = ?, name = ?, aliases = ?, summary = ?, description = ?, tags = ?,
            meta = ?, updated_at = datetime('now')
        WHERE slug = ?
      `).run(
        payload.entityType,
        payload.name,
        JSON.stringify(payload.aliases),
        payload.summary,
        payload.description,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.meta),
        payload.slug
      );
    } else {
      database.prepare(`
        INSERT INTO knowledge_entities (
          id, entity_type, name, aliases, slug, summary, description, tags, meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        payload.entityType,
        payload.name,
        JSON.stringify(payload.aliases),
        payload.slug,
        payload.summary,
        payload.description,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.meta)
      );
    }

    const row = database.prepare(`SELECT * FROM knowledge_entities WHERE slug = ?`).get(payload.slug) as RawKnowledgeEntityRow | undefined;
    return row ? mapKnowledgeEntityRow(row) : null;
  },

  getBySlug(database: Database.Database = db, slug: string) {
    ensureKnowledgeBaseSchema(database);
    const row = database.prepare(`SELECT * FROM knowledge_entities WHERE slug = ? LIMIT 1`).get(slug) as RawKnowledgeEntityRow | undefined;
    return row ? mapKnowledgeEntityRow(row) : null;
  },

  list(database: Database.Database = db, filters?: { entityType?: KnowledgeEntityType; limit?: number }) {
    ensureKnowledgeBaseSchema(database);
    const clauses: string[] = [];
    const values: Array<string | number> = [];

    if (filters?.entityType) {
      clauses.push('entity_type = ?');
      values.push(filters.entityType);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Number.isFinite(filters?.limit) ? `LIMIT ${Math.max(1, filters?.limit || 20)}` : '';
    const rows = database.prepare(`
      SELECT * FROM knowledge_entities
      ${where}
      ORDER BY updated_at DESC, created_at DESC
      ${limit}
    `).all(...values) as RawKnowledgeEntityRow[];

    return rows.map(mapKnowledgeEntityRow);
  },
};

export const knowledgeRelationOperations = {
  create(database: Database.Database = db, input: CreateKnowledgeRelationInput) {
    ensureKnowledgeBaseSchema(database);

    const payload = {
      id: input.id || `relation_${generateId()}`,
      subjectEntityId: input.subjectEntityId,
      relationType: input.relationType.trim(),
      objectEntityId: input.objectEntityId,
      evidenceSourceId: input.evidenceSourceId || null,
      confidenceScore: typeof input.confidenceScore === 'number' ? input.confidenceScore : 0.5,
      meta: input.meta || {},
    };

    const existing = database.prepare(`
      SELECT id FROM knowledge_relations
      WHERE subject_entity_id = ? AND relation_type = ? AND object_entity_id = ?
        AND ((evidence_source_id IS NULL AND ? IS NULL) OR evidence_source_id = ?)
      LIMIT 1
    `).get(
      payload.subjectEntityId,
      payload.relationType,
      payload.objectEntityId,
      payload.evidenceSourceId,
      payload.evidenceSourceId
    ) as { id: string } | undefined;

    if (existing) {
      database.prepare(`
        UPDATE knowledge_relations
        SET confidence_score = ?, meta = ?
        WHERE id = ?
      `).run(
        payload.confidenceScore,
        JSON.stringify(payload.meta),
        existing.id
      );
    } else {
      database.prepare(`
        INSERT INTO knowledge_relations (
          id, subject_entity_id, relation_type, object_entity_id, evidence_source_id, confidence_score, meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.id,
        payload.subjectEntityId,
        payload.relationType,
        payload.objectEntityId,
        payload.evidenceSourceId,
        payload.confidenceScore,
        JSON.stringify(payload.meta)
      );
    }

    const row = database.prepare(`
      SELECT * FROM knowledge_relations
      WHERE subject_entity_id = ? AND relation_type = ? AND object_entity_id = ?
        AND ((evidence_source_id IS NULL AND ? IS NULL) OR evidence_source_id = ?)
      LIMIT 1
    `).get(
      payload.subjectEntityId,
      payload.relationType,
      payload.objectEntityId,
      payload.evidenceSourceId,
      payload.evidenceSourceId
    ) as RawKnowledgeRelationRow | undefined;

    return row ? mapKnowledgeRelationRow(row) : null;
  },

  listForEntity(database: Database.Database = db, entityId: string) {
    ensureKnowledgeBaseSchema(database);
    const rows = database.prepare(`
      SELECT * FROM knowledge_relations
      WHERE subject_entity_id = ? OR object_entity_id = ?
      ORDER BY created_at DESC
    `).all(entityId, entityId) as RawKnowledgeRelationRow[];

    return rows.map(mapKnowledgeRelationRow);
  },
};
