'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { openSiteFeedback } from '@/components/site-feedback-widget';

/**
 * Shown when report was generated under an older 用神/强弱 engine.
 * Live 喜用 may already be recomputed; full re-run syncs K-line + narrative.
 */
export default function YongShenStaleBanner({
  reportId,
  strengthDesc,
  yongShen,
  className = '',
}: {
  reportId?: string;
  strengthDesc?: string;
  yongShen?: string[];
  className?: string;
}) {
  const yongText = (yongShen || []).slice(0, 3).join('、') || '—';
  const reRunHref = reportId
    ? `/analyze?source=yongshen_stale_rerun&fromReport=${encodeURIComponent(reportId)}`
    : '/analyze?source=yongshen_stale_rerun';

  return (
    <div
      className={`rounded-[12px] border border-amber-200 bg-amber-50/90 px-3.5 py-3 ${className}`}
      role="status"
      data-yongshen-stale="1"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-amber-950">用神算法已更新</p>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-900/90">
            本报告生成时的身强弱/喜忌引擎版本较旧。页面已按
            <strong className="font-semibold">最新算法</strong>
            重算喜用
            {strengthDesc ? `（当前：${strengthDesc} · 用神 ${yongText}）` : ''}
            。完整 K 线与长文仍可能带旧版表述，建议重新生成整份报告。
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Link
              href={reRunHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-900 px-3 text-[12px] font-semibold text-white no-underline hover:opacity-95 hover:no-underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重新生成报告
            </Link>
            <button
              type="button"
              onClick={() =>
                openSiteFeedback({
                  category: 'yongshen_wrong',
                  message: `【用神算法更新后】请核对喜忌是否仍不准。\n报告ID：${reportId || '未知'}\n当前用神：${yongText}\n强弱：${strengthDesc || '—'}`,
                  reportId,
                })
              }
              className="inline-flex h-8 items-center rounded-full border border-amber-300 bg-white px-3 text-[12px] font-semibold text-amber-950"
            >
              仍不准？报错
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
