import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import { sourceDocumentOperations } from '@/lib/knowledge-base-store';
import { extractKnowledgeObjectsFromSourceDocuments } from '@/lib/knowledge-object-extraction';

describe('knowledge object extraction', () => {
  test('extracts topics, questions, concepts, books and relations from source documents', () => {
    const testDb = new Database(':memory:');
    const source = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/123456',
      title: '八字入门先看什么？《滴天髓》还是《子平真诠》',
      summary: '围绕八字、用神、真太阳时和入门书单的高频问题。',
      tags: ['八字', '用神', '真太阳时', '书单'],
      rightsStatus: 'platform_restricted',
    });

    const result = extractKnowledgeObjectsFromSourceDocuments(source ? [source] : [], testDb);

    expect(result.topics.some((item) => item.entityType === 'topic')).toBe(true);
    expect(result.questions.some((item) => item.entityType === 'question')).toBe(true);
    expect(result.concepts.some((item) => item.name === '用神')).toBe(true);
    expect(result.books.some((item) => item.title === '滴天髓')).toBe(true);
    expect(result.textEntities.some((item) => item.name === '子平真诠')).toBe(true);
    expect(result.relationCount).toBeGreaterThan(0);

    testDb.close();
  });
});
