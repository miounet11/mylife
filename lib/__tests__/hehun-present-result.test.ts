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

  it('maps 天干合 + 木生火-style details without major CJK (stems allowed)', () => {
    // Heavenly stems / earthly branches may remain; other CJK should be mapped.
    const GANZHI_RE = /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g;
    const raw = minimalMockResult({
      layers: [
        {
          key: 'day-stem',
          title: '日主互动',
          score: 82,
          status: 'good',
          summary: '天干合：甲己，亲和力与粘合力偏强',
          details: [
            '天干合：甲己，亲和力与粘合力偏强',
            'Alice（木）生 Bob（火），付出/推动感偏 Alice',
            'Bob（火）克 Alice（木），主导权需协商，避免压制',
            '同气相求（木），理解快，也易争主导',
            'Alice甲 与 Bob己 互动中性，重在规则清晰。',
            '日干 甲 vs 己',
          ],
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
          key: 'dayun',
          title: '大运同步',
          score: 60,
          status: 'ok',
          summary: 'Alice 现行大运 甲子（25-34岁）',
          details: [
            'Alice 现行大运 甲子（25-34岁）',
            '大运五行相生（木–火），可互相借力',
          ],
        },
      ],
    });
    const en = presentHehunResult(raw, 'en');
    const day = en.layers[0]!;
    const dayun = en.layers[2]!;

    assert.match(day.summary, /Stem combination/i);
    assert.match(day.details[1]!, /generates/i);
    assert.match(day.details[1]!, /Wood/);
    assert.match(day.details[1]!, /Fire/);
    assert.match(day.details[1]!, /giving\/push energy leans toward/i);
    assert.match(day.details[2]!, /controls/i);
    assert.match(day.details[2]!, /negotiate leadership/i);
    assert.match(day.details[3]!, /same-element affinity/i);
    assert.match(day.details[4]!, /and /);
    assert.match(day.details[4]!, /interaction neutral/i);
    assert.match(dayun.summary, /current Dayun/i);
    assert.match(dayun.summary, /25-34 yrs/);
    assert.match(dayun.details[1]!, /five-element generation/i);
    assert.match(dayun.details[1]!, /Wood/);
    assert.match(dayun.details[1]!, /Fire/);

    const samples = [day.summary, ...day.details, dayun.summary, ...dayun.details];
    for (const s of samples) {
      const residual = s.replace(GANZHI_RE, '');
      assert.ok(!CJK_RE.test(residual), `unexpected major CJK in: ${s}`);
    }
  });
});
