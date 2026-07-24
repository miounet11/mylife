import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DOMAIN_MODEL_META, isSpaceActiveDomain } from '@/lib/fengshui/space/domain-models';
import {
  applyPresetToState,
  listPresets,
} from '@/lib/fengshui/space/layout-presets';
import { createDefaultLabState } from '@/lib/fengshui/space/field-sim';
import { buildProSessionExport, buildProBriefText } from '@/lib/fengshui/space/pro-export';
import { simulateSpaceField } from '@/lib/fengshui/space/field-sim';

describe('domain 3D model meta', () => {
  test('seven domains have model kits', () => {
    for (const d of [
      'residential',
      'villa',
      'rural',
      'apartment',
      'office',
      'shop',
      'tomb',
    ] as const) {
      assert.ok(isSpaceActiveDomain(d));
      assert.ok(DOMAIN_MODEL_META[d].modelName.length > 2);
      assert.ok(DOMAIN_MODEL_META[d].defaultRoom.widthM > 0);
    }
  });

  test('applyPreset sets activeDomain', () => {
    const rural = listPresets('rural')[0];
    const next = applyPresetToState(createDefaultLabState(), rural);
    assert.equal(next.activeDomain, 'rural');
    assert.equal(next.presetId, rural.id);
  });

  test('pro export includes domain and metrics', () => {
    const state = createDefaultLabState();
    state.activeDomain = 'shop';
    const result = simulateSpaceField(state);
    const exp = buildProSessionExport(state, result);
    assert.equal(exp.domain, 'shop');
    assert.equal(exp.schema, 'life-kline.space-lab.v1');
    assert.ok(buildProBriefText(exp).includes('商铺'));
  });
});
