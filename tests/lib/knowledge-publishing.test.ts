import { describe, expect, test } from '@jest/globals';
import {
  assessKnowledgeDraftInput,
  decorateKnowledgeDraftInput,
} from '@/lib/knowledge-publishing';

describe('knowledge publishing', () => {
  test('scores structured drafts as publish candidates', () => {
    const assessment = assessKnowledgeDraftInput({
      id: 'draft_1',
      contentType: 'knowledge',
      subtype: null,
      slug: 'fundamentals-topic-overview',
      title: '基础原理专题总览',
      name: null,
      excerpt: '围绕基础原理自动整理概念、问题和书目骨架，作为后续专题页与知识链扩张的总入口。',
      category: '自动专题总览',
      readTime: '7 分钟',
      tags: ['基础原理', '专题总览', '五行', '阴阳'],
      featured: false,
      seoTitle: '基础原理专题总览：概念、问题与书目骨架',
      seoDescription: '自动生成基础原理的专题总览，汇总核心概念、高频问题和书目线索，作为知识引擎持续扩张的主入口。',
      sections: [
        { title: 'A', paragraphs: ['a'] },
        { title: 'B', paragraphs: ['b'] },
        { title: 'C', paragraphs: ['c'] },
        { title: 'D', paragraphs: ['d'] },
      ],
      status: 'draft',
      meta: {
        conceptCount: 6,
        questionCount: 4,
        bookCount: 3,
        relatedTopicCount: 2,
      },
    }, { publishThreshold: 78 });

    expect(assessment.score).toBeGreaterThanOrEqual(78);
    expect(assessment.candidate).toBe(true);
  });

  test('decorates draft meta with publish candidate markers', () => {
    const decorated = decorateKnowledgeDraftInput({
      id: 'draft_2',
      contentType: 'knowledge',
      subtype: null,
      slug: 'methodology-concept-glossary',
      title: '方法论概念词汇表',
      name: null,
      excerpt: '围绕方法论自动整理概念词汇表。',
      category: '自动概念词汇表',
      readTime: '7 分钟',
      tags: ['方法论', '概念词汇表', '边界'],
      featured: false,
      seoTitle: '方法论概念词汇表',
      seoDescription: '自动整理方法论相关的概念词汇和相邻专题。',
      sections: [
        { title: 'A', paragraphs: ['a'] },
        { title: 'B', paragraphs: ['b'] },
        { title: 'C', paragraphs: ['c'] },
        { title: 'D', paragraphs: ['d'] },
      ],
      status: 'draft',
      meta: {
        conceptCount: 5,
        relatedTopicCount: 1,
      },
    }, { publishThreshold: 50, autoPublish: false });

    expect(typeof decorated.meta?.qualityScore).toBe('number');
    expect(decorated.meta?.publishCandidate).toBe(true);
    expect(Array.isArray(decorated.meta?.publishReasons)).toBe(true);
    expect(decorated.status).toBe('draft');
  });
});
