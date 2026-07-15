import { attachDimensionSlugToPredictions, makeDimensionReportId } from '@/lib/predictions/dimension-source';
import { getDimension, MVP_DIMENSION_SLUGS } from './config';
import { buildCareerIndustryReport } from './career-industry-advisor';
import { buildFortuneRhythmReport } from './fortune-rhythm-advisor';
import { buildHealthReport } from './health-advisor';
import { buildInvestmentRhythmReport } from './investment-rhythm-advisor';
import { buildLivingEnvironmentReport } from './living-environment-advisor';
import { buildMarriageReport } from './marriage-advisor';
import { buildNamingReport } from './naming-advisor';
import { buildPartnershipReport } from './partnership-advisor';
import { buildStudyCareerReport } from './study-career-advisor';
import { buildTimingSelectionReport } from './timing-selection-advisor';
import type { DimensionAdvisorInput, DimensionReport, DimensionSlug } from './types';

const ADVISORS: Partial<Record<DimensionSlug, (input: DimensionAdvisorInput) => DimensionReport>> = {
  'fortune-rhythm': buildFortuneRhythmReport,
  'career-industry': buildCareerIndustryReport,
  investment: buildInvestmentRhythmReport,
  naming: buildNamingReport,
  health: buildHealthReport,
  'study-career': buildStudyCareerReport,
  marriage: buildMarriageReport,
  partnership: buildPartnershipReport,
  'living-environment': buildLivingEnvironmentReport,
  'timing-selection': buildTimingSelectionReport,
};

export function isDimensionRunnable(slug: string): boolean {
  return MVP_DIMENSION_SLUGS.includes(slug as DimensionSlug);
}

export function runDimensionAdvisor(slug: string, input: DimensionAdvisorInput): DimensionReport {
  const definition = getDimension(slug);
  if (!definition) {
    throw new Error('未知维度');
  }
  const runner = ADVISORS[slug as DimensionSlug];
  if (!runner) {
    throw new Error('该维度研判尚未上线，请先使用 MVP 维度或工作台完整报告');
  }

  const dimensionSlug = slug as DimensionSlug;
  const reportId = makeDimensionReportId(dimensionSlug, '', input.reportId);
  const report = runner({ ...input, reportId });

  return {
    ...report,
    slug: dimensionSlug,
    predictions: attachDimensionSlugToPredictions(report.predictions, dimensionSlug),
  };
}