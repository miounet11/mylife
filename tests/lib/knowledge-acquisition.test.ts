import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  buildKnowledgeSourceDocumentInputFromSignal,
  inferDomainsForSignal,
  promoteSignalsToKnowledgeBase,
  runKnowledgeAcquisitionCycle,
} from '@/lib/knowledge-acquisition';

describe('knowledge acquisition', () => {
  test('infers product-relevant domains from signals', () => {
    const domains = inferDomainsForSignal({
      id: 'signal_1',
      sourceId: 'src_1',
      sourceLabel: 'AI Weekly',
      platform: 'google-news',
      title: 'AI agents for psychology and decision support',
      url: 'https://example.com/ai-psychology',
      summary: 'Covers psychology, stress, AI systems, LLM evaluation and software automation.',
      matchedKeywords: ['AI', 'psychology', 'stress', 'automation'],
    });

    expect(domains.some((item) => item.domain === 'ai')).toBe(true);
    expect(domains.some((item) => item.domain === 'psychology')).toBe(true);
  });

  test('builds signal-derived source documents with domain tags', () => {
    const input = buildKnowledgeSourceDocumentInputFromSignal({
      id: 'signal_2',
      sourceId: 'src_2',
      sourceLabel: 'Google News · Psychology',
      platform: 'google-news',
      title: 'Psychology of stress and relationships',
      url: 'https://example.com/psychology',
      summary: 'Relationship pressure, stress response and emotional regulation.',
      matchedKeywords: ['psychology', 'stress', 'relationship'],
      score: 36,
    });

    expect(input).not.toBeNull();
    expect(input?.tags).toContain('domain:psychology');
    expect(input?.reusePolicy).toBe('summary-only');
  });

  test('promotes high-score signals into knowledge sources', () => {
    const testDb = new Database(':memory:');
    const result = promoteSignalsToKnowledgeBase([
      {
        id: 'signal_3',
        sourceId: 'src_3',
        sourceLabel: 'Google News · AI',
        platform: 'google-news',
        title: 'AI and statistics for evaluation',
        url: 'https://example.com/ai-stats',
        summary: 'LLM evaluation, statistics and probability methods.',
        matchedKeywords: ['ai', 'statistics', 'evaluation'],
        score: 42,
      },
      {
        id: 'signal_4',
        sourceId: 'src_4',
        sourceLabel: 'Google News · History',
        platform: 'google-news',
        title: 'History of metaphysics',
        url: 'https://example.com/history-meta',
        summary: 'History and philosophy discussion.',
        matchedKeywords: ['history', 'philosophy'],
        score: 16,
      },
    ], { minScore: 20, limit: 5 }, testDb);

    expect(result.promotedSignals).toHaveLength(1);
    expect(result.promotedSignals[0]?.domains.some((item) => item.domain === 'ai')).toBe(true);
    testDb.close();
  });

  test('runs acquisition cycle with seeded sources and promoted signals', async () => {
    const testDb = new Database(':memory:');
    const result = await runKnowledgeAcquisitionCycle({
      refreshRadar: false,
      focusDomains: ['metaphysics', 'psychology'],
      coreLimit: 6,
      maxDomainsPerRun: 2,
      signalMinScore: 20,
      signalPromotionLimit: 5,
      signals: [
        {
          id: 'signal_5',
          sourceId: 'src_5',
          sourceLabel: 'Google News · Psychology',
          platform: 'google-news',
          title: '心理关系里的时机到底怎么看？',
          url: 'https://example.com/psych-timing',
          summary: 'Relationship timing, emotion and stress.',
          matchedKeywords: ['psychology', 'relationship', 'stress'],
          score: 38,
        },
      ],
    }, testDb);

    expect(result.coreSeededCount).toBeGreaterThan(0);
    expect(result.selectedDomains.length).toBeGreaterThan(0);
    expect(result.selectedDomains.some((item) => item === 'metaphysics' || item === 'psychology')).toBe(true);
    expect(result.promotedSignalsCount).toBe(1);
    expect(result.extractedObjects.questionCount).toBeGreaterThan(0);
    expect(result.extractedObjects.conceptCount).toBeGreaterThan(0);
    expect(result.synthesizedDrafts.draftCount).toBeGreaterThanOrEqual(6);
    expect(result.synthesizedDrafts.candidateCount).toBeGreaterThan(0);
    expect(result.graphEnrichment.relatedTopicCount).toBeGreaterThanOrEqual(0);
    expect(result.synthesizedDrafts.titles.some((item) => item.includes('专题总览'))).toBe(true);
    expect(result.synthesizedDrafts.titles.some((item) => item.includes('概念词汇表'))).toBe(true);
    expect(result.synthesizedDrafts.titles.some((item) => item.includes('问题地图') || item.includes('问题簇综述'))).toBe(true);
    expect(result.synthesizedDrafts.titles.some((item) => item.includes('书单路径') || item.includes('书目阶梯'))).toBe(true);
    expect(result.coreMissingAfterRun).toBe(0);
    testDb.close();
  });

  test('does not auto-publish when running against non-default database', async () => {
    const testDb = new Database(':memory:');
    const result = await runKnowledgeAcquisitionCycle({
      refreshRadar: false,
      focusDomains: ['metaphysics'],
      coreLimit: 6,
      maxDomainsPerRun: 1,
      signalMinScore: 20,
      signalPromotionLimit: 5,
      signals: [
        {
          id: 'signal_6',
          sourceId: 'src_6',
          sourceLabel: 'Google News · Metaphysics',
          platform: 'google-news',
          title: '八字入门到底先看什么？',
          url: 'https://example.com/meta-entry',
          summary: '八字、真太阳时、用神和入门书单。',
          matchedKeywords: ['八字', '真太阳时', '用神'],
          score: 42,
        },
      ],
    }, testDb);

    expect(result.synthesizedDrafts.publishedCount).toBe(0);
    testDb.close();
  });
});
