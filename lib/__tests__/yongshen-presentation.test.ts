import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { determineYongShen } from '../bazi-analyzer';
import {
  formatYongShenPublic,
  elementsToCn,
  YONGSHEN_USER_DOCTRINE,
  YONGSHEN_CONTENT_BLURB,
} from '../yongshen-presentation';

describe('yongshen-presentation (user-facing)', () => {
  it('elementsToCn normalizes EN/CN', () => {
    assert.deepEqual(elementsToCn(['wood', '水', 'fire', '木']), ['木', '水', '火']);
  });

  it('formats 丙戌辛丑甲辰乙丑: 主用神水木, 调候火分列', () => {
    const ys = determineYongShen(['丙戌', '辛丑', '甲辰', '乙丑']);
    const pub = formatYongShenPublic(ys);
    assert.ok(pub);
    assert.ok(pub!.yongShen.includes('水'));
    assert.ok(pub!.yongShen.includes('木'));
    assert.ok(!pub!.yongShen.includes('火'), '火不得进主用神');
    assert.equal(pub!.tiaohuoElement, '火');
    assert.ok(pub!.tiaohuoNote && /调候/.test(pub!.tiaohuoNote));
    assert.match(pub!.headline, /生扶|水|木/);
    assert.ok(pub!.reasonChain.some((l) => /失令|当令|月令/.test(l)));
    assert.ok(pub!.reasonChain.some((l) => /扶抑|印|比劫/.test(l)));
    assert.ok(pub!.lockedFacts.includes('主用神（扶抑）'));
    assert.ok(!/wood|fire|metal/.test(pub!.chipLine));
  });

  it('doctrine and content blurb present', () => {
    assert.ok(YONGSHEN_USER_DOCTRINE.includes('扶抑'));
    assert.ok(YONGSHEN_CONTENT_BLURB.faqs.length >= 2);
  });
});
