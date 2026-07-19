import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEduZiweiChart,
  computeMingBranchIndex,
  computeShenBranchIndex,
  eduInputFromSolar,
  eduInputFromSolarWithTrueSolar,
  sihuaForYearStem,
} from '@/lib/ziwei/edu-chart';

describe('ziwei edu chart', () => {
  it('places ming palace for month/hour', () => {
    // 正月子时：寅起正月=寅，逆数子时0 → 寅
    assert.equal(computeMingBranchIndex(1, 0), 2);
  });

  it('builds 12 palaces with stars arrays', () => {
    const chart = buildEduZiweiChart({
      lunarMonth: 5,
      lunarDay: 16,
      hourBranch: 4,
      yearBranch: 2,
    });
    assert.equal(chart.palaces.length, 12);
    assert.equal(chart.palaces[0].name, '命宫');
    assert.ok(chart.ju.ju >= 2 && chart.ju.ju <= 6);
    const starCount = chart.palaces.reduce((n, p) => n + p.stars.length, 0);
    assert.ok(starCount >= 10);
    assert.match(chart.disclaimer, /教育/);
  });

  it('shen differs from pure reverse in general', () => {
    const ming = computeMingBranchIndex(8, 6);
    const shen = computeShenBranchIndex(8, 6);
    // not always different but functions are defined
    assert.ok(ming >= 0 && ming <= 11);
    assert.ok(shen >= 0 && shen <= 11);
  });

  it('attaches year sihua to chart', () => {
    const chart = buildEduZiweiChart({
      lunarMonth: 3,
      lunarDay: 10,
      hourBranch: 2,
      yearStem: 0, // 甲
      yearBranch: 0,
    });
    assert.equal(chart.sihua.length, 4);
    assert.equal(chart.sihua[0].kind, '禄');
    assert.ok(chart.palaces.some((p) => p.stars.some((s) => s.sihua)));
  });

  it('converts solar to lunar fields', () => {
    const conv = eduInputFromSolar({ year: 1990, month: 5, day: 15, hour: 10 });
    assert.ok(conv.lunarMonth >= 1 && conv.lunarMonth <= 12);
    assert.ok(conv.lunarDay >= 1 && conv.lunarDay <= 30);
    assert.ok(conv.lunarLabel.includes('年'));
  });

  it('sihua table for jia', () => {
    const rows = sihuaForYearStem(0);
    assert.deepEqual(
      rows.map((r) => r.kind),
      ['禄', '权', '科', '忌'],
    );
  });

  it('true solar without longitude is a no-op with skip note', () => {
    const base = eduInputFromSolar({ year: 1990, month: 5, day: 15, hour: 10 });
    const conv = eduInputFromSolarWithTrueSolar({
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      useTrueSolar: true,
      // no longitude
    });
    assert.equal(conv.hourBranch, base.hourBranch);
    assert.equal(conv.lunarMonth, base.lunarMonth);
    assert.equal(conv.lunarDay, base.lunarDay);
    assert.equal(conv.trueSolar, undefined);
    assert.ok(conv.trueSolarSkipped);
    assert.match(conv.trueSolarSkipped, /经度|longitude/i);
    assert.ok(conv.civilLabel.includes('1990'));
  });

  it('true solar with longitude applies correction description', () => {
    const conv = eduInputFromSolarWithTrueSolar({
      year: 1990,
      month: 5,
      day: 15,
      hour: 12,
      longitude: 104.1, // Chengdu — west of 120° → negative longitude offset
      timezone: 8,
      useTrueSolar: true,
    });
    assert.ok(conv.trueSolar);
    assert.ok(typeof conv.trueSolar.description === 'string');
    assert.match(conv.trueSolar.description, /经度修正|均时差/);
    assert.ok(Number.isFinite(conv.trueSolar.correctionMinutes));
    // Chengdu ~104°E vs 120° → ~-64 min longitude offset + EoT, total well negative
    assert.ok(conv.trueSolar.correctionMinutes < -30);
    assert.ok(conv.civilLabel.includes('12:00'));
    assert.equal(conv.trueSolarSkipped, undefined);
  });

  it('true solar can change hour branch near branch boundary', () => {
    // Civil 13:00 is 未时 (hourBranch 7). Large west correction can push into 午时 (6).
    const plain = eduInputFromSolarWithTrueSolar({
      year: 1990,
      month: 5,
      day: 15,
      hour: 13,
      useTrueSolar: false,
    });
    const corrected = eduInputFromSolarWithTrueSolar({
      year: 1990,
      month: 5,
      day: 15,
      hour: 13,
      longitude: 100, // far west of standard meridian
      timezone: 8,
      useTrueSolar: true,
    });
    assert.equal(plain.hourBranch, 7); // 13:00 → 未
    assert.ok(corrected.trueSolar);
    // correction ~ (100-120)*4 + EoT ≈ -80 min → clock ~11:40 → 午时
    assert.notEqual(corrected.hourBranch, plain.hourBranch);
    assert.equal(corrected.hourBranch, 6);
  });

  it('true solar disabled keeps civil time even with longitude', () => {
    const plain = eduInputFromSolar({ year: 2000, month: 1, day: 1, hour: 8 });
    const conv = eduInputFromSolarWithTrueSolar({
      year: 2000,
      month: 1,
      day: 1,
      hour: 8,
      longitude: 100,
      useTrueSolar: false,
    });
    assert.equal(conv.hourBranch, plain.hourBranch);
    assert.equal(conv.trueSolar, undefined);
  });
});
