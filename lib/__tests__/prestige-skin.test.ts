import assert from 'node:assert/strict';
import test from 'node:test';
import { IMMERSION_SURFACES } from '@/lib/brand/immersion-surfaces';
import { PRESTIGE_SURFACE_KEYS } from '@/lib/brand/prestige';

test('ceremonial hubs use prestige skin; utility hubs stay editorial', () => {
  for (const key of PRESTIGE_SURFACE_KEYS) {
    assert.equal(IMMERSION_SURFACES[key].skin, 'prestige', `${key} should be prestige`);
  }
  assert.equal(IMMERSION_SURFACES.login.skin, 'editorial');
  assert.equal(IMMERSION_SURFACES.tools.skin, 'editorial');
  assert.equal(IMMERSION_SURFACES.community.skin, 'editorial');
  assert.equal(IMMERSION_SURFACES.almanac.skin, 'editorial');
});
