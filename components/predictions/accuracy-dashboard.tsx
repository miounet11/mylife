'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { Prediction, PredictionAccuracyStats } from '@/lib/predictions/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import {
  accuracyDashboardCopy,
  predictionCategoryLabels,
} from '@/lib/i18n/predictions-copy';

const CATEGORY_ORDER: Prediction['category'][] = ['career', 'wealth', 'marriage', 'health', 'timing'];

export default function AccuracyDashboard({
  stats,
  isMember = false,
  className = '',
  locale = 'zh-CN',
}: {
  stats: PredictionAccuracyStats;
  isMember?: boolean;
  className?: string;
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => accuracyDashboardCopy(locale), [locale]);
  const categoryLabels = useMemo(() => predictionCategoryLabels(locale), [locale]);

  const visibleCategories = isMember
    ? CATEGORY_ORDER
    : CATEGORY_ORDER.slice(0, 3);

  const rows = visibleCategories.map((category) => ({
    category,
    label: categoryLabels[category],
    rate: stats.byCategory[category] ?? 0,
    hasData: category in stats.byCategory,
  }));

  const hasAnyFeedback = stats.total > 0;

  return (
    <section className={`fb-card space-y-4 p-4 md:p-5 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="lk-section-eyebrow">{copy.eyebrow}</div>
          <div className="mt-1 text-[26px] font-bold text-[color:var(--ink-1)]">
            {hasAnyFeedback ? `${Math.round(stats.hitRate * 100)}%` : '—'}
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
            {hasAnyFeedback
              ? copy.withFeedback(stats.total)
              : copy.withoutFeedback}
          </p>
        </div>
        {!isMember ? (
          <Link
            href="/membership?source=accuracy_dashboard&intent=accuracy_dashboard"
            className="rounded-full border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-strong)] hover:no-underline"
          >
            {copy.freeUnlock}
          </Link>
        ) : (
          <span className="rounded-full border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-strong)]">
            {copy.memberFullView}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.category}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[color:var(--ink-2)]">{row.label}</span>
              <span className="text-[color:var(--ink-3)]">
                {row.hasData ? `${Math.round(row.rate * 100)}%` : copy.pendingFeedback}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
              <div
                className="h-full rounded-full bg-[color:var(--brand)] transition-all"
                style={{ width: `${Math.round((row.hasData ? row.rate : 0) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {isMember && hasAnyFeedback ? (
        <p className="text-[12px] text-[color:var(--ink-4)]">{copy.memberTrendNote}</p>
      ) : null}

      {!hasAnyFeedback ? (
        <Link href="/predictions" className="fb-btn h-9 px-4 text-[13px] hover:no-underline">
          {copy.goCheckIn}
        </Link>
      ) : null}
    </section>
  );
}
