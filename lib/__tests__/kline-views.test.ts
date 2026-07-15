import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildKlineViewSeries,
  buildLife80YearSeries,
  buildMonthlySeries,
} from '@/lib/kline-views';
import { generateLifeKlineV6, generateMonthlyKlineV6 } from '@/lib/kline-v6';
import type { Pillar } from '@/lib/user-types';

function sampleYearly() {
  const out = [];
  for (let y = 2016; y <= 2036; y++) {
    out.push({
      year: y,
      career: 55 + ((y - 2016) % 7),
      wealth: 52 + ((y - 2016) % 5),
      marriage: 50,
      health: 58 - ((y - 2016) % 3),
      evidence: { ganZhi: '甲子', drivers: ['测试'], risks: [] },
    });
  }
  return out;
}

describe('kline multi-range views', () => {
  it('life80 produces ~80 yearly points from birth', () => {
    const series = buildLife80YearSeries(sampleYearly(), {
      birthYear: 1990,
      yongShen: ['木', '火'],
      jiShen: ['金'],
      lifeYears: 80,
    });
    assert.equal(series.length, 80);
    assert.equal(series[0]!.year, 1990);
    assert.equal(series[79]!.year, 2069);
    assert.ok(series.every((p) => p.overall >= 20 && p.overall <= 100));
  });

  it('months10 and months3 return monthly keys', () => {
    const m10 = buildMonthlySeries(sampleYearly(), {
      yearsBack: 10,
      yongShen: ['木'],
      jiShen: ['金'],
      now: new Date('2026-07-15'),
      birthYear: 1990,
    });
    const m3 = buildKlineViewSeries(sampleYearly(), 'months3', {
      yongShen: ['木'],
      jiShen: ['金'],
      now: new Date('2026-07-15'),
      birthYear: 1990,
    });
    assert.ok(m10.length >= 100);
    assert.match(m10[0]!.key, /^\d{4}-\d{2}$/);
    assert.ok(m3.length >= 30);
    assert.ok(m3.length < m10.length);
  });

  it('generateLifeKlineV6 fromBirth lifeYears 80', () => {
    const pillars = [
      { celestialStem: '己', earthlyBranch: '巳', hiddenStems: ['丙', '庚', '戊'], ganZhi: '己巳' },
      { celestialStem: '丙', earthlyBranch: '子', hiddenStems: ['癸'], ganZhi: '丙子' },
      { celestialStem: '甲', earthlyBranch: '寅', hiddenStems: ['甲', '丙', '戊'], ganZhi: '甲寅' },
      { celestialStem: '戊', earthlyBranch: '辰', hiddenStems: ['戊', '乙', '癸'], ganZhi: '戊辰' },
    ] as Pillar[];
    const yong = {
      yongShen: ['fire', 'earth'],
      xiShen: ['wood'],
      jiShen: ['metal'],
      qiuShen: [],
      pattern: { pattern: '食神生财' },
      dayMasterElement: '木',
    } as any;
    const pts = generateLifeKlineV6(new Date('1990-01-01'), 'male', pillars, yong, undefined, {
      fromBirth: true,
      lifeYears: 80,
    });
    assert.ok(pts.length >= 80);
    assert.equal(pts[0]!.year, 1990);
    assert.ok(pts.every((p) => p.career >= 25 && p.career <= 98));
  });

  it('generateMonthlyKlineV6 covers multi-year months', () => {
    const pillars = [
      { celestialStem: '己', earthlyBranch: '巳', hiddenStems: ['丙'], ganZhi: '己巳' },
      { celestialStem: '丙', earthlyBranch: '子', hiddenStems: ['癸'], ganZhi: '丙子' },
      { celestialStem: '甲', earthlyBranch: '寅', hiddenStems: ['甲'], ganZhi: '甲寅' },
      { celestialStem: '戊', earthlyBranch: '辰', hiddenStems: ['戊'], ganZhi: '戊辰' },
    ] as Pillar[];
    const months = generateMonthlyKlineV6(
      new Date('1990-01-01'),
      'male',
      pillars,
      { yongShen: ['fire'], xiShen: [], jiShen: ['metal'], pattern: { pattern: '正格' } } as any,
      undefined,
      { startYear: 2024, endYear: 2026, endMonth: 7 }
    );
    assert.ok(months.length >= 24);
    assert.match(months[0]!.key, /^\d{4}-\d{2}$/);
  });
});
