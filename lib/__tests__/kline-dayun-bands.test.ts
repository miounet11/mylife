import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDayunBandsFromResult,
  qualityLabelZh,
} from '@/lib/kline-dayun-bands';

describe('kline dayun bands', () => {
  it('builds bands from dayuns list and clips to chart window', () => {
    const bands = buildDayunBandsFromResult(
      {
        dayuns: [
          {
            ganZhi: '甲子',
            startYear: 1995,
            endYear: 2004,
            quality: 'good',
            isCurrent: false,
          },
          {
            ganZhi: '乙丑',
            startYear: 2005,
            endYear: 2014,
            quality: 'excellent',
            isCurrent: true,
          },
          {
            ganZhi: '丙寅',
            startYear: 2015,
            endYear: 2024,
            quality: 'poor',
          },
        ],
      },
      { chartMinYear: 2000, chartMaxYear: 2020 },
    );
    assert.equal(bands.length, 3);
    assert.equal(bands[0]!.startYear, 2000);
    assert.equal(bands[0]!.endYear, 2004);
    assert.equal(bands[1]!.ganZhi, '乙丑');
    assert.ok(bands[1]!.isCurrent);
    assert.ok(bands[2]!.fill.includes('rgba'));
  });

  it('accepts dayunList alias', () => {
    const bands = buildDayunBandsFromResult({
      dayunList: [{ gan: '庚', zhi: '申', startYear: 2010, endYear: 2019, quality: 'neutral' }],
    });
    assert.equal(bands.length, 1);
    assert.equal(bands[0]!.ganZhi, '庚申');
    assert.equal(qualityLabelZh('excellent'), '上佳');
  });
});
