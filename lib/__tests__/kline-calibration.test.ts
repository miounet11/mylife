import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildKlineCalibrationMarkers,
  calibrationSummaryLine,
} from '@/lib/kline-calibration';

describe('kline calibration markers', () => {
  it('maps confirmed and denied events to years', () => {
    const markers = buildKlineCalibrationMarkers({
      events: [
        {
          title: '跳槽窗口',
          date: '2018-05-01',
          userFeedback: { wasAccurate: true },
          fortuneAnalysis: { templateKind: 'past_event' },
        },
        {
          title: '健康波动',
          date: '2021',
          userFeedback: { wasAccurate: false },
          fortuneAnalysis: { occurrenceWindow: '2021 前后' },
        },
        {
          title: '无反馈',
          date: '2015-01-01',
        },
      ],
    });
    assert.equal(markers.length, 2);
    assert.equal(markers[0]!.year, 2018);
    assert.equal(markers[0]!.kind, 'confirmed');
    assert.equal(markers[1]!.kind, 'denied');
    assert.ok(calibrationSummaryLine(markers)?.includes('确认'));
  });
});
