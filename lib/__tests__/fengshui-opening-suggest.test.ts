import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  heuristicOpenings,
  openingsToVents,
  parseOpeningsFromModelText,
} from '@/lib/fengshui/space/opening-suggest';

describe('Opening suggest', () => {
  test('heuristicOpenings returns inlet and outlets', () => {
    const list = heuristicOpenings('南');
    assert.ok(list.length >= 2);
    assert.ok(list.some((o) => o.kind === 'inlet'));
    assert.ok(list.some((o) => o.kind === 'outlet'));
  });

  test('openingsToVents maps coordinates', () => {
    const vents = openingsToVents(heuristicOpenings('东'));
    assert.strictEqual(vents.length, heuristicOpenings('东').length);
    assert.ok(vents.every((v) => v.x >= 0 && v.x <= 1 && v.y >= 0 && v.y <= 1));
  });

  test('parseOpeningsFromModelText reads JSON', () => {
    const text = JSON.stringify({
      openings: [
        {
          kind: 'inlet',
          x: 0.5,
          y: 0.9,
          azimuthDeg: 90,
          label: '门',
          confidence: 0.8,
          reason: 'visible',
        },
      ],
    });
    const parsed = parseOpeningsFromModelText(text);
    assert.ok(parsed);
    assert.strictEqual(parsed![0].kind, 'inlet');
    assert.strictEqual(parsed![0].label, '门');
  });
});
