import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  listHasElement,
  normalizeElementList,
  toElementCn,
  toElementEn,
} from '@/lib/wuxing-normalize';

describe('wuxing-normalize', () => {
  it('maps EN and CN to the same key', () => {
    assert.equal(toElementEn('木'), 'wood');
    assert.equal(toElementEn('wood'), 'wood');
    assert.equal(toElementCn('wood'), '木');
    assert.equal(toElementCn('水'), '水');
  });

  it('listHasElement matches mixed 五行 lists', () => {
    assert.equal(listHasElement(['wood', 'fire'], '木'), true);
    assert.equal(listHasElement(['木', '火'], 'wood'), true);
    assert.equal(listHasElement(['wood'], '金'), false);
    assert.equal(listHasElement(null, '木'), false);
  });

  it('normalizeElementList dedupes mixed scripts', () => {
    assert.deepEqual(normalizeElementList(['wood', '木', 'fire', '水']), ['木', '火', '水']);
  });
});
