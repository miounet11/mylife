import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPersonalKlineHighlight,
  getKlineShowcaseSamples,
  LIFE_KLINE_PRODUCT,
} from '@/lib/kline-showcase';

describe('kline showcase', () => {
  it('defines product framing copy', () => {
    assert.equal(LIFE_KLINE_PRODUCT.name, '人生 K 线');
    assert.ok(LIFE_KLINE_PRODUCT.howBuilt.length >= 4);
    assert.ok(LIFE_KLINE_PRODUCT.howToRead.length >= 3);
  });

  it('builds real V6 demo samples (no empty series)', () => {
    const samples = getKlineShowcaseSamples();
    assert.ok(samples.length >= 2, 'expected at least 2 demo samples');
    for (const s of samples) {
      assert.ok(s.series.length >= 40, `${s.id} should span decades`);
      assert.ok(s.series.every((p) => p.year >= 1900 && p.score > 0));
      assert.ok(s.peakYear);
      assert.ok(s.troughYear);
    }
  });

  it('summarizes personal report kline for hero strip', () => {
    const highlight = buildPersonalKlineHighlight([
      { year: 2000, career: 60, wealth: 55, marriage: 50, health: 58 },
      { year: 2010, career: 80, wealth: 75, marriage: 62, health: 60 },
      { year: 2020, career: 70, wealth: 68, marriage: 65, health: 55 },
      { year: new Date().getFullYear(), career: 72, wealth: 70, marriage: 66, health: 58 },
    ]);
    assert.ok(highlight);
    assert.equal(highlight!.sampleYears, 4);
    assert.equal(highlight!.peak?.year, 2010);
    assert.ok(highlight!.readingTips.length >= 2);
  });
});
