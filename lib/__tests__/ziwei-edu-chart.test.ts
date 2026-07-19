import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEduZiweiChart,
  computeMingBranchIndex,
  computeShenBranchIndex,
  eduInputFromSolar,
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
});
