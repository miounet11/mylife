import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import { sourceDocumentOperations } from '@/lib/knowledge-base-store';
import { extractKnowledgeObjectsFromSourceDocuments } from '@/lib/knowledge-object-extraction';
import {
  buildKnowledgeSynthesisDraftInputs,
  buildKnowledgeSynthesisSnapshot,
} from '@/lib/knowledge-synthesis';

describe('knowledge synthesis', () => {
  test('builds topic packs and draft inputs from extracted knowledge objects', () => {
    const testDb = new Database(':memory:');
    const source = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-search',
      canonicalUrl: 'https://www.zhihu.com/question/654321',
      title: '八字入门先看什么？《滴天髓》和《子平真诠》有什么区别',
      summary: '围绕八字、用神、真太阳时和入门书单的用户问题。',
      tags: ['八字', '用神', '真太阳时', '书单'],
      rightsStatus: 'platform_restricted',
    });
    const source2 = sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'bilibili',
      sourceId: 'bilibili-search',
      canonicalUrl: 'https://www.bilibili.com/video/topic-2',
      title: '真太阳时到底要不要校正？《穷通宝鉴》适合入门吗',
      summary: '继续围绕真太阳时、八字和入门书单补充问题与书籍线索。',
      tags: ['真太阳时', '八字', '穷通宝鉴', '入门'],
      rightsStatus: 'platform_restricted',
    });

    extractKnowledgeObjectsFromSourceDocuments(
      [source, source2].filter(Boolean) as NonNullable<typeof source>[],
      testDb
    );

    const snapshot = buildKnowledgeSynthesisSnapshot({ topicLimit: 3 }, testDb);
    const drafts = buildKnowledgeSynthesisDraftInputs({ topicLimit: 3 }, testDb);

    expect(snapshot.topics.length).toBeGreaterThan(0);
    expect(snapshot.topics[0]?.questions.length).toBeGreaterThan(0);
    expect(snapshot.topics[0]?.concepts.length).toBeGreaterThan(0);
    expect(drafts.drafts.some((item) => item.category === '自动专题总览')).toBe(true);
    expect(drafts.drafts.some((item) => item.category === '自动概念词汇表')).toBe(true);
    expect(drafts.drafts.some((item) => item.category === '自动问题地图')).toBe(true);
    expect(drafts.drafts.some((item) => item.category === '自动问题簇综述')).toBe(true);
    expect(drafts.drafts.some((item) => item.category === '自动书单路径')).toBe(true);
    expect(drafts.drafts.some((item) => item.category === '自动书目阶梯')).toBe(true);
    expect(drafts.drafts.length).toBeGreaterThanOrEqual(6);
    expect(drafts.drafts.every((item) => typeof item.meta?.qualityScore === 'number')).toBe(true);
    expect(drafts.drafts.every((item) => item.slug !== 'question-map' && item.slug !== 'book-path')).toBe(true);

    testDb.close();
  });
});
