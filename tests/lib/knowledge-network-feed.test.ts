import { describe, expect, test } from '@jest/globals';
import {
  deleteManagedContentEntry,
  saveManagedContentEntry,
} from '@/lib/content-store';
import {
  getKnowledgeTopicHubByTopicSlug,
  getKnowledgeTopicHubBySlug,
  getRelatedKnowledgeEntries,
  listKnowledgeTopicHubRoutes,
  listKnowledgeTopicHubs,
} from '@/lib/knowledge-network-feed';

describe('knowledge network feed', () => {
  test('groups published synthesis entries into topic hubs and builds related reading links', () => {
    const createdIds = [
      'content_test_topic_hub_overview',
      'content_test_topic_hub_glossary',
      'content_test_topic_hub_other',
    ];

    try {
      saveManagedContentEntry({
        id: createdIds[0],
        contentType: 'knowledge',
        subtype: null,
        slug: 'test-metaphysics-topic-overview',
        title: '命理基础专题总览',
        name: null,
        excerpt: '总览命理基础、真太阳时与节气判断。',
        category: '自动专题总览',
        readTime: '6 分钟',
        tags: ['命理', '真太阳时', '节气'],
        featured: true,
        seoTitle: '命理基础专题总览',
        seoDescription: '命理基础专题总览。',
        sections: [{ title: 'A', paragraphs: ['a'] }],
        status: 'published',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          synthesisType: 'topic-overview',
          topicEntityId: 'topic_metaphysics_base',
          topicName: '命理基础',
          relatedTopicNames: ['关系节奏'],
          qualityScore: 92,
          conceptCount: 4,
          questionCount: 2,
          publicationReady: true,
        },
      }, 'test_user');

      saveManagedContentEntry({
        id: createdIds[1],
        contentType: 'knowledge',
        subtype: null,
        slug: 'test-metaphysics-concept-glossary',
        title: '命理基础概念词汇表',
        name: null,
        excerpt: '汇总命理基础概念与术语。',
        category: '自动概念词汇表',
        readTime: '7 分钟',
        tags: ['命理', '概念', '真太阳时'],
        featured: false,
        seoTitle: '命理基础概念词汇表',
        seoDescription: '命理基础概念词汇表。',
        sections: [{ title: 'A', paragraphs: ['a'] }],
        status: 'published',
        source: 'knowledge-synthesis:concept-glossary',
        meta: {
          synthesisType: 'concept-glossary',
          topicEntityId: 'topic_metaphysics_base',
          topicName: '命理基础',
          relatedTopicNames: ['关系节奏'],
          qualityScore: 88,
          conceptCount: 4,
          questionCount: 2,
          publicationReady: true,
        },
      }, 'test_user');

      saveManagedContentEntry({
        id: createdIds[2],
        contentType: 'knowledge',
        subtype: null,
        slug: 'test-relationship-topic-overview',
        title: '关系节奏专题总览',
        name: null,
        excerpt: '总览关系节奏、合作边界与互动质量。',
        category: '自动专题总览',
        readTime: '6 分钟',
        tags: ['关系', '合作', '节奏'],
        featured: false,
        seoTitle: '关系节奏专题总览',
        seoDescription: '关系节奏专题总览。',
        sections: [{ title: 'A', paragraphs: ['a'] }],
        status: 'published',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          synthesisType: 'topic-overview',
          topicEntityId: 'topic_relationship_rhythm',
          topicName: '关系节奏',
          relatedTopicNames: ['命理基础'],
          qualityScore: 84,
          conceptCount: 4,
          questionCount: 2,
          publicationReady: true,
        },
      }, 'test_user');

      const hubs = listKnowledgeTopicHubs({ limit: 10 });
      const hub = hubs.find((item) => item.topicEntityId === 'topic_metaphysics_base');

      expect(hub).not.toBeNull();
      expect(hub?.topicName).toBe('命理基础');
      expect(hub?.entryCount).toBe(2);
      expect(hub?.entries[0]?.entry.slug).toBe('test-metaphysics-topic-overview');
      expect(hub?.relatedTopicNames).toContain('关系节奏');

      const currentHub = getKnowledgeTopicHubBySlug('test-metaphysics-concept-glossary');
      expect(currentHub?.topicName).toBe('命理基础');
      expect(currentHub?.topicSlug).toContain('topic-metaphysics-base');

      const currentHubByTopicSlug = getKnowledgeTopicHubByTopicSlug(currentHub?.topicSlug || '');
      expect(currentHubByTopicSlug?.topicName).toBe('命理基础');

      const routes = listKnowledgeTopicHubRoutes(10);
      expect(routes.some((item) => item.topicSlug === currentHub?.topicSlug)).toBe(true);

      const related = getRelatedKnowledgeEntries('test-metaphysics-topic-overview', 4);
      expect(related.map((item) => item.entry.slug)).toContain('test-metaphysics-concept-glossary');
      expect(related.map((item) => item.entry.slug)).toContain('test-relationship-topic-overview');
    } finally {
      createdIds.forEach((id) => {
        deleteManagedContentEntry(id);
      });
    }
  });
});
