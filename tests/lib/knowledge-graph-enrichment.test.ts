import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import { sourceDocumentOperations } from '@/lib/knowledge-base-store';
import { extractKnowledgeObjectsFromSourceDocuments } from '@/lib/knowledge-object-extraction';
import { enrichKnowledgeGraph } from '@/lib/knowledge-graph-enrichment';
import { buildKnowledgeSynthesisSnapshot } from '@/lib/knowledge-synthesis';

describe('knowledge graph enrichment', () => {
  test('builds related topic bridges from shared concepts', () => {
    const testDb = new Database(':memory:');
    const sourceA = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/topic-a',
      title: '八字和真太阳时到底怎么看？',
      summary: '围绕八字、真太阳时、节气和命理入门的高频问题。',
      tags: ['八字', '真太阳时', '节气'],
      rightsStatus: 'platform_restricted',
    });
    const sourceB = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/topic-b',
      title: '命理方法论里为什么总强调真太阳时边界？',
      summary: '围绕方法论、边界、真太阳时与验证问题的讨论。',
      tags: ['方法论', '边界', '真太阳时'],
      rightsStatus: 'platform_restricted',
    });

    extractKnowledgeObjectsFromSourceDocuments(
      [sourceA, sourceB].filter(Boolean) as NonNullable<typeof sourceA>[],
      testDb
    );

    const result = enrichKnowledgeGraph({ topicLimit: 8 }, testDb);
    const snapshot = buildKnowledgeSynthesisSnapshot({ topicLimit: 8 }, testDb);

    expect(result.relatedTopicEdges.length).toBeGreaterThan(0);
    expect(result.relatedTopicEdges.some((item) => item.sharedConcepts.length > 0)).toBe(true);
    expect(snapshot.topics.some((item) => item.relatedTopics.length > 0)).toBe(true);

    testDb.close();
  });
});
