import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyJudgments,
  buildCohortMirror,
  emptyCalibration,
  formatCohortMemoryBlock,
  parseBirthYear,
  resolveCohortKey,
  resolveCohortRegion,
  sanitizeCalibration,
  matchStats,
} from '@/lib/cohort-lenses';
import { buildPromptModules } from '@/lib/agentic-report/prompt-injector';
import { buildCohortClaims } from '@/lib/cohort-lenses/claims';
import { getCohortFacts } from '@/lib/cohort-lenses/cohorts';

describe('cohort-lenses', () => {
  it('parses ISO and DMY birth dates', () => {
    assert.equal(parseBirthYear('1993-08-19'), 1993);
    assert.equal(parseBirthYear('19/08/1993'), 1993);
    assert.equal(parseBirthYear('08.19.1993'), 1993);
    assert.equal(parseBirthYear('1993年8月19日'), 1993);
    assert.equal(parseBirthYear('1890-01-01'), null);
  });

  it('maps year bands and birth place regions', () => {
    assert.equal(resolveCohortKey(1982), 'cn-80-84');
    assert.equal(resolveCohortKey(1993), 'cn-90-94');
    assert.equal(resolveCohortKey(1997), 'cn-95-99');
    assert.equal(resolveCohortRegion('上海'), 'cn-mainland');
    assert.equal(resolveCohortRegion('香港'), 'greater-china');
    assert.equal(resolveCohortRegion('Toronto, Canada'), 'overseas');
  });

  it('builds seven checkable lenses for a birth year', () => {
    const view = buildCohortMirror({
      birthDate: '1993-08-19',
      birthPlace: '上海',
      now: new Date('2026-08-18'),
    });
    assert.ok(view);
    assert.equal(view!.birthYear, 1993);
    assert.equal(view!.currentAge, 33);
    assert.equal(view!.lenses.length, 7);
    assert.ok(view!.lenses.every((lens) => lens.claims.length >= 3));
    assert.ok(view!.stages.some((stage) => stage.current && stage.id === '33-42'));
    assert.match(view!.disclaimer, /占星/);
    assert.equal(view!.progress.judgedClaims, 0);
  });

  it('records like / unlike into personal memory and prompt block', () => {
    const facts = getCohortFacts(1993);
    const claims = buildCohortClaims(facts, 'cn-mainland');
    const base = emptyCalibration({
      birthYear: 1993,
      cohortKey: facts.key,
      region: 'cn-mainland',
      now: new Date('2026-08-18T00:00:00.000Z'),
    });
    const next = applyJudgments(
      base,
      [
        {
          claimId: 'career.trap',
          lensId: 'career',
          verdict: 'like',
          judgedAt: '2026-08-18T00:00:00.000Z',
        },
        {
          claimId: 'money.habit',
          lensId: 'money',
          verdict: 'unlike',
          forkId: 'save',
          judgedAt: '2026-08-18T00:00:00.000Z',
        },
      ],
      claims,
      new Date('2026-08-18T00:00:00.000Z'),
    );
    assert.ok(next.confirmedTraits.some((item) => /平台|陷阱|职级/.test(item) || item.length > 0));
    assert.ok(next.confirmedTraits.includes('金钱上先储蓄后配置'));
    assert.ok(next.deniedTraits.length >= 1);
    assert.ok(next.focusLenses.includes('money'));

    const block = formatCohortMemoryBlock(next);
    assert.match(block, /已确认/);
    assert.match(block, /已否认/);
    assert.match(block, /禁止再写成/);
    assert.ok(!block.includes('当作已证实的个人经历。') || block.includes('假说'));
  });

  it('applies unlike + fork in the mirror summary', () => {
    const previous = applyJudgments(
      emptyCalibration({
        birthYear: 1982,
        cohortKey: 'cn-80-84',
        region: 'cn-mainland',
      }),
      {
        claimId: 'childhood.family',
        lensId: 'childhood',
        verdict: 'unlike',
        forkId: 'many-siblings',
        judgedAt: '2026-08-18T00:00:00.000Z',
      },
      buildCohortClaims(getCohortFacts(1982), 'cn-mainland'),
    );
    const view = buildCohortMirror({
      birthDate: '1982-03-01',
      birthPlace: '成都',
      calibration: previous,
    });
    assert.ok(view);
    assert.ok(view!.memory.confirmed.includes('多子女、资源竞争型家庭'));
    assert.ok(view!.progress.judgedClaims >= 1);
    const family = view!.lenses
      .find((lens) => lens.id === 'childhood')
      ?.claims.find((claim) => claim.id === 'childhood.family');
    assert.equal(family?.verdict, 'unlike');
    assert.equal(family?.forkId, 'many-siblings');
  });

  it('computes overlap from like / unlike judgments', () => {
    const stats = matchStats({
      version: 1,
      birthYear: 1993,
      cohortKey: 'cn-90-94',
      region: 'cn-mainland',
      judgments: [
        { claimId: 'a', lensId: 'career', verdict: 'like', judgedAt: '2026-08-18T00:00:00.000Z' },
        { claimId: 'b', lensId: 'money', verdict: 'unlike', judgedAt: '2026-08-18T00:00:00.000Z' },
        { claimId: 'c', lensId: 'childhood', verdict: 'partial', judgedAt: '2026-08-18T00:00:00.000Z' },
      ],
      confirmedTraits: [],
      deniedTraits: [],
      focusLenses: [],
      updatedAt: '2026-08-18T00:00:00.000Z',
    });
    assert.equal(stats.like, 1);
    assert.equal(stats.unlike, 1);
    assert.equal(stats.partial, 1);
    assert.equal(stats.overlapPct, 50);
  });

  it('exposes COHORT_MEMORY in agent prompt modules', () => {
    const modules = buildPromptModules({
      engine: {
        lifeProfile: {
          hasPreviousReports: true,
          recentEvents: [],
          focusAreas: [],
          cohortMemory: '【世代校准 · 用户已核对的个人事实】\n已确认：职业身份曾过度绑定平台职级',
        },
      } as any,
      context: {} as any,
      report: { input: {}, raw: null },
    });
    const cohort = modules.find((item) => item.label === 'COHORT_MEMORY');
    assert.ok(cohort?.content.includes('已确认'));
  });

  it('rejects malformed stored calibration', () => {
    assert.equal(sanitizeCalibration({ birthYear: 1990 }), null);
    assert.ok(
      sanitizeCalibration({
        birthYear: 1990,
        cohortKey: 'cn-90-94',
        region: 'cn-mainland',
        judgments: [{ claimId: 'x', lensId: 'career', verdict: 'like', judgedAt: '2026-01-01T00:00:00.000Z' }],
      }),
    );
  });
});
