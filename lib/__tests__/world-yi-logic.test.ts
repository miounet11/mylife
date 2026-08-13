import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  WORLD_YI_LAYERS,
  WORLD_YI_LOGIC_AXIOMS,
  WORLD_YI_LOGIC_BRIEF,
  WORLD_YI_SITUATIONS,
  WORLD_YI_TERMS,
  explainWorldYiQuery,
  explainWorldYiSituation,
  formatWorldYiExplanation,
  matchWorldYiSituations,
} from '@/lib/world-yi-logic';

const FORBIDDEN = /墓库是坟|墓库是墓地|开运城市|龙的传人|命该如此/;

describe('世界易定义与处境解释', () => {
  it('six layers each have definition, field metaphor, and a refuse line', () => {
    assert.equal(WORLD_YI_LAYERS.length, 6);
    for (const layer of WORLD_YI_LAYERS) {
      assert.ok(layer.definition.length > 20, layer.id);
      assert.ok(layer.fieldMetaphor.length > 8, layer.id);
      assert.ok(layer.refuse.includes('不'), layer.id);
      assert.ok(!FORBIDDEN.test(layer.definition + layer.refuse), layer.id);
    }
  });

  it('warehouse term is inventory, not a grave', () => {
    const warehouse = WORLD_YI_TERMS.find((t) => t.id === 'warehouse');
    assert.ok(warehouse);
    assert.match(warehouse!.definition, /库存|入库|余气/);
    assert.match(warehouse!.refuse, /坟/);
    assert.ok(!/埋骨头|龙的传人/.test(warehouse!.definition));
  });

  it('every situation can be explained through the five judgment lines', () => {
    assert.ok(WORLD_YI_SITUATIONS.length >= 12);
    for (const item of WORLD_YI_SITUATIONS) {
      const exp = explainWorldYiSituation(item.id);
      assert.ok(exp, item.id);
      assert.equal(exp!.situation?.id, item.id);
      assert.ok(exp!.structure);
      assert.ok(exp!.timing);
      assert.ok(exp!.environment);
      assert.ok(exp!.action);
      assert.ok(exp!.risk);
      assert.ok(exp!.refuse.startsWith('不'));
      assert.ok(!FORBIDDEN.test(formatWorldYiExplanation(exp!)), item.id);
    }
  });

  it('matches concrete life queries to the right situation', () => {
    const offer = matchWorldYiSituations('有offer不敢走', 1);
    assert.equal(offer[0]?.situation.id, 'offer-held');

    const money = matchWorldYiSituations('收入不低却月光存不下', 1);
    assert.equal(money[0]?.situation.id, 'high-pay-no-save');

    const city = matchWorldYiSituations('不顺就想换城润出去', 1);
    assert.equal(city[0]?.situation.id, 'flee-city');

    const unpublished = explainWorldYiQuery('作品做完了不敢发');
    assert.equal(unpublished.situation?.id, 'unpublished');
    assert.match(unpublished.headline, /仓库|时位|吉凶/);
  });

  it('unknown query still returns a six-layer template, not a fortune', () => {
    const exp = explainWorldYiQuery('今天彩票会中吗');
    assert.equal(exp.situation, null);
    assert.match(exp.refuse, /吉凶|命该如此/);
    assert.ok(WORLD_YI_LOGIC_AXIOMS.length >= 5);
    assert.match(WORLD_YI_LOGIC_BRIEF, /仓库/);
    assert.ok(!/龙的传人|草木灰/.test(WORLD_YI_LOGIC_BRIEF));
  });
});
