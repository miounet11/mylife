import { describe, expect, test } from '@jest/globals';
import {
  DOMAIN_KNOWLEDGE_CHAINS,
  DOMAIN_SOURCE_PRESETS,
  getCoreReferenceSourcePresets,
  getDomainKnowledgeChain,
  getProductRelevantSourcePresets,
  getDomainSourcePresets,
} from '@/lib/domain-source-presets';

describe('domain source presets', () => {
  test('exports unique preset ids', () => {
    const ids = DOMAIN_SOURCE_PRESETS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every domain has a knowledge chain and at least one P0 source', () => {
    DOMAIN_KNOWLEDGE_CHAINS.forEach((chain) => {
      const presets = getDomainSourcePresets(chain.domain);
      expect(getDomainKnowledgeChain(chain.domain)).not.toBeNull();
      expect(presets.some((item) => item.tier === 'P0')).toBe(true);
    });
  });

  test('law domain starts from official or authority-oriented sources', () => {
    const lawPresets = getDomainSourcePresets('law');
    expect(lawPresets[0]?.tier).toBe('P0');
    expect(['authority', 'catalog']).toContain(lawPresets[0]?.role);
  });

  test('bb-site sources are limited to late-stage acquisition tiers', () => {
    const bbSiteSources = DOMAIN_SOURCE_PRESETS.filter((item) => item.method === 'bb-site');
    expect(bbSiteSources.every((item) => item.tier === 'P2' || item.tier === 'P3')).toBe(true);
  });

  test('product-relevant sources prioritize metaphysics with core adjacent domains', () => {
    const presets = getProductRelevantSourcePresets({ minRelevance: 70, limit: 12 });
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some((item) => item.domain === 'metaphysics')).toBe(true);
    expect(presets.some((item) => item.domain === 'psychology')).toBe(true);
    expect(presets.some((item) => item.domain === 'philosophy')).toBe(true);
    expect(presets.every((item) => item.productFit !== 'exploratory')).toBe(true);
  });

  test('core reference presets exclude low-priority exploratory domains', () => {
    const presets = getCoreReferenceSourcePresets(18);

    expect(presets.length).toBeGreaterThan(0);
    expect(presets.every((item) => item.domain !== 'law')).toBe(true);
    expect(presets.every((item) => item.productRelevance >= 72)).toBe(true);
  });
});
