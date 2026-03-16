import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  bibliographyOperations,
  knowledgeEntityOperations,
  sourceDocumentOperations,
} from '@/lib/knowledge-base-store';
import { buildAutoReferenceCorpusFromKnowledgeBase } from '@/lib/reference-corpus-builder';

describe('reference corpus builder', () => {
  test('selects reference materials aligned with timing, geography, relationship, and metaphysics hints', () => {
    const testDb = new Database(':memory:');

    sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'zhihu',
      sourceId: 'zhihu-1',
      canonicalUrl: 'https://www.zhihu.com/question/solar-time',
      title: '真太阳时、城市迁移与节气边界怎么影响判断',
      summary: '围绕真太阳时、节气、城市迁移与时机窗口展开。',
      tags: ['真太阳时', '节气', '城市', 'domain:metaphysics'],
      rightsStatus: 'platform_restricted',
      publishedAt: '2026-03-14T00:00:00.000Z',
    });
    sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'reddit',
      sourceId: 'reddit-1',
      canonicalUrl: 'https://www.reddit.com/r/example/cooperation',
      title: '合作边界、关系节奏和团队压力如何处理',
      summary: '讨论关系、合作、团队与压力管理。',
      tags: ['合作', '关系', '压力', 'domain:psychology'],
      rightsStatus: 'platform_restricted',
      publishedAt: '2026-03-13T00:00:00.000Z',
    });
    sourceDocumentOperations.upsert(testDb, {
      sourceType: 'site',
      platform: 'github',
      sourceId: 'github-1',
      canonicalUrl: 'https://github.com/example/javascript-build',
      title: 'JavaScript bundler optimization checklist',
      summary: '讨论打包体积、构建缓存与前端性能优化。',
      tags: ['javascript', 'performance'],
      rightsStatus: 'open_license',
      publishedAt: '2026-03-10T00:00:00.000Z',
    });

    bibliographyOperations.upsert(testDb, {
      title: '滴天髓',
      slug: 'di-tian-sui',
      author: '京图',
      summary: '经典命理文本，常用于理解真太阳时、节气、流年、城市迁移与时机判断。',
      tags: ['命理', '真太阳时', '节气', '流年', '城市', '时机'],
      bookType: 'classic',
      rightsStatus: 'public_domain',
      sourceUrl: 'https://ctext.org/example/ditiansui',
    });
    bibliographyOperations.upsert(testDb, {
      title: '统计学习方法',
      slug: 'statistical-learning-methods',
      author: '某作者',
      summary: '讨论监督学习与优化问题。',
      tags: ['统计', '机器学习'],
      bookType: 'research',
      rightsStatus: 'licensed',
      sourceUrl: 'https://example.com/statistics-book',
    });

    knowledgeEntityOperations.upsert(testDb, {
      entityType: 'topic',
      name: '天时判断',
      summary: '讨论真太阳时、节气、流年和时机。',
      tags: ['真太阳时', '节气'],
    });
    knowledgeEntityOperations.upsert(testDb, {
      entityType: 'concept',
      name: '合作边界',
      summary: '讨论关系、合作、团队协同与互动压力。',
      tags: ['关系', '合作'],
    });
    knowledgeEntityOperations.upsert(testDb, {
      entityType: 'topic',
      name: 'JavaScript 工程',
      summary: '讨论工程实践与构建流程。',
      tags: ['javascript'],
    });

    expect(bibliographyOperations.list(testDb, { limit: 10 })).toHaveLength(2);

    const corpus = buildAutoReferenceCorpusFromKnowledgeBase({
      birthPlace: '北京',
      currentPlace: '上海',
      industries: ['科技'],
      report: {
        advice: {
          career: {
            general: '当前要注意城市迁移、节气窗口和推进时机。',
          },
          marriage: {
            general: '关系节奏、合作边界和互动质量都很关键。',
          },
        },
        fortune: {
          currentLiuNian: '丙午',
          interaction: '当前窗口适合顺势推进。',
        },
      },
      maxSourceDocuments: 3,
      maxBibliographyEntries: 2,
      maxEntities: 3,
    }, testDb);

    expect(corpus.sourceDocuments?.map((item) => item.title)).toContain('真太阳时、城市迁移与节气边界怎么影响判断');
    expect(corpus.sourceDocuments?.map((item) => item.title)).toContain('合作边界、关系节奏和团队压力如何处理');
    expect(corpus.sourceDocuments?.map((item) => item.title)).not.toContain('JavaScript bundler optimization checklist');

    expect(corpus.bibliographyEntries?.map((item) => item.title)).toContain('滴天髓');
    expect(corpus.bibliographyEntries?.map((item) => item.title)).not.toContain('统计学习方法');

    expect(corpus.entities?.map((item) => item.name)).toContain('天时判断');
    expect(corpus.entities?.map((item) => item.name)).toContain('合作边界');
    expect(corpus.entities?.map((item) => item.name)).not.toContain('JavaScript 工程');

    expect(corpus.focusPlaces).toEqual(expect.arrayContaining(['北京', '上海']));
    expect(corpus.focusIndustries).toEqual(['科技']);

    testDb.close();
  });
});
