import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  buildCoreReferenceSeedPlan,
  buildDomainAcquisitionPlans,
  previewCoreReferenceSeedInputs,
  seedKnowledgeSourcePlans,
} from '@/lib/domain-acquisition-planner';

describe('domain acquisition planner', () => {
  test('builds domain plans ordered by product priority', () => {
    const plans = buildDomainAcquisitionPlans({
      domains: ['metaphysics', 'psychology', 'law'],
      nextWaveLimit: 3,
    });

    expect(plans).toHaveLength(3);
    expect(plans[0]?.domain).toBe('metaphysics');
    expect(plans[1]?.domain).toBe('psychology');
    expect(plans[2]?.domain).toBe('law');
    expect(plans[0]?.nextWaveSources.length).toBeLessThanOrEqual(3);
    expect(plans[0]?.recommendedActions.length).toBeGreaterThan(0);
  });

  test('tracks seeded versus missing core reference sources', () => {
    const testDb = new Database(':memory:');
    const before = buildCoreReferenceSeedPlan({ limit: 6 }, testDb);
    expect(before.alreadySeeded).toBe(0);
    expect(before.missingCount).toBe(before.totalPlanned);

    seedKnowledgeSourcePlans({ mode: 'core', limit: 6 }, testDb);
    const after = buildCoreReferenceSeedPlan({ limit: 6 }, testDb);

    expect(after.alreadySeeded).toBe(6);
    expect(after.missingCount).toBe(0);
    expect(after.domains.some((item) => item.domain === 'metaphysics')).toBe(true);
    testDb.close();
  });

  test('supports seeding a single domain backlog', () => {
    const testDb = new Database(':memory:');
    const result = seedKnowledgeSourcePlans({ mode: 'domain', domain: 'psychology' }, testDb);

    expect(result.mode).toBe('domain');
    expect(result.domain).toBe('psychology');
    expect(result.insertedOrUpdated).toBeGreaterThan(0);
    expect(result.sourceIds.some((item) => item === 'psych-nimh')).toBe(true);
    testDb.close();
  });

  test('previews normalized core seed inputs', () => {
    const preview = previewCoreReferenceSeedInputs(5);

    expect(preview).toHaveLength(5);
    expect(preview[0]?.canonicalUrl).toContain('http');
    expect(Array.isArray(preview[0]?.tags)).toBe(true);
  });
});
