'use client';

/**
 * Backward-compatible sticky email capture on report surfaces.
 * Implementation moved to ReportEmailCapture (save-first framing).
 */

import ReportEmailCapture from '@/components/report/report-email-capture';

interface Props {
  surfaceKey: string;
  reportId: string;
  /** Optional UI locale for chrome strings */
  locale?: 'zh-CN' | 'zh-Hant' | 'en';
}

export default function TimingSubscribeBar({ surfaceKey, reportId, locale = 'zh-CN' }: Props) {
  return (
    <ReportEmailCapture
      reportId={reportId}
      surfaceKey={surfaceKey}
      locale={locale}
      variant="sticky"
      scrollRevealPx={160}
      visitThreshold={1}
    />
  );
}
