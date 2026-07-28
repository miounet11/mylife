import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAstroFromBirth, getChineseZodiac, getSunSign } from '@/lib/life-foundation/zodiac';
import { gradeFromOverall } from '@/lib/life-foundation/modules';
import { buildTaisuiLines } from '@/lib/life-foundation/zodiac';

describe('life-foundation zodiac', () => {
  it('computes sun sign for known dates', () => {
    assert.equal(getSunSign('1990-10-01')?.zh, '天秤座');
    assert.equal(getSunSign('1990-01-01')?.zh, '摩羯座');
    assert.equal(getSunSign('1990-07-30')?.zh, '狮子座');
  });

  it('computes chinese zodiac near 立春', () => {
    // 1984 鼠
    assert.equal(getChineseZodiac('1984-06-01')?.animal, '鼠');
    // 2024-01-15 before 立春 → 兔 (2023)
    assert.equal(getChineseZodiac('2024-01-15')?.animal, '兔');
    // 2024-03-01 after 立春 → 龙
    assert.equal(getChineseZodiac('2024-03-01')?.animal, '龙');
  });

  it('buildAstroFromBirth returns nulls for empty', () => {
    const empty = buildAstroFromBirth(null);
    assert.equal(empty.sunSign, null);
  });

  it('grades overall completeness', () => {
    assert.equal(gradeFromOverall(90).grade, 'rich');
    assert.equal(gradeFromOverall(10).grade, 'empty');
  });

  it('flags benming year when animal matches year', () => {
    // 2024 is 龙 year (after 立春)
    const lines = buildTaisuiLines('1988-06-01', 2024); // 1988 龙
    assert.ok(lines.some((l) => /本命年|太岁/.test(l)));
  });
});
