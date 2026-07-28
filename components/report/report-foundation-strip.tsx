'use client';

/**
 * 报告首屏 · 人生数据底座完整度条
 * Linear 浅色；引导补齐缺口，不打断阅读
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import type { LifeFoundationSnapshot } from '@/lib/life-foundation/types';
import { fetchJsonWithTimeout } from '@/lib/utils';

type Props = {
  reportId: string;
  source?: string;
  className?: string;
};

type ApiResponse = {
  success: boolean;
  foundation?: LifeFoundationSnapshot;
};

export function ReportFoundationStrip({
  reportId,
  source = 'report_foundation_strip',
  className = '',
}: Props) {
  const [foundation, setFoundation] = useState<LifeFoundationSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = reportId ? `?fortuneId=${encodeURIComponent(reportId)}` : '';
        const { response, data } = await fetchJsonWithTimeout<ApiResponse>(
          `/api/profile/foundation${q}`,
          { timeoutMs: 8_000, timeoutReason: 'report-foundation-strip' },
        );
        if (!cancelled && response.ok && data.success && data.foundation) {
          setFoundation(data.foundation);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (!foundation) return null;

  const next = foundation.nextSteps[0];
  const overall = foundation.overall;
  const solid = overall >= 65;

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 shadow-[var(--shadow-card)] ${className}`}
      aria-label="人生数据底座"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[12px] font-medium text-[color:var(--ink-5)]">数据底座</span>
            <span className="text-[14px] font-semibold tabular-nums text-[color:var(--ink-1)]">
              {overall}%
            </span>
            <span className="text-[11px] text-[color:var(--ink-5)]">{foundation.gradeLabel}</span>
          </div>
          <div className="mt-1.5 h-1 max-w-xs overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
            <div
              className="h-full rounded-full bg-[color:var(--ink-1)] transition-all"
              style={{ width: `${Math.max(4, Math.min(100, overall))}%` }}
            />
          </div>
          {next && !solid ? (
            <p className="mt-1.5 text-[12px] text-[color:var(--ink-4)]">
              建议补：{next.title}
              <span className="hidden sm:inline"> · {next.reason}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] text-[color:var(--ink-5)]">
              底座越全，对话与专项建议越贴你的现实参数
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {next && !solid ? (
            <Link
              href={next.href}
              onClick={() =>
                void trackClientEvent({
                  eventName: 'foundation_step_clicked',
                  page: typeof window !== 'undefined' ? window.location.pathname : `/result/${reportId}`,
                  meta: { source, itemId: next.itemId, reportId, overall },
                })
              }
              className="rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800"
            >
              {next.ctaLabel}
            </Link>
          ) : null}
          <Link
            href={`/profile/foundation?fortuneId=${encodeURIComponent(reportId)}&source=${encodeURIComponent(source)}`}
            onClick={() =>
              void trackClientEvent({
                eventName: 'foundation_step_clicked',
                page: typeof window !== 'undefined' ? window.location.pathname : `/result/${reportId}`,
                meta: { source, itemId: 'open_hub', reportId, overall },
              })
            }
            className="rounded-md border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            {solid ? '查看底座' : '完善底座'}
          </Link>
        </div>
      </div>

      {/* 六层迷你点 */}
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-[color:var(--hairline)] pt-2">
        {foundation.layers.map((layer) => (
          <span key={layer.id} className="inline-flex items-center gap-1 text-[10px] text-[color:var(--ink-5)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                layer.score >= 80
                  ? 'bg-[color:var(--ink-1)]'
                  : layer.score >= 40
                    ? 'bg-[color:var(--brand)]'
                    : 'bg-[color:var(--hairline-strong)]'
              }`}
            />
            {layer.title.replace(' · ', '')} {layer.score}
          </span>
        ))}
      </div>
    </section>
  );
}
