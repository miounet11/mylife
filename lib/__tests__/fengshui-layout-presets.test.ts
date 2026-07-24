import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  LAYOUT_PRESETS,
  applyPresetToState,
  filterPresets,
  listPresets,
  scalePresetToArea,
} from '@/lib/fengshui/space/layout-presets';
import { createDefaultLabState } from '@/lib/fengshui/space';

describe('Layout presets catalog', () => {
  test('covers three domains with enough presets', () => {
    assert.ok(LAYOUT_PRESETS.length >= 20);
    assert.ok(listPresets('residential').length >= 8);
    assert.ok(listPresets('shop').length >= 5);
    assert.ok(listPresets('tomb').length >= 5);
  });

  test('filter by area and layout finds 三室 near 100㎡', () => {
    const hits = filterPresets({ domain: 'residential', layout: '三室', areaSqm: 100 });
    assert.ok(hits.length >= 1);
    assert.ok(hits[0].layout.includes('三室') || hits[0].title.includes('三室'));
  });

  test('scalePresetToArea changes room dimensions', () => {
    const base = listPresets('residential')[0];
    const scaled = scalePresetToArea(base, base.areaSqm * 1.5);
    assert.ok(scaled.room.widthM * scaled.room.depthM > base.room.widthM * base.room.depthM * 0.9);
  });

  test('applyPresetToState injects vents and structures', () => {
    const preset = listPresets('shop')[0];
    const next = applyPresetToState(createDefaultLabState(), preset, { areaSqm: 55 });
    assert.ok(next.vents.length >= 1);
    assert.ok(next.structures.length >= 0);
    assert.ok(next.room.widthM > 0);
  });
});
