import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { buildDayComparePack } from '@/lib/astro/day-compare-engine';
import { buildAstroMonthPack } from '@/lib/astro/month-engine';
import { buildAstroPairPack } from '@/lib/astro/pair-engine';

describe('astro daily match engine', () => {
  const day = '2026-08-07';

  it('builds birth pack for 1991-03-28 × day with evidence', () => {
    const pack = buildAstroDailyMatchPack(day, { kind: 'birth', birthDate: '1991-03-28' });
    assert.ok(pack);
    assert.equal(pack!.quality.ok, true);
    assert.ok(pack!.evidence.length >= 3);
    assert.ok(pack!.almanac.dayGanZhi);
    assert.ok(pack!.scores.composite >= 0 && pack!.scores.composite <= 100);
    assert.ok(pack!.seo.description.length >= 40);
    assert.ok(pack!.seo.description.length <= 160);
    assert.ok(pack!.natal?.dayMaster);
    assert.ok(pack!.seo.title.includes('1991'));
  });

  it('zone phase differs aries-z1 vs aries-z4 same day', () => {
    const z1 = buildAstroDailyMatchPack(day, { kind: 'zone', id: 'aries-z1' });
    const z4 = buildAstroDailyMatchPack(day, { kind: 'zone', id: 'aries-z4' });
    assert.ok(z1 && z4);
    assert.notEqual(z1!.scores.composite, z4!.scores.composite);
    assert.ok(z1!.identity.title.includes('一区'));
    assert.ok(z4!.identity.title.includes('四区'));
  });

  it('sign pack has tong-shu yi/ji', () => {
    const pack = buildAstroDailyMatchPack(day, { kind: 'sign', key: 'leo' });
    assert.ok(pack);
    assert.ok(Array.isArray(pack!.almanac.yi));
    assert.ok(Array.isArray(pack!.almanac.ji));
    assert.equal(pack!.identity.kind, 'sign');
  });

  it('invalid date returns null', () => {
    assert.equal(buildAstroDailyMatchPack('not-a-date', { kind: 'sign', key: 'leo' }), null);
    assert.equal(buildAstroDailyMatchPack(day, { kind: 'zone', id: 'nope' }), null);
  });

  it('rising pack emphasizes presentation evidence', () => {
    const pack = buildAstroDailyMatchPack(day, { kind: 'rising', key: 'virgo' });
    assert.ok(pack);
    assert.ok(pack!.identity.title.includes('上升'));
    assert.ok(pack!.evidence.length >= 3);
  });

  it('element and shengxiao packs build', () => {
    const el = buildAstroDailyMatchPack(day, { kind: 'element', slug: 'fire' });
    const sx = buildAstroDailyMatchPack(day, { kind: 'shengxiao', slug: 'horse' });
    assert.ok(el && el.evidence.length >= 3);
    assert.ok(sx && sx.identity.title.includes('马'));
  });
});

describe('astro expand engines', () => {
  it('day compare ranks 12 signs', () => {
    const pack = buildDayComparePack('2026-08-07');
    assert.ok(pack);
    assert.equal(pack!.signs.length, 12);
    assert.ok(pack!.topSigns.length === 3);
  });

  it('pair pack aries-leo', () => {
    const pack = buildAstroPairPack('aries', 'leo');
    assert.ok(pack);
    assert.ok(pack!.score >= 20 && pack!.score <= 90);
  });

  it('month pack has days', () => {
    const pack = buildAstroMonthPack(
      2026,
      8,
      { kind: 'sign', key: 'leo' },
      '狮子座',
      (d) => `/astro/signs/leo/day/${d}`,
    );
    assert.ok(pack);
    assert.ok(pack!.cells.length >= 28);
    assert.ok(pack!.best);
  });
});
