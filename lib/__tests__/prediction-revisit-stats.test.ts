import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyPredictionRevisitLabel,
  summarizePredictionRevisits,
} from '@/lib/predictions/revisit-stats';
import { memoryInputFromChatContext } from '@/lib/chat/memory-narrative';

describe('classifyPredictionRevisitLabel', () => {
  it('maps hit / accurate / 命中 / fulfilled', () => {
    assert.equal(classifyPredictionRevisitLabel('fulfilled'), 'hit');
    assert.equal(classifyPredictionRevisitLabel('accurate'), 'hit');
    assert.equal(classifyPredictionRevisitLabel('hit'), 'hit');
    assert.equal(classifyPredictionRevisitLabel('命中'), 'hit');
    assert.equal(classifyPredictionRevisitLabel('应验'), 'hit');
  });

  it('maps partial / 部分 before treating as hit', () => {
    assert.equal(classifyPredictionRevisitLabel('partial'), 'partial');
    assert.equal(classifyPredictionRevisitLabel('部分命中'), 'partial');
    assert.equal(classifyPredictionRevisitLabel('部分'), 'partial');
  });

  it('maps miss / 未命中 without matching 命中 substring first', () => {
    assert.equal(classifyPredictionRevisitLabel('missed'), 'miss');
    assert.equal(classifyPredictionRevisitLabel('miss'), 'miss');
    assert.equal(classifyPredictionRevisitLabel('未命中'), 'miss');
  });

  it('treats empty and pending as pending', () => {
    assert.equal(classifyPredictionRevisitLabel(''), 'pending');
    assert.equal(classifyPredictionRevisitLabel(null), 'pending');
    assert.equal(classifyPredictionRevisitLabel('pending'), 'pending');
    assert.equal(classifyPredictionRevisitLabel('待验证'), 'pending');
  });
});

describe('summarizePredictionRevisits', () => {
  it('returns zeros for empty / missing rows (never invents rates)', () => {
    assert.deepEqual(summarizePredictionRevisits([]), {
      predictionCount: 0,
      hitCount: 0,
      partialCount: 0,
      missCount: 0,
    });
    assert.deepEqual(summarizePredictionRevisits(null), {
      predictionCount: 0,
      hitCount: 0,
      partialCount: 0,
      missCount: 0,
    });
    assert.deepEqual(summarizePredictionRevisits(undefined), {
      predictionCount: 0,
      hitCount: 0,
      partialCount: 0,
      missCount: 0,
    });
  });

  it('counts only resolved revisits; pending excluded from predictionCount', () => {
    const stats = summarizePredictionRevisits([
      { outcome: 'fulfilled' },
      { outcome: 'partial' },
      { outcome: 'missed' },
      { outcome: 'pending' },
      { outcome: undefined },
      null,
    ]);
    assert.equal(stats.predictionCount, 3);
    assert.equal(stats.hitCount, 1);
    assert.equal(stats.partialCount, 1);
    assert.equal(stats.missCount, 1);
  });

  it('accepts status / result labels in Chinese and English', () => {
    const stats = summarizePredictionRevisits([
      { status: '命中' },
      { result: '未命中' },
      { status: 'partial' },
      { outcome: 'accurate' },
    ]);
    assert.equal(stats.predictionCount, 4);
    assert.equal(stats.hitCount, 2);
    assert.equal(stats.partialCount, 1);
    assert.equal(stats.missCount, 1);
  });

  it('uses score fallback when no textual outcome', () => {
    const stats = summarizePredictionRevisits([
      { score: 0.9 },
      { score: 0.5 },
      { score: 0.1 },
      { score: 85 },
    ]);
    assert.equal(stats.predictionCount, 4);
    assert.equal(stats.hitCount, 2); // 0.9 and 85
    assert.equal(stats.partialCount, 1); // 0.5
    assert.equal(stats.missCount, 1); // 0.1
  });

  it('prefers textual outcome over score', () => {
    const stats = summarizePredictionRevisits([{ outcome: 'missed', score: 0.99 }]);
    assert.equal(stats.predictionCount, 1);
    assert.equal(stats.hitCount, 0);
    assert.equal(stats.missCount, 1);
  });
});

describe('memoryInputFromChatContext + predictionStats', () => {
  it('prefers store-backed predictionStats over event validation', () => {
    const stats = summarizePredictionRevisits([
      { outcome: 'fulfilled' },
      { outcome: 'fulfilled' },
      { outcome: 'missed' },
      { outcome: 'pending' },
    ]);
    const input = memoryInputFromChatContext({
      validationSummary: { accurateCount: 1, driftCount: 0, pendingCount: 9 },
      predictionStats: stats,
    });
    assert.ok(input);
    assert.equal(input!.predictionCount, 3);
    assert.equal(input!.hitCount, 2);
  });

  it('does not invent hits when stats are all zero', () => {
    const stats = summarizePredictionRevisits([{ outcome: 'pending' }]);
    const input = memoryInputFromChatContext({
      predictionStats: stats,
      confirmedPastEventCount: 0,
    });
    // zeros fall through; no events → null
    assert.equal(input, null);
  });
});
