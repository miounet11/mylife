import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { runWorldYiEngine } from '@/lib/world-yi-engine';
import { JUDGMENT_METHOD } from '@/lib/prompts/shared/world-yi';
import { WORLD_YI_JUDGMENT_METHOD } from '@/lib/world-yi-logic';

function stubResult(over: Partial<FortuneAnalysisResult> = {}): FortuneAnalysisResult {
  return {
    basic: { dayMaster: '甲', pillars: [] },
    yongShen: {
      dayMaster: '甲',
      strength: 'weak',
      strengthDesc: '身弱',
      yongShen: ['木', '水'],
      jiShen: ['金'],
    },
    fiveElements: {} as FortuneAnalysisResult['fiveElements'],
    tenGods: { self: '甲', output: ['正印'], input: [], control: [], controlled: [] },
    pattern: { type: '正印格', strength: '偏弱', quality: '', description: '印星生身，宜建设积累' },
    fortune: {
      currentDaYun: '戊寅大运',
      currentLiuNian: '丙午年',
      interaction: '木火相生，阶段偏升',
      nextYear: '',
    },
    advice: { career: {} as any, wealth: {} as any, marriage: {} as any, health: {} as any, colors: [], directions: [], timing: [] },
    evidence: { statistics: {} as any, celebrities: [], similarCases: [] },
    analysis: { opening: '', explanation: '' },
    ...over,
  } as FortuneAnalysisResult;
}

describe('世界易引擎', () => {
  it('shares one judgment method with chat/agents', () => {
    assert.equal(JUDGMENT_METHOD, WORLD_YI_JUDGMENT_METHOD);
    assert.match(JUDGMENT_METHOD, /建设\/表达\/协调\/收敛/);
    assert.match(JUDGMENT_METHOD, /抬升期/);
    assert.ok(!/田活|草木灰/.test(JUDGMENT_METHOD));
  });

  it('emits six layers beside 易学 facts without rewriting 用神', () => {
    const reading = runWorldYiEngine(stubResult());
    assert.equal(reading.layers.length, 6);
    assert.equal(reading.yixue.dayMaster, '甲');
    assert.deepEqual(reading.yixue.yongShen, ['木', '水']);
    assert.equal(reading.playType, '建设');
    assert.equal(reading.stage, '抬升');
    assert.match(reading.refuse, /不改写/);
    assert.ok(!/草木灰|种树|田活/.test(JSON.stringify(reading)));
  });
});
