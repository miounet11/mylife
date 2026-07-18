import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyEfcVerifyToAnswer,
  splitEfcNoticeFromAnswer,
  verifyChatAnswerAgainstEfc,
} from '@/lib/chat-efc-verify';

describe('chat-efc-verify', () => {
  it('passes when day master matches', () => {
    const r = verifyChatAnswerAgainstEfc('判断依据：日主甲，用神木水。', {
      dayMaster: '甲',
      yongShen: ['木', '水'],
    });
    assert.equal(r.ok, true);
  });

  it('flags wrong day master', () => {
    const r = verifyChatAnswerAgainstEfc('根据你的日主丙火…', {
      dayMaster: '甲',
      yongShen: ['木'],
    });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.includes('日主')));
  });

  it('flags ji shen as yong shen', () => {
    const r = verifyChatAnswerAgainstEfc('你的用神是火，宜向南方发展。', {
      dayMaster: '甲',
      yongShen: ['木', '水'],
      jiShen: ['火'],
    });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.includes('忌神') || i.includes('用神')));
  });

  it('appends notice once', () => {
    const { answer, efcOk } = applyEfcVerifyToAnswer('日主庚金很旺。', {
      dayMaster: '甲',
      yongShen: ['木'],
    });
    assert.equal(efcOk, false);
    assert.ok(answer.includes('结构校验提示'));
    const again = applyEfcVerifyToAnswer(answer, { dayMaster: '甲', yongShen: ['木'] });
    assert.equal((again.answer.match(/结构校验提示/g) || []).length, 1);
  });

  it('splits efc notice for UI banner', () => {
    const { answer } = applyEfcVerifyToAnswer('结论先稳住。日主庚金。', {
      dayMaster: '甲',
      yongShen: ['木'],
    });
    const split = splitEfcNoticeFromAnswer(answer);
    assert.equal(split.efcFlagged, true);
    assert.ok(!split.body.includes('结构校验提示'));
    assert.ok(split.body.includes('结论') || split.body.includes('稳住') || split.body.includes('日主'));
  });
});
