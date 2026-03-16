import { describe, expect, test } from '@jest/globals';
import {
  deleteManagedContentEntry,
  listManagedContentEntries,
  saveManagedContentEntry,
} from '@/lib/content-store';
import {
  listKnowledgePublishCandidates,
  runKnowledgePublicationCycle,
} from '@/lib/knowledge-publication-ops';

describe('knowledge publication ops', () => {
  test('publishes only allowed synthesis candidates', () => {
    const originalAllowed = process.env.KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES;
    const originalBatch = process.env.KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE;

    process.env.KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES = 'topic-overview,book-path';
    process.env.KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE = '5';
    try {
      const entryA = saveManagedContentEntry({
        id: 'content_test_topic_overview',
        contentType: 'knowledge',
        subtype: null,
        slug: 'test-topic-overview',
        title: '测试专题总览',
        name: null,
        excerpt: '测试专题总览摘要。',
        category: '自动专题总览',
        readTime: '6 分钟',
        tags: ['测试'],
        featured: false,
        seoTitle: '测试专题总览',
        seoDescription: '测试专题总览描述。',
        sections: [
          { title: 'A', paragraphs: ['a'] },
          { title: 'B', paragraphs: ['b'] },
          { title: 'C', paragraphs: ['c'] },
          { title: 'D', paragraphs: ['d'] },
        ],
        status: 'draft',
        source: 'knowledge-synthesis:topic-overview',
        meta: {
          synthesisType: 'topic-overview',
          qualityScore: 91,
          conceptCount: 4,
          questionCount: 2,
          publishCandidate: true,
        },
      }, 'test_user');

      const entryB = saveManagedContentEntry({
        id: 'content_test_question_cluster',
        contentType: 'knowledge',
        subtype: null,
        slug: 'test-question-cluster',
        title: '测试问题簇综述',
        name: null,
        excerpt: '测试问题簇综述摘要。',
        category: '自动问题簇综述',
        readTime: '6 分钟',
        tags: ['测试'],
        featured: false,
        seoTitle: '测试问题簇综述',
        seoDescription: '测试问题簇综述描述。',
        sections: [
          { title: 'A', paragraphs: ['a'] },
          { title: 'B', paragraphs: ['b'] },
          { title: 'C', paragraphs: ['c'] },
          { title: 'D', paragraphs: ['d'] },
        ],
        status: 'draft',
        source: 'knowledge-synthesis:question-clusters',
        meta: {
          synthesisType: 'question-clusters',
          qualityScore: 92,
          conceptCount: 4,
          questionCount: 2,
          publishCandidate: true,
        },
      }, 'test_user');

      expect(entryA).not.toBeNull();
      expect(entryB).not.toBeNull();

      const candidates = listKnowledgePublishCandidates({ limit: 10 });
      expect(candidates.some((item) => item.synthesisType === 'topic-overview')).toBe(true);
      expect(candidates.some((item) => item.synthesisType === 'question-clusters')).toBe(false);

      const result = runKnowledgePublicationCycle({ userId: 'test_user', limit: 10 });
      expect(result.publishedEntries.some((item) => item.slug === 'test-topic-overview')).toBe(true);
      expect(result.publishedEntries.some((item) => item.slug === 'test-question-cluster')).toBe(false);

      const published = listManagedContentEntries().find((item) => item.slug === 'test-topic-overview');
      const stillDraft = listManagedContentEntries().find((item) => item.slug === 'test-question-cluster');
      expect(published?.status).toBe('published');
      expect(typeof published?.meta?.editorialScore).toBe('number');
      expect(published?.meta?.homepageEligible).toBe(true);
      expect(published?.meta?.publicationReady).toBe(true);
      expect(stillDraft?.status).toBe('draft');
    } finally {
      deleteManagedContentEntry('content_test_topic_overview');
      deleteManagedContentEntry('content_test_question_cluster');
      process.env.KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES = originalAllowed;
      process.env.KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE = originalBatch;
    }
  });
});
