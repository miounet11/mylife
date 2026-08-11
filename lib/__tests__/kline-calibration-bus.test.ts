import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergeCalibrationMarker,
  yearFromCalibrationText,
} from '@/lib/kline-calibration-bus';

describe('kline calibration bus helpers', () => {
  it('parses year from occurrence window text', () => {
    assert.equal(yearFromCalibrationText('2018 前后升迁'), 2018);
    assert.equal(yearFromCalibrationText('大约 2021 年健康波动'), 2021);
    assert.equal(yearFromCalibrationText('无年份'), null);
  });

  it('merges markers and replaces opposite kind on same year', () => {
    const a = mergeCalibrationMarker([], {
      year: 2018,
      kind: 'denied',
      title: '跳槽',
    });
    const b = mergeCalibrationMarker(a, {
      year: 2018,
      kind: 'confirmed',
      title: '跳槽',
    });
    assert.equal(b.length, 1);
    assert.equal(b[0]!.kind, 'confirmed');
    const c = mergeCalibrationMarker(b, {
      year: 2020,
      kind: 'denied',
      title: '其他',
    });
    assert.equal(c.length, 2);
  });
});
