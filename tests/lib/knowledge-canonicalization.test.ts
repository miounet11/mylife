import { describe, expect, test } from '@jest/globals';
import {
  clusterBibliographyEntries,
  dedupeKnowledgeEntities,
  normalizeKnowledgeLabel,
} from '@/lib/knowledge-canonicalization';

describe('knowledge canonicalization', () => {
  test('normalizes labels conservatively across punctuation and spacing', () => {
    expect(normalizeKnowledgeLabel('《滴天髓》')).toBe('滴天髓');
    expect(normalizeKnowledgeLabel(' AI Agent ')).toBe('aiagent');
  });

  test('dedupes knowledge entities by canonical label', () => {
    const deduped = dedupeKnowledgeEntities([
      {
        id: 'entity_1',
        entityType: 'concept',
        name: '真太阳时',
        aliases: [],
        slug: 'concept-zhen-tai-yang-shi-a',
        summary: 'A',
        description: null,
        tags: [],
        meta: {},
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-15T00:00:00.000Z',
      },
      {
        id: 'entity_2',
        entityType: 'concept',
        name: '真太阳时',
        aliases: ['真太陽時'],
        slug: 'concept-zhen-tai-yang-shi-b',
        summary: 'B',
        description: null,
        tags: [],
        meta: {},
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.id).toBe('entity_2');
  });

  test('clusters bibliography entries with matching titles', () => {
    const clusters = clusterBibliographyEntries([
      {
        id: 'book_1',
        title: '滴天髓',
        slug: 'di-tian-sui-a',
        altTitles: [],
        originalTitle: null,
        author: null,
        translators: [],
        editors: [],
        dynastyOrPeriod: null,
        publicationYear: null,
        editionNote: null,
        publisher: null,
        isbn: null,
        language: null,
        bookType: 'classic',
        rightsStatus: 'unknown',
        sourceUrl: null,
        summary: null,
        tags: [],
        meta: {},
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-15T00:00:00.000Z',
      },
      {
        id: 'book_2',
        title: '《滴天髓》',
        slug: 'di-tian-sui-b',
        altTitles: ['滴天髓'],
        originalTitle: null,
        author: null,
        translators: [],
        editors: [],
        dynastyOrPeriod: null,
        publicationYear: null,
        editionNote: null,
        publisher: null,
        isbn: null,
        language: null,
        bookType: 'classic',
        rightsStatus: 'unknown',
        sourceUrl: null,
        summary: null,
        tags: [],
        meta: {},
        createdAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
      },
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.items).toHaveLength(2);
  });
});
