import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFortuneRhythmReport } from '@/lib/dimensions/fortune-rhythm-advisor';
import { buildCareerIndustryReport } from '@/lib/dimensions/career-industry-advisor';
import { buildInvestmentRhythmReport } from '@/lib/dimensions/investment-rhythm-advisor';
import { buildHealthReport } from '@/lib/dimensions/health-advisor';
import { buildMarriageReport } from '@/lib/dimensions/marriage-advisor';
import { buildNamingReport } from '@/lib/dimensions/naming-advisor';
import { buildStudyCareerReport } from '@/lib/dimensions/study-career-advisor';
import { buildLivingEnvironmentReport } from '@/lib/dimensions/living-environment-advisor';
import { buildPartnershipReport } from '@/lib/dimensions/partnership-advisor';
import { buildTimingSelectionReport } from '@/lib/dimensions/timing-selection-advisor';
import { scoreUpcomingDays } from '@/lib/dimensions/data/daily-fortune';
import { isDimensionRunnable } from '@/lib/dimensions/run-dimension-advisor';

const SAMPLE_BIRTH = {
  birthDate: '1990-06-15',
  birthTime: '08:30',
  birthPlace: '北京',
  birthAccuracy: 'exact' as const,
  gender: 'male' as const,
};

describe('dimension advisors', () => {
  it('fortune-rhythm returns evidence + lines + predictions', () => {
    const report = buildFortuneRhythmReport(SAMPLE_BIRTH);
    assert.equal(report.slug, 'fortune-rhythm');
    assert.ok(report.sections.length >= 6);
    assert.equal(report.predictions.length, 3);
    assert.ok(report.sections.some((item) => item.key === 'core'));
    assert.ok(report.sections.some((item) => item.key === 'lines'));
    assert.ok(report.sections.some((item) => item.key === 'evidence'));
    assert.equal(report.meta?.priority, 'p0');
    assert.ok(report.meta?.dayMaster);
    assert.ok(report.predictions.every((item) => item.evidence && item.window && item.dueDate));
  });

  it('career-industry ranks industries from yongShen with match reasons', () => {
    const report = buildCareerIndustryReport(SAMPLE_BIRTH);
    assert.equal(report.slug, 'career-industry');
    const fit = report.sections.find((item) => item.key === 'fit');
    assert.ok(fit && fit.items.length >= 1);
    assert.match(fit.items[0], /匹配/);
    assert.ok(report.sections.some((item) => item.key === 'evidence'));
    assert.equal(report.predictions.length, 3);
    assert.equal(report.meta?.priority, 'p0');
  });

  it('investment includes disclaimer, allocation skeleton, and compliance meta', () => {
    const report = buildInvestmentRhythmReport(SAMPLE_BIRTH);
    assert.ok(report.disclaimers.some((item) => item.includes('投资建议')));
    assert.ok(report.sections.some((item) => item.key === 'assets'));
    assert.ok(report.sections.some((item) => item.key === 'allocation'));
    assert.ok(report.sections.some((item) => item.key === 'trajectory'));
    assert.ok(report.sections.some((item) => item.key === 'boundary'));
    assert.equal(report.meta?.priority, 'p0');
    assert.ok(['保守', '均衡', '进取'].includes(String(report.meta?.riskProfile)));
  });

  it('p1 naming advisor handles missing name', () => {
    const report = buildNamingReport(SAMPLE_BIRTH);
    assert.equal(report.slug, 'naming');
    assert.ok(report.disclaimers.length >= 1);
  });

  it('p1 health advisor includes non-medical disclaimer', () => {
    const report = buildHealthReport(SAMPLE_BIRTH);
    assert.ok(report.disclaimers.some((item) => item.includes('医疗')));
  });

  it('p1 marriage and study-career return predictions', () => {
    const marriage = buildMarriageReport(SAMPLE_BIRTH);
    const study = buildStudyCareerReport({ ...SAMPLE_BIRTH, name: '子涵' });
    assert.equal(marriage.predictions.length, 3);
    assert.ok(study.sections.some((item) => item.key === 'subjects'));
  });

  it('p2 partnership living timing advisors work', () => {
    const partner = buildPartnershipReport(SAMPLE_BIRTH);
    const living = buildLivingEnvironmentReport(SAMPLE_BIRTH);
    const timing = buildTimingSelectionReport(SAMPLE_BIRTH);
    assert.equal(partner.slug, 'partnership');
    assert.ok(living.sections.some((item) => item.key === 'enhance'));
    assert.ok(timing.sections.some((item) => item.key === 'best'));
    assert.equal(timing.predictions.length, 3);
  });

  it('daily fortune scores 28 days', () => {
    const scored = scoreUpcomingDays(['木', '水'], ['火'], 28);
    assert.equal(scored.length, 28);
    assert.ok(scored.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date)));
  });

  it('all 10 dimensions are runnable', () => {
    assert.equal(isDimensionRunnable('fortune-rhythm'), true);
    assert.equal(isDimensionRunnable('partnership'), true);
    assert.equal(isDimensionRunnable('timing-selection'), true);
  });
});