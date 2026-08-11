import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  approxMonthGanZhi,
  buildEngineEvidenceBlocks,
  buildYearDeskModel,
  expandYearToMonths,
  findYearPoint,
} from '@/lib/kline-year-detail';

describe('kline year detail', () => {
  it('expands 12 months with ganZhi and almanac dates', () => {
    const months = expandYearToMonths(
      {
        year: 2026,
        career: 70,
        wealth: 68,
        marriage: 60,
        health: 62,
        evidence: { ganZhi: '丙午', drivers: ['测试'] },
      },
      { yongShen: ['火', '土'], jiShen: ['金'] },
    );
    assert.equal(months.length, 12);
    assert.equal(months[0]!.almanacDate, '2026-01-15');
    assert.ok(months.every((m) => m.monthGanZhi.length === 2));
    assert.ok(months.every((m) => m.overall >= 25 && m.overall <= 98));
  });

  it('builds evidence blocks from full engine package', () => {
    const blocks = buildEngineEvidenceBlocks({
      year: 2020,
      career: 72,
      wealth: 70,
      marriage: 58,
      health: 64,
      evidence: {
        natal: [{ driver: '日主乙，用神木火', impact: 4 }],
        dayun: [{ driver: '甲子大运', impact: 6 }],
        liunian: [{ driver: '庚子流年', impact: -2 }],
        drivers: ['顺用神之年'],
        risks: ['流年金落忌神'],
        ganZhi: '庚子',
        dayunGanZhi: '甲子',
        elementBreakdown: {
          yearElement: 'metal',
          yongShenMatch: 'conflict',
          relationSummary: '冲',
        },
      },
    });
    assert.ok(blocks.length >= 5);
    assert.ok(blocks.some((b) => b.label === '原局基线'));
    assert.ok(blocks.some((b) => b.label === '五行结构'));
  });

  it('findYearPoint + desk model', () => {
    const data = [
      {
        year: 2018,
        career: 80,
        wealth: 75,
        marriage: 62,
        health: 60,
        evidence: { ganZhi: '戊戌', drivers: ['高点'] },
      },
    ];
    const pt = findYearPoint(data, 2018);
    assert.ok(pt);
    const desk = buildYearDeskModel(pt!, { yongShen: ['土'] });
    assert.equal(desk.months.length, 12);
    assert.equal(desk.bestMonths.length, 3);
    assert.match(desk.almanacYearHref, /\/almanac\/2018-01-01/);
  });

  it('approx month ganZhi is stable', () => {
    assert.equal(approxMonthGanZhi(2024, 1).length, 2);
    assert.notEqual(approxMonthGanZhi(2024, 1), approxMonthGanZhi(2024, 6));
  });
});
