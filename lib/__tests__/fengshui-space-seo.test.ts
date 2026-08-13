import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listSpaceSeoScenarios } from '@/lib/fengshui/space/seo-catalog';
import {
  buildSpaceSeoReport,
  snapshotSpaceSeoScene,
  spaceSeoCoverage,
  workbenchHref,
} from '@/lib/fengshui/space/seo-report';

describe('空间场 SEO/GEO reports', () => {
  it('builds hundreds of unique decision reports', () => {
    const list = listSpaceSeoScenarios();
    assert.ok(list.length >= 200, `expected >=200, got ${list.length}`);
    const slugs = new Set(list.map((s) => s.slug));
    assert.equal(slugs.size, list.length);
    const titles = new Set(list.map((s) => s.title));
    assert.equal(titles.size, list.length);
  });

  it('covers >=95% of the seed keyword map', () => {
    const cov = spaceSeoCoverage();
    assert.ok(cov.ratio >= 0.95, `coverage ${cov.ratio} missing ${cov.missing.join(', ')}`);
  });

  it('engine report has metrics, CTA into workbench, no street number', () => {
    const s = listSpaceSeoScenarios().find((x) => x.cluster === 'yangzhai' && x.facing === '南');
    assert.ok(s);
    const report = buildSpaceSeoReport(s!);
    assert.ok(report.metrics.areaSqm > 0);
    assert.ok(report.sections.length >= 3);
    assert.match(report.ctaHref, /^\/tools\/fengshui-space\?/);
    assert.ok(!/\d{1,4}号/.test(report.summary));
    assert.ok(workbenchHref(s!).includes('facing='));
  });

  it('city shop report adds 选址对照 without changing layout geometry claim', () => {
    const s = listSpaceSeoScenarios().find((x) => x.cluster === 'city' && x.job === '选铺');
    assert.ok(s);
    const report = buildSpaceSeoReport(s!);
    assert.ok(report.sections.some((sec) => sec.id === 'city-site' || /选址/.test(sec.heading)));
    assert.ok(report.answerSummary.includes('不构成'));
  });

  it('scene snapshot has rooms, heat and 用神 facings for renzhai', () => {
    const s = listSpaceSeoScenarios().find((x) => x.slug === 'method-renzhai');
    assert.ok(s);
    const snap = snapshotSpaceSeoScene(s!);
    assert.ok(snap.zones.length >= 2);
    assert.equal(snap.heat.length, snap.heatW * snap.heatW);
    assert.ok(snap.enhanceFacings.length >= 1);
    assert.equal(snap.facing, '南');
  });
});
