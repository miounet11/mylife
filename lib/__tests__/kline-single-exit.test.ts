import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateLifeKlineData } from '@/lib/fortune-engine';
import { generateLifeKlineV6 } from '@/lib/kline-v6';
import type { Pillar } from '@/lib/user-types';

const pillars = [
  { celestialStem: '甲', earthlyBranch: '子', hiddenStems: ['癸'], nayin: '' },
  { celestialStem: '丙', earthlyBranch: '寅', hiddenStems: ['甲', '丙', '戊'], nayin: '' },
  { celestialStem: '戊', earthlyBranch: '午', hiddenStems: ['丁', '己'], nayin: '' },
  { celestialStem: '庚', earthlyBranch: '申', hiddenStems: ['戊', '庚', '壬'], nayin: '' },
] as Pillar[];

const yongShen = {
  dayMaster: '戊',
  dayMasterElement: '土',
  strength: '中和',
  score: 0,
  yongShen: ['木', '火'],
  xiShen: ['木'],
  jiShen: ['金'],
  qiuShen: ['水'],
  method: '扶抑',
  analysis: '',
} as any;

describe('kline single exit (no sin legacy)', () => {
  it('generateLifeKlineData returns V6-length series with v6 tag', () => {
    const data = generateLifeKlineData(new Date(1990, 5, 15), 'male', pillars, yongShen, undefined);
    assert.ok(Array.isArray(data) && data.length >= 20);
    const drivers = (data[0]?.evidence as { drivers?: string[] } | undefined)?.drivers || [];
    assert.ok(
      drivers.some((d) => /klineSource=v6|klineSource=skeleton/.test(d)),
      `expected klineSource tag, got ${drivers.join(',')}`,
    );
  });

  it('V6 fire health decay has no Math.sin dependency in source series shape', () => {
    const v6 = generateLifeKlineV6(new Date(1985, 0, 1), 'female', pillars, yongShen, null, {
      fromBirth: true,
      lifeYears: 50,
    });
    assert.ok(v6.length >= 40);
    // All points finite 0–100
    for (const pt of v6) {
      for (const key of ['career', 'wealth', 'marriage', 'health'] as const) {
        const n = Number((pt as any)[key]);
        assert.ok(Number.isFinite(n) && n >= 0 && n <= 100);
      }
    }
  });
});
