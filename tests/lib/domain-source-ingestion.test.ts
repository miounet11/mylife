import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  buildDomainAcquisitionBacklog,
  buildCoreReferenceSourceDocumentInputs,
  buildDomainSourceDocumentInputs,
  seedCoreReferenceSourcesToKnowledgeBase,
  seedDomainSourcesToKnowledgeBase,
} from '@/lib/domain-source-ingestion';

describe('domain source ingestion', () => {
  test('builds source document inputs from law presets', () => {
    const inputs = buildDomainSourceDocumentInputs('law');

    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]?.canonicalUrl).toContain('http');
    expect(inputs[0]?.rawMeta).toBeDefined();
    expect(Array.isArray(inputs[0]?.tags)).toBe(true);
  });

  test('seeds domain presets into the knowledge base', () => {
    const testDb = new Database(':memory:');
    const seeded = seedDomainSourcesToKnowledgeBase('metaphysics', testDb);

    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded.some((item) => item.sourceId === 'meta-ctext')).toBe(true);

    testDb.close();
  });

  test('builds acquisition backlog grouped by tier', () => {
    const backlog = buildDomainAcquisitionBacklog('metaphysics');

    expect(backlog.totalSources).toBeGreaterThan(0);
    expect(backlog.byTier.P0.length).toBeGreaterThan(0);
    expect(backlog.byTier.P2.length).toBeGreaterThan(0);
  });

  test('builds and seeds core reference sources for the product', () => {
    const inputs = buildCoreReferenceSourceDocumentInputs(10);
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.some((item) => item.sourceId === 'meta-ctext')).toBe(true);

    const testDb = new Database(':memory:');
    const seeded = seedCoreReferenceSourcesToKnowledgeBase(testDb, 10);
    expect(seeded.length).toBe(inputs.length);
    expect(seeded.some((item) => item.sourceId === 'meta-ctext')).toBe(true);
    testDb.close();
  });
});
