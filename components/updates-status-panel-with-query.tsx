'use client';

import { useSearchParams } from 'next/navigation';
import UpdatesStatusPanel, { type UpdatesStatusSummary } from '@/components/updates-status-panel';

export default function UpdatesStatusPanelWithQuery({
  title,
  description,
  compact = false,
  initialSummary,
  initialAuthenticated,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
  initialSummary?: UpdatesStatusSummary;
  initialAuthenticated?: boolean;
}) {
  const searchParams = useSearchParams();
  const reportId = searchParams?.get('reportId') || '';

  return (
    <UpdatesStatusPanel
      reportId={reportId}
      title={title}
      description={description}
      compact={compact}
      initialSummary={initialSummary}
      initialAuthenticated={initialAuthenticated}
    />
  );
}
