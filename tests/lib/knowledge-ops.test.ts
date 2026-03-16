import { afterEach, describe, expect, test } from '@jest/globals';
import {
  deleteManagedContentEntry,
  saveManagedContentEntry,
} from '@/lib/content-store';
import { getKnowledgeOpsSnapshot } from '@/lib/knowledge-ops';
import {
  releaseKnowledgeAcquisitionLock,
  writeKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';

describe('knowledge ops snapshot', () => {
  afterEach(() => {
    deleteManagedContentEntry('content_test_ops_published');
    deleteManagedContentEntry('content_test_ops_draft');
    releaseKnowledgeAcquisitionLock();
  });

  test('summarizes knowledge runtime, queue and featured topics', () => {
    saveManagedContentEntry({
      id: 'content_test_ops_published',
      contentType: 'knowledge',
      subtype: null,
      slug: 'ops-published-topic-overview',
      title: '运行主题专题总览',
      name: null,
      excerpt: '运行主题专题总览摘要。',
      category: '自动专题总览',
      readTime: '6 分钟',
      tags: ['运行主题', '专题总览', '命理', '测试'],
      featured: true,
      seoTitle: '运行主题专题总览',
      seoDescription: '运行主题专题总览描述。',
      sections: [
        { title: 'A', paragraphs: ['a'] },
        { title: 'B', paragraphs: ['b'] },
        { title: 'C', paragraphs: ['c'] },
        { title: 'D', paragraphs: ['d'] },
      ],
      status: 'published',
      source: 'knowledge-synthesis:topic-overview',
      meta: {
        synthesisType: 'topic-overview',
        topicEntityId: 'topic_ops_runtime',
        topicName: '运行主题',
        relatedTopicNames: ['关系节奏'],
        qualityScore: 95,
        editorialScore: 106,
        editorialTier: 'flagship',
        homepageEligible: true,
      },
    }, 'test_user');

    saveManagedContentEntry({
      id: 'content_test_ops_draft',
      contentType: 'knowledge',
      subtype: null,
      slug: 'ops-draft-glossary',
      title: '运行主题概念词汇表',
      name: null,
      excerpt: '运行主题概念词汇表摘要。',
      category: '自动概念词汇表',
      readTime: '6 分钟',
      tags: ['运行主题', '概念词汇表', '命理', '测试'],
      featured: false,
      seoTitle: '运行主题概念词汇表',
      seoDescription: '运行主题概念词汇表描述。',
      sections: [
        { title: 'A', paragraphs: ['a'] },
        { title: 'B', paragraphs: ['b'] },
        { title: 'C', paragraphs: ['c'] },
        { title: 'D', paragraphs: ['d'] },
      ],
      status: 'draft',
      source: 'knowledge-synthesis:concept-glossary',
      meta: {
        synthesisType: 'concept-glossary',
        topicEntityId: 'topic_ops_runtime',
        topicName: '运行主题',
        qualityScore: 88,
        publishCandidate: true,
      },
    }, 'test_user');

    writeKnowledgeAcquisitionSnapshot({
      status: 'success',
      runId: 'knowledge_ops_snapshot_run',
      pid: process.pid,
      startedAt: new Date(Date.now() - 3000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 3000,
      cycle: { publishedCount: 1 },
    });

    const snapshot = getKnowledgeOpsSnapshot({ lockTtlMs: 60_000 });

    expect(snapshot.metrics.publishedKnowledgeEntries).toBeGreaterThanOrEqual(1);
    expect(snapshot.metrics.draftKnowledgeEntries).toBeGreaterThanOrEqual(1);
    expect(snapshot.metrics.publishCandidateCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.metrics.topicHubCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.acquisition.status).toBe('success');
    expect(snapshot.featuredTopics.some((item) => item.topicName === '运行主题')).toBe(true);
    expect(snapshot.publishQueue.some((item) => item.slug === 'ops-draft-glossary')).toBe(true);
  });
});
