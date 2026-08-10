/**
 * Bazi pillar regressions for user-reported boundary cases.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateFourPillars } from '@/lib/fortune-engine';
import { resolveEffectiveTiming } from '@/lib/calculation-identity';

function pillarStr(pillars: ReturnType<typeof calculateFourPillars>) {
  return pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`).join(' ');
}

describe('bazi pillars regression', () => {
  it('1984-10-08 18:25 after 寒露 is 甲子 甲戌 乙亥 乙酉 (not 辰时 癸酉/庚辰)', () => {
    const d = new Date(1984, 9, 8);
    const pillars = calculateFourPillars(d, '18:25', 8, {
      birthPlace: '台中 · 120.7°E',
      useTrueSolarTime: false,
      sect: 2,
    });
    assert.equal(pillarStr(pillars), '甲子 甲戌 乙亥 乙酉');
  });

  it('1984-10-08 07:00 before 寒露 is 甲子 癸酉 乙亥 庚辰', () => {
    const d = new Date(1984, 9, 8);
    const pillars = calculateFourPillars(d, '07:00', 8, {
      birthPlace: '台中',
      useTrueSolarTime: false,
      sect: 2,
    });
    assert.equal(pillarStr(pillars), '甲子 癸酉 乙亥 庚辰');
  });

  it('晚子 23:49 sect2 keeps calendar day; sect1 (换日) advances day pillar', () => {
    const d = new Date(1985, 0, 20);
    const keep = calculateFourPillars(d, '23:49', 8, { useTrueSolarTime: false, sect: 2 });
    const change = calculateFourPillars(d, '23:49', 8, { useTrueSolarTime: false, sect: 1 });
    assert.equal(pillarStr(keep), '甲子 丁丑 己未 丙子');
    assert.equal(pillarStr(change), '甲子 丁丑 庚申 丙子');
    assert.notEqual(keep[2].celestialStem + keep[2].earthlyBranch, change[2].celestialStem + change[2].earthlyBranch);
  });

  it('useSeparateZiHour maps to sect1 via calculation identity', () => {
    const timing = resolveEffectiveTiming({
      birthDate: '1985-01-20',
      birthTime: '23:49',
      timezone: 8,
      useSeparateZiHour: true,
    });
    assert.equal(timing.useSeparateZiHour, true);
    assert.equal(timing.clockBirthTime, '23:49');
  });
});
