import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildKlineStageNarrative } from '@/lib/kline-stage';
import { buildFocusWindowSeries, buildKlineViewSeries } from '@/lib/kline-views';
import { buildPersonalKlineHighlight } from '@/lib/kline-showcase';

function sampleLife() {
  const out = [];
  for (let y = 1990; y <= 2040; y++) {
    const age = y - 1990;
    out.push({
      year: y,
      career: 50 + Math.min(30, age * 0.6) + ((y % 7) - 3),
      wealth: 48 + Math.min(28, age * 0.5),
      marriage: 55 + ((y % 5) - 2),
      health: 62 - Math.max(0, age - 30) * 0.3,
      evidence: {
        ganZhi: '甲子',
        drivers: y === 2015 ? ['用神流年'] : ['大运平稳'],
        risks: y === 2008 ? ['忌神触发'] : [],
      },
    });
  }
  return out;
}

describe('kline stage + focus window', () => {
  it('builds human stage narrative with birth year', () => {
    const stage = buildKlineStageNarrative(sampleLife(), {
      birthYear: 1990,
      now: new Date('2026-06-01'),
    });
    assert.ok(stage);
    assert.equal(stage!.age, 36);
    assert.ok(stage!.headline.length > 12);
    assert.ok(stage!.currentScore != null);
    assert.ok(stage!.actionHint.length > 8);
    assert.ok(stage!.peak);
    assert.ok(stage!.trough);
    assert.equal(stage!.calibrationNote, null);
  });

  it('soft-appends calibration note without changing scores', () => {
    const base = buildKlineStageNarrative(sampleLife(), {
      birthYear: 1990,
      now: new Date('2026-06-01'),
    });
    assert.ok(base?.peak);
    const withCal = buildKlineStageNarrative(sampleLife(), {
      birthYear: 1990,
      now: new Date('2026-06-01'),
      calibrationMarkers: [
        { year: base!.peak!.year, kind: 'confirmed', title: '升职' },
        { year: 2012, kind: 'denied', title: '未发生节点' },
      ],
    });
    assert.ok(withCal?.calibrationNote);
    assert.ok(withCal!.support.includes('确认') || withCal!.calibrationNote!.includes('高点'));
    assert.equal(withCal!.currentScore, base!.currentScore);
  });

  it('focus window is shorter than life80 and includes now+horizon', () => {
    const yearly = sampleLife();
    const focus = buildFocusWindowSeries(yearly, {
      birthYear: 1990,
      now: new Date('2026-06-01'),
      horizonYears: 10,
    });
    const life = buildKlineViewSeries(yearly, 'life80', {
      birthYear: 1990,
      now: new Date('2026-06-01'),
    });
    assert.ok(focus.length < life.length);
    assert.equal(focus[0]!.year, 1990);
    assert.ok(focus.some((p) => p.year === 2026));
    assert.ok(focus.some((p) => p.year === 2036));
    assert.ok(!focus.some((p) => p.year > 2036));
  });

  it('personal highlight carries stage headline', () => {
    const h = buildPersonalKlineHighlight(sampleLife(), { birthYear: 1990 });
    assert.ok(h);
    assert.ok(h!.stageHeadline);
    assert.ok(h!.stageAction);
    assert.equal(h!.age, new Date().getFullYear() - 1990);
  });
});
