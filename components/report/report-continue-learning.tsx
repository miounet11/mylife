'use client';

import { useMemo } from 'react';
import type { MergedAgentResults } from '@/lib/agentic-report/types';
import ContinueLearningPanelClient from '@/components/continue-learning-panel-client';
import { extractReportConclusions } from '@/lib/report-conclusions';

export default function ReportContinueLearning({
  reportId,
  source,
  merged,
}: {
  reportId: string;
  source: string;
  merged?: MergedAgentResults;
}) {
  const conclusions = useMemo(
    () => (merged ? extractReportConclusions(merged) : []),
    [merged],
  );

  return (
    <section className="fb-card p-4 md:p-5">
      <ContinueLearningPanelClient
        source={`result_report:${reportId}:${source}`}
        themes={['career', 'wealth', 'relationship', 'timing']}
        reportConclusions={conclusions}
      />
    </section>
  );
}