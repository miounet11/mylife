'use client';

export async function trackReportJourneyEvent(input: {
  reportId?: string | null;
  workflowId?: string | null;
  layerKey?: string | null;
  actionTarget?: string | null;
  category?: string | null;
  toolSlug?: string | null;
  source?: string | null;
  href?: string | null;
  meta?: Record<string, unknown>;
}) {
  if (!input.reportId || !input.workflowId || !input.actionTarget) {
    return;
  }

  try {
    await fetch('/api/report-journey/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch {
    // Journey tracking should never block navigation.
  }
}
