'use client';

import { ProBaziChartPanel, type ProBaziChartPanelProps } from '@/components/report/pro-bazi-chart-panel';
import { extractChartIdentityFromAnalysis } from '@/lib/calculation-identity';
import {
  proChartFromAnalysis,
  proChartFromEngine,
} from '@/lib/report/pro-chart-from-analysis';

type EngineLike = Parameters<typeof proChartFromEngine>[0];

export type ProBaziChartMountProps = {
  /** Pre-mapped panel props (wins over engine/analysis) */
  chart?: ProBaziChartPanelProps;
  /** EngineGroundTruth or similar */
  engine?: EngineLike | null;
  /** FortuneAnalysisResult or loose analysis blob */
  analysis?: unknown;
  /** Stored birth time for mismatch detection */
  storedBirthTime?: string | null;
  className?: string;
  /** UI locale for panel chrome (optional) */
  locale?: string | null;
};

/**
 * Thin wrapper: resolve engine/analysis → ProBaziChartPanel.
 * Safe for blueprint-cards / cockpit — empty state when data missing.
 */
export function ProBaziChartMount({
  chart,
  engine,
  analysis,
  storedBirthTime,
  className,
  locale,
}: ProBaziChartMountProps) {
  const fromEngine = engine ? proChartFromEngine(engine) : {};
  const fromAnalysis = analysis != null ? proChartFromAnalysis(analysis) : {};
  const identity = extractChartIdentityFromAnalysis(analysis, storedBirthTime);
  const props: ProBaziChartPanelProps = {
    ...fromAnalysis,
    ...fromEngine,
    ...chart,
    className: className || chart?.className,
    locale: locale ?? chart?.locale,
    lockedClockTime: chart?.lockedClockTime ?? identity?.clockBirthTime,
    lateZiNextDay: chart?.lateZiNextDay ?? identity?.useSeparateZiHour,
    trueSolarApplied: chart?.trueSolarApplied ?? identity?.useSolarTime,
  };

  return <ProBaziChartPanel {...props} />;
}

export default ProBaziChartMount;
