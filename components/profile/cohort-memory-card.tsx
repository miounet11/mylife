'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJsonWithTimeout } from '@/lib/utils';
import { summarizeCalibration, type CohortCalibrationState } from '@/lib/cohort-lenses';

type Response = {
  success?: boolean;
  calibration?: CohortCalibrationState | null;
  summary?: string;
};

export default function CohortMemoryCard({
  reportId,
}: {
  reportId?: string | null;
}) {
  const [summary, setSummary] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    void (async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<Response>(
          `/api/cohort-calibration?reportId=${encodeURIComponent(reportId)}`,
          { timeoutMs: 8000, timeoutReason: 'cohort-memory-card' },
        );
        if (cancelled || !response.ok || !data.success) return;
        const calibration = data.calibration || null;
        setCount(calibration?.judgments.length || 0);
        setSummary(data.summary || summarizeCalibration(calibration));
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (!reportId || !summary) return null;

  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">世代校准</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            已核对 {count} 条，下次报告和问顾问会按这些个人事实改口径
          </p>
        </div>
        <Link
          href={`/result/${encodeURIComponent(reportId)}#pro-cohort`}
          className="text-[12px] font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          继续核对
        </Link>
      </div>
      <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">{summary}</p>
    </section>
  );
}
