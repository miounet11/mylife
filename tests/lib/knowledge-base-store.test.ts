import { afterEach, describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  bibliographyOperations,
  ensureKnowledgeBaseSchema,
  knowledgeEntityOperations,
  knowledgeRelationOperations,
  sourceDocumentOperations,
} from '@/lib/knowledge-base-store';

describe('knowledge base store', () => {
  let testDb: Database.Database;

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
  });

  test('upserts source documents by canonical url', () => {
    testDb = new Database(':memory:');
    ensureKnowledgeBaseSchema(testDb);

    const created = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/123',
      title: '八字入门看什么书',
      summary: '围绕入门书单与常见误区的提问。',
      tags: ['八字', '书单', '入门'],
      rightsStatus: 'platform_restricted',
    });

    const updated = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/123',
      title: '八字入门最该先看什么书',
      summary: '更新后的标题与摘要。',
      tags: ['八字', '书单', '入门'],
      rightsStatus: 'platform_restricted',
    });

    const listed = sourceDocumentOperations.list(testDb, { platform: 'zhihu' });

    expect(created?.id).toBe(updated?.id);
    expect(updated?.title).toContain('最该');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.canonicalUrl).toBe('https://www.zhihu.com/question/123');
  });

  test('upserts bibliography entries by slug and preserves normalized arrays', () => {
    testDb = new Database(':memory:');
    ensureKnowledgeBaseSchema(testDb);

    const created = bibliographyOperations.upsert(testDb, {
      title: '滴天髓',
      slug: 'di-tian-sui',
      altTitles: ['滴天髓阐微', '滴天髓'],
      author: '京图',
      translators: ['张三', '张三'],
      tags: ['子平', '经典'],
      rightsStatus: 'public_domain',
    });

    const loaded = bibliographyOperations.getBySlug(testDb, created?.slug || '');

    expect(created?.slug).toBe('di-tian-sui');
    expect(loaded?.altTitles).toEqual(['滴天髓阐微', '滴天髓']);
    expect(loaded?.translators).toEqual(['张三']);
  });

  test('generates stable fallback slugs for Chinese bibliography titles without collisions', () => {
    testDb = new Database(':memory:');
    ensureKnowledgeBaseSchema(testDb);

    const first = bibliographyOperations.upsert(testDb, {
      title: '穷通宝鉴',
      author: '佚名',
      rightsStatus: 'public_domain',
    });
    const second = bibliographyOperations.upsert(testDb, {
      title: '子平真诠',
      author: '佚名',
      rightsStatus: 'public_domain',
    });

    const listed = bibliographyOperations.list(testDb, { limit: 10 });

    expect(first?.slug).toMatch(/^book-/);
    expect(second?.slug).toMatch(/^book-/);
    expect(first?.slug).not.toBe(second?.slug);
    expect(listed).toHaveLength(2);
  });

  test('creates entities and deduplicated relations', () => {
    testDb = new Database(':memory:');
    ensureKnowledgeBaseSchema(testDb);

    const concept = knowledgeEntityOperations.upsert(testDb, {
      entityType: 'concept',
      name: '用神',
      aliases: ['喜用神', '用神'],
      tags: ['八字', '核心概念'],
    });

    const book = knowledgeEntityOperations.upsert(testDb, {
      entityType: 'text',
      name: '子平真诠',
      tags: ['子平', '经典'],
    });

    const relationA = knowledgeRelationOperations.create(testDb, {
      subjectEntityId: book?.id || '',
      relationType: 'discusses',
      objectEntityId: concept?.id || '',
      confidenceScore: 0.82,
      meta: { chapterHint: '卷一' },
    });

    const relationB = knowledgeRelationOperations.create(testDb, {
      subjectEntityId: book?.id || '',
      relationType: 'discusses',
      objectEntityId: concept?.id || '',
      confidenceScore: 0.91,
      meta: { chapterHint: '卷二' },
    });

    const relations = knowledgeRelationOperations.listForEntity(testDb, book?.id || '');

    expect(concept?.aliases).toEqual(['喜用神', '用神']);
    expect(relationA?.id).toBe(relationB?.id);
    expect(relations).toHaveLength(1);
    expect(relations[0]?.confidenceScore).toBe(0.91);
  });
});
