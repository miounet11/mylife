'use client';

import { ProBaziChartPanel, type ProBaziChartPanelProps } from '@/components/report/pro-bazi-chart-panel';
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
  className,
  locale,
}: ProBaziChartMountProps) {
  const fromEngine = engine ? proChartFromEngine(engine) : {};
  const fromAnalysis = analysis != null ? proChartFromAnalysis(analysis) : {};
  const props: ProBaziChartPanelProps = {
    ...fromAnalysis,
    ...fromEngine,
    ...chart,
    className: className || chart?.className,
    locale: locale ?? chart?.locale,
  };

  return <ProBaziChartPanel {...props} />;
}

export default ProBaziChartMount;
