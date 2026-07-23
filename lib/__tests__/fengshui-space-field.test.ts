import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefaultLabState,
  simulateSpaceField,
  heatmapColor,
  hourToDizhi,
  azimuthToFacingLabel,
} from '@/lib/fengshui/space';

describe('Space field simulation', () => {
  test('default state simulates grids of expected size', () => {
    const state = createDefaultLabState();
    const result = simulateSpaceField(state);
    const n = state.gridSize * state.gridSize;
    assert.strictEqual(result.grids.energy.length, n);
    assert.strictEqual(result.grids.wind.length, n);
    assert.strictEqual(result.grids.light.length, n);
    assert.ok(result.summary.peakEnergy >= 0 && result.summary.peakEnergy <= 1);
    assert.ok(result.summary.structuralNotes.length >= 1);
    assert.ok(result.summary.priorityActions.length >= 1);
  });

  test('disabling vents changes energy field', () => {
    const a = createDefaultLabState();
    const b = createDefaultLabState();
    b.vents = b.vents.map((v) => ({ ...v, enabled: false }));
    const ra = simulateSpaceField(a);
    const rb = simulateSpaceField(b);
    let sumA = 0;
    let sumB = 0;
    for (let i = 0; i < ra.grids.energy.length; i++) {
      sumA += ra.grids.energy[i];
      sumB += rb.grids.energy[i];
    }
    assert.ok(sumA !== sumB || ra.summary.draftCorridor !== rb.summary.draftCorridor);
  });

  test('heatmapColor returns rgba tuple', () => {
    const c = heatmapColor(0.8);
    assert.strictEqual(c.length, 4);
    assert.ok(c[0] >= 0 && c[0] <= 255);
  });

  test('hourToDizhi and azimuth labels', () => {
    assert.strictEqual(hourToDizhi(0), '子');
    assert.ok(typeof azimuthToFacingLabel(90) === 'string');
  });
});
