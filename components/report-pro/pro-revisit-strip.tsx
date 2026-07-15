'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  computeRevisitState,
  markReportReviewed,
  markReportVisited,
  type RevisitUrgency,
} from '@/lib/report-revisit';
import { trackProductEvent } from '@/lib/product-analytics';

const HINT: Record<RevisitUrgency, string> = {
  due: '到期',
  soon: '即将',
  fresh: '近期',
};

/** 大众 30 天回访提醒条 — 文字条，无彩色卡片 */
export default function ProRevisitStrip({
  reportId,
  revisitHint,
}: {
  reportId: string;
  revisitHint?: string;
}) {
  const [state, setState] = useState<ReturnType<typeof computeRevisitState> | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    markReportVisited(reportId);
    setState(computeRevisitState(reportId, { revisitHint }));
  }, [reportId, revisitHint]);

  if (!state) return null;

  return (
    <section id="pro-revisit" className="scroll-mt-header border-y border-[color:var(--hairline)] py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
            30 天回访 · {HINT[state.urgency]}
          </div>
          <h2 className="mt-0.5 text-[14px] font-medium text-[color:var(--ink-1)]">{state.headline}</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{state.body}</p>
          {state.visit ? (
            <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
              本机：访问 {state.visit.visitCount} 次
              {state.daysSinceVisit != null ? ` · 距上次 ${state.daysSinceVisit} 天` : ''}
              {state.visit.lastReviewAt
                ? ` · 上次回访 ${state.visit.lastReviewAt.slice(0, 10)}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <button
            type="button"
            disabled={done}
            onClick={() => {
              markReportReviewed(reportId);
              setDone(true);
              setState(computeRevisitState(reportId, { revisitHint }));
              trackProductEvent('mass_revisit_marked', {
                reportId,
                urgency: state.urgency,
              });
            }}
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {done ? '已标记' : '标记已回访'}
          </button>
          <Link
            href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
            className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
          >
            预测回访
          </Link>
        </div>
      </div>
    </section>
  );
}
