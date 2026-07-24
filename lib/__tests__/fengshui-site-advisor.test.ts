import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  adviseSites,
  estimateFootTraffic,
  heuristicPoiFromAddress,
} from '@/lib/fengshui/space/site-advisor';

describe('Site advisor', () => {
  test('heuristic address detects transit and retail', () => {
    const p = heuristicPoiFromAddress('上海市静安区南京西路 地铁 商业广场');
    assert.ok(p.transit >= 1);
    assert.ok(p.retail >= 1);
  });

  test('shop foot traffic higher than quiet yinzhai', () => {
    const shopPoi = heuristicPoiFromAddress('南京西路 地铁 商业 餐饮街');
    const yinPoi = heuristicPoiFromAddress('某某陵园 山坡');
    const shopFt = estimateFootTraffic('shop', shopPoi, { corner: true, streetFront: true, industry: '餐饮' });
    const yinFt = estimateFootTraffic('yinzhai', yinPoi);
    assert.ok(shopFt.weekdayDaily > yinFt.weekdayDaily);
    assert.ok(shopFt.index >= yinFt.index);
  });

  test('ranks multiple house candidates', () => {
    const result = adviseSites('house', [
      {
        label: '闹市公寓',
        address: '上海 南京西路 地铁 商业广场',
        lat: 31.23,
        lng: 121.45,
        facing: '西',
        areaSqm: 70,
      },
      {
        label: '公园南向',
        address: '上海 某处 公园 湖 地铁',
        lat: 31.2,
        lng: 121.5,
        facing: '南',
        areaSqm: 110,
      },
    ]);
    assert.equal(result.candidates.length, 2);
    assert.ok(result.winnerId);
    assert.ok(result.candidates[0].totalScore >= result.candidates[1].totalScore);
    assert.ok(result.summary.includes('候选'));
  });

  test('shop corner boosts score path', () => {
    const result = adviseSites('shop', [
      {
        label: '转角餐饮',
        address: '杭州 湖滨 步行街 地铁',
        lat: 30.25,
        lng: 120.16,
        industry: '餐饮',
        corner: true,
        streetFront: true,
        floor: 1,
      },
      {
        label: '二楼里铺',
        address: '杭州 某巷',
        lat: 30.26,
        lng: 120.17,
        industry: '美业',
        corner: false,
        streetFront: false,
        floor: 2,
      },
    ]);
    assert.ok(result.candidates[0].label.includes('转角') || result.candidates[0].totalScore >= 50);
    assert.ok(result.candidates[0].footTraffic.hourly.length === 24);
  });

  test('yinzhai uses quiet and form dimensions', () => {
    const result = adviseSites('yinzhai', [
      {
        label: '陵园靠山',
        address: '苏州 某某陵园 山 岗',
        lat: 31.3,
        lng: 120.6,
        hasBackMountain: true,
        openMingTang: true,
        facing: '南',
      },
    ]);
    assert.equal(result.candidates[0].suggestedDomain, 'tomb');
    assert.ok(result.candidates[0].dimensions.some((d) => d.key === 'back'));
  });
});
