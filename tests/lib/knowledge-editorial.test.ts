import { describe, expect, test } from '@jest/globals';
import {
  deleteManagedContentEntry,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';
import {
  listFeaturedKnowledgeEditorialEntries,
  selectKnowledgePublicationBatch,
} from '@/lib/knowledge-editorial';

function buildDraftEntry(
  id: string,
  slug: string,
  topicEntityId: string,
  topicName: string,
  synthesisType: string,
  qualityScore: number
): ManagedContentEntry {
  const now = new Date().toISOString();

  return {
    id,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${topicName}${synthesisType}`,
    name: null,
    excerpt: `${topicName} ${synthesisType} 摘要。`,
    category: '自动知识内容',
    readTime: '6 分钟',
    tags: [topicName, synthesisType, '测试', '命理'],
    featured: false,
    seoTitle: `${topicName}${synthesisType}`,
    seoDescription: `${topicName}${synthesisType} 描述。`,
    sections: [
      { title: 'A', paragraphs: ['a'] },
      { title: 'B', paragraphs: ['b'] },
      { title: 'C', paragraphs: ['c'] },
      { title: 'D', paragraphs: ['d'] },
    ],
    status: 'draft',
    source: `knowledge-synthesis:${synthesisType}`,
    meta: {
      synthesisType,
      topicEntityId,
      topicName,
      qualityScore,
      conceptCount: 5,
      questionCount: 4,
      relatedTopicCount: 1,
      publishCandidate: true,
    },
    createdBy: 'test_user',
    updatedBy: 'test_user',
    createdAt: now,
    updatedAt: now,
  };
}

describe('knowledge editorial', () => {
  test('selects a diverse publication batch instead of overfilling one topic', () => {
    const batch = selectKnowledgePublicationBatch([
      buildDraftEntry('a', 'topic-a-overview', 'topic_a', '主题A', 'topic-overview', 95),
      buildDraftEntry('b', 'topic-a-glossary', 'topic_a', '主题A', 'concept-glossary', 94),
      buildDraftEntry('c', 'topic-a-book-path', 'topic_a', '主题A', 'book-path', 93),
      buildDraftEntry('d', 'topic-b-overview', 'topic_b', '主题B', 'topic-overview', 89),
      buildDraftEntry('e', 'topic-c-overview', 'topic_c', '主题C', 'topic-overview', 88),
    ], { limit: 3, maxPerTopic: 2 });

    expect(batch).toHaveLength(3);
    expect(batch.map((item) => item.entry.slug)).toContain('topic-a-overview');
    expect(batch.map((item) => item.entry.slug)).toContain('topic-b-overview');
    expect(batch.map((item) => item.entry.slug)).toContain('topic-c-overview');
    expect(batch.map((item) => item.entry.slug)).not.toContain('topic-a-book-path');
  });

  test('picks homepage knowledge entries from auto-published structured content', () => {
    const ids = [
      'content_test_editorial_home_a',
      'content_test_editorial_home_b',
    ];

    try {
      saveManagedContentEntry({
        ...buildDraftEntry(ids[0], 'editorial-home-a', 'topic_home_a', '首页主题A', 'topic-overview', 96),
        status: 'published',
        meta: {
          ...buildDraftEntry(ids[0], 'editorial-home-a', 'topic_home_a', '首页主题A', 'topic-overview', 96).meta,
          publicationReady: true,
        },
      }, 'test_user');
      saveManagedContentEntry({
        ...buildDraftEntry(ids[1], 'editorial-home-b', 'topic_home_b', '首页主题B', 'concept-glossary', 91),
        status: 'published',
        meta: {
          ...buildDraftEntry(ids[1], 'editorial-home-b', 'topic_home_b', '首页主题B', 'concept-glossary', 91).meta,
          publicationReady: true,
        },
      }, 'test_user');

      const featured = listFeaturedKnowledgeEditorialEntries(2);
      expect(featured.length).toBeGreaterThanOrEqual(2);
      expect(featured.map((item) => item.entry.slug)).toContain('editorial-home-a');
      expect(featured.map((item) => item.entry.slug)).toContain('editorial-home-b');
    } finally {
      ids.forEach((id) => {
        deleteManagedContentEntry(id);
      });
    }
  });
});
