import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeEraHypothesisScores, type EraHypothesisScore } from '@/lib/era-hypothesis-store';
import { buildCombinedRevisitStats } from '@/lib/revisit-combined-stats';
import { buildEraEnvironmentPromptPayload } from '@/lib/world-yi-era-snapshot';
import type { Prediction } from '@/lib/predictions/types';

describe('mergeEraHypothesisScores', () => {
  it('keeps newer updatedAt', () => {
    const local: EraHypothesisScore[] = [
      {
        hypothesisId: 'h1',
        outcome: 'hit',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const remote: EraHypothesisScore[] = [
      {
        hypothesisId: 'h1',
        outcome: 'miss',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const merged = mergeEraHypothesisScores(local, remote);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].outcome, 'miss');
  });
});

describe('buildCombinedRevisitStats', () => {
  it('merges prediction and era scores', () => {
    const predictions = [
      { outcome: 'fulfilled' },
      { outcome: 'partial' },
      { outcome: 'missed' },
      { outcome: 'pending' },
    ] as Prediction[];
    const eraScores: EraHypothesisScore[] = [
      { hypothesisId: 'a', outcome: 'hit', updatedAt: '2026-01-01T00:00:00.000Z' },
      { hypothesisId: 'b', outcome: 'miss', updatedAt: '2026-01-01T00:00:00.000Z' },
    ];
    const stats = buildCombinedRevisitStats({ predictions, eraScores });
    assert.equal(stats.predictions.hitCount, 1);
    assert.equal(stats.predictions.partialCount, 1);
    assert.equal(stats.predictions.missCount, 1);
    assert.equal(stats.era.hit, 1);
    assert.equal(stats.era.miss, 1);
    assert.equal(stats.combined.hit, 2);
    assert.equal(stats.combined.partial, 1);
    assert.equal(stats.combined.miss, 2);
    assert.equal(stats.combined.resolved, 5);
    assert.ok(stats.combined.hitRate > 0.4 && stats.combined.hitRate < 0.6);
  });
});

describe('buildEraEnvironmentPromptPayload', () => {
  it('includes phase and stance for LLM', () => {
    const p = buildEraEnvironmentPromptPayload(2026);
    assert.equal(p.year, 2026);
    assert.equal(p.phaseId, 'scale');
    assert.ok(p.stance.includes('宏观'));
    assert.ok(p.actions.length >= 1);
  });
});
