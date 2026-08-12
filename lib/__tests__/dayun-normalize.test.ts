import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateDayun, resolveDayunList } from '@/lib/dayun-calculator';
import { buildFortuneContextInput } from '@/lib/fortune-context-builder';
import type { YongShenResult } from '@/lib/bazi-analyzer';

describe('fortune context dayun normalization', () => {
  it('builds dimension context without throwing for sample birth', () => {
    const context = buildFortuneContextInput({
      birthDate: '1990-06-15',
      birthTime: '08:30',
      birthPlace: '北京',
      birthAccuracy: 'exact',
      gender: 'male',
    });
    assert.ok(Array.isArray(context.truthInput.kline));
    assert.ok(context.truthInput.kline.length > 0);
    assert.ok(Array.isArray(context.truthInput.dayun?.dayunList));
  });

  it('exposes dayuns and dayunList as the same rows', () => {
    const result = calculateDayun(
      new Date(1990, 5, 15),
      '08:30',
      'male',
      '庚',
      { gan: '壬', zhi: '午' },
      null,
      1990,
    );
    assert.equal(result.dayuns.length, 10);
    assert.equal(result.dayunList, result.dayuns);
    assert.equal(resolveDayunList(result).length, 10);
    assert.equal(resolveDayunList({ dayuns: result.dayuns }).length, 10);
    assert.equal(resolveDayunList({ dayunList: result.dayuns }).length, 10);
  });

  it('matches 用神 whether lists are English or Chinese', () => {
    const en = {
      yongShen: ['wood'],
      xiShen: ['water'],
      jiShen: ['metal'],
    } as YongShenResult;
    const cn = {
      yongShen: ['木'],
      xiShen: ['水'],
      jiShen: ['金'],
    } as YongShenResult;
    const birth = new Date(1990, 5, 15);
    const a = calculateDayun(birth, '08:30', 'male', '庚', { gan: '壬', zhi: '午' }, en, 1990);
    const b = calculateDayun(birth, '08:30', 'male', '庚', { gan: '壬', zhi: '午' }, cn, 1990);
    assert.deepEqual(
      a.dayuns.map((d) => d.yongShenMatch),
      b.dayuns.map((d) => d.yongShenMatch),
    );
  });
});