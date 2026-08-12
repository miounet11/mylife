import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { determineYongShen } from '@/lib/bazi-analyzer';
import { buildFortuneContextInput } from '@/lib/fortune-context-builder';
import { runNatalEngineChain } from '@/lib/natal-engine-chain';
import { branchToElementEn, toElementEn } from '@/lib/wuxing-normalize';

describe('natal engine chain', () => {
  it('passes civil date into 用神 so 司令 can differ from 本气-only', () => {
    const civil = new Date(1990, 0, 8);
    const natal = runNatalEngineChain({
      civilDate: civil,
      civilTime: '08:30',
      pillarDate: civil,
      pillarTime: '08:30',
      gender: 'male',
      birthPlace: '北京',
    });
    assert.ok(natal.pillars.length === 4);
    assert.ok(natal.yongShen);
    assert.ok(natal.yongShen!.yongShen.every((el) => toElementEn(el)));
    assert.equal(natal.dayun.dayuns, natal.dayun.dayunList);
    assert.equal(natal.dayun.dayuns.length, 10);
    assert.ok(natal.kline.length > 0);
    natal.dayun.dayuns.forEach((row) => {
      if (row.ganWuxing) assert.ok(['wood', 'fire', 'earth', 'metal', 'water'].includes(row.ganWuxing));
      if (row.zhiWuxing) assert.ok(['wood', 'fire', 'earth', 'metal', 'water'].includes(row.zhiWuxing));
    });
  });

  it('buildFortuneContextInput uses the same natal chain', () => {
    const ctx = buildFortuneContextInput({
      birthDate: '1990-01-08',
      birthTime: '08:30',
      birthPlace: '北京',
      gender: 'male',
      birthAccuracy: 'exact',
    });
    assert.ok(ctx.truthInput.yongShen);
    assert.ok(Array.isArray(ctx.truthInput.dayun?.dayunList));
    assert.ok((ctx.truthInput.dayun?.dayunList || []).length > 0);
  });

  it('branchToElementEn matches 子=water', () => {
    assert.equal(branchToElementEn('子'), 'water');
    assert.equal(branchToElementEn('寅'), 'wood');
  });

  it('bare determineYongShen without date is 本气-only — chain must not regress to that', () => {
    const bazi = ['丙戌', '辛丑', '甲辰', '乙丑'];
    const bare = determineYongShen(bazi);
    const withDay = determineYongShen(bazi, { dayInMonth: 5 });
    assert.ok(bare);
    assert.ok(withDay);
    assert.notEqual(bare!.details?.siling?.fromSiling && withDay!.details?.siling?.gan, undefined);
  });
});
