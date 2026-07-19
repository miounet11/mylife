import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HehunResult } from '@/lib/hehun-engine';
import { presentHehunResult } from '@/lib/hehun/present-result';

const CJK_RE = /[\u3400-\u9fff]/;

function minimalMockResult(overrides: Partial<HehunResult> = {}): HehunResult {
  return {
    score: 72,
    band: '可经营',
    headline: 'Alice 与 Bob：综合 72/100 · 可经营',
    layers: [
      {
        key: 'day-stem',
        title: '日主互动',
        score: 70,
        status: 'good',
        summary: '天干合：甲己，亲和力与粘合力偏强',
        details: ['天干合：甲己，亲和力与粘合力偏强', '日干 甲 vs 己'],
      },
      {
        key: 'palace',
        title: '夫妻宫（日支）',
        score: 65,
        status: 'ok',
        summary: '日支六合 子丑，生活节奏与安全感较易咬合',
        details: ['日支六合 子丑，生活节奏与安全感较易咬合'],
      },
      {
        key: 'yong',
        title: '用忌互补',
        score: 60,
        status: 'ok',
        summary: '用忌信息有限，以沟通与边界为主。',
        details: ['用忌待补全'],
      },
    ],
    doList: [
      '每月固定一次「无指责」对齐：时间、金钱、家人边界',
      '重大承诺选双方情绪稳定、非低谷窗口推进',
    ],
    avoidList: [
      '避免用「合不合」替代具体沟通',
      '避免在一方高压运势窗口逼迫领证/分手二选一',
    ],
    plainForCouple: '【合婚白话 · test】\nAlice 与 Bob：综合 72/100 · 可经营\n\n宜做：\n  1. x\n慎做：\n  1. y',
    proNotes: [
      'Alice 日柱 甲子 · 用 木 · 忌 金 · 大运 —',
      '权重：日干 35% · 日支夫妻宫 40% · 用忌互补 25%',
    ],
    knowledgeStamp: 'KB',
    personA: { name: 'Alice', dayPillar: '甲子' },
    personB: { name: 'Bob', dayPillar: '己丑' },
    ...overrides,
  };
}

describe('presentHehunResult', () => {
  it('zh / null locale passthrough (same object reference)', () => {
    const raw = minimalMockResult();
    assert.equal(presentHehunResult(raw, 'zh-CN'), raw);
    assert.equal(presentHehunResult(raw, null), raw);
    assert.equal(presentHehunResult(raw, undefined), raw);
    assert.equal(presentHehunResult(raw, 'zh-Hant'), raw);
  });

  it('en maps band/title chrome without CJK on chrome fields', () => {
    const raw = minimalMockResult();
    const en = presentHehunResult(raw, 'en');

    assert.notEqual(en, raw);
    assert.equal(en.band, 'Workable');
    assert.equal(en.headline, 'Alice & Bob: 72/100 · Workable');
    assert.ok(!CJK_RE.test(en.band));
    assert.ok(!CJK_RE.test(en.headline));

    for (const layer of en.layers) {
      assert.ok(!CJK_RE.test(layer.title), `layer title should be EN: ${layer.title}`);
    }
    assert.equal(en.layers[0]!.title, 'Day Master interaction');
    assert.equal(en.layers[1]!.title, 'Spouse palace (day branch)');
    assert.equal(en.layers[2]!.title, 'Favorable / unfavorable complement');

    // Fixed do/avoid templates
    assert.equal(
      en.doList[0],
      'Hold a fixed monthly “no-blame” alignment: time, money, family boundaries',
    );
    assert.equal(
      en.avoidList[0],
      'Don’t let “compatible or not” replace concrete communication',
    );
    for (const item of [...en.doList, ...en.avoidList]) {
      assert.ok(!CJK_RE.test(item), `do/avoid should be EN: ${item}`);
    }

    // Layer summaries map common phrases
    assert.match(en.layers[0]!.summary, /Stem combination/i);
    assert.match(en.layers[1]!.summary, /Day-branch six-harmony/i);
    assert.ok(!CJK_RE.test(en.layers[2]!.summary));

    // plainForCouple English shell
    assert.match(en.plainForCouple, /Compatibility plain/);
    assert.match(en.plainForCouple, /^Do:/m);
    assert.match(en.plainForCouple, /^Avoid:/m);
    assert.match(en.plainForCouple, /not a substitute for real choices/);

    // proNotes light labels
    assert.match(en.proNotes[0]!, /Day pillar/);
    assert.match(en.proNotes[0]!, /Fav/);
    assert.match(en.proNotes[0]!, /Unfav/);
    assert.match(en.proNotes[1]!, /Weights/);
    assert.ok(!CJK_RE.test(en.proNotes[1]!), `weight note EN: ${en.proNotes[1]}`);

    // Score / persons unchanged
    assert.equal(en.score, raw.score);
    assert.deepEqual(en.personA, raw.personA);
    assert.deepEqual(en.personB, raw.personB);
  });

  it('accepts en-US locale prefix', () => {
    const en = presentHehunResult(minimalMockResult(), 'en-US');
    assert.equal(en.band, 'Workable');
  });
});
