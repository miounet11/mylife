'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Prediction } from '@/lib/predictions/types';
import {
  getAccuracyStats,
  getAllPredictions,
  getDuePredictions,
  getUpcomingPredictions,
  hydratePredictionsFromServer,
} from '@/lib/predictions/store';
import {
  dimensionLabel,
  filterPredictionsByDimension,
  groupPredictionStatsByDimension,
  resolvePredictionDimensionSlug,
} from '@/lib/predictions/dimension-source';
import { PredictionsPanel } from '@/components/predictions/predictions-panel';
import RelatedDimensionsPanel from '@/components/dimensions/related-dimensions-panel';
import { listDimensionsSorted } from '@/lib/dimensions/config';
import type { DimensionSlug } from '@/lib/dimensions/types';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import { buildTeacherChatHref } from '@/lib/teachers';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import {
  predictionCategoryLabels,
  predictionsListCopy,
} from '@/lib/i18n/predictions-copy';
import { dimensionUiCopy } from '@/lib/i18n/dimensions-copy';

/** Prefer query reportId; else most frequent report among local predictions. */
function resolveContextReportId(
  queryReportId: string | null,
  predictions: Prediction[],
): string | null {
  const fromQuery = `${queryReportId || ''}`.trim();
  if (fromQuery) return fromQuery;
  const counts = new Map<string, number>();
  for (const item of predictions) {
    const id = `${item.reportId || ''}`.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

function localizeDimensionTitle(slug: string, locale: SiteLocale, fallback: string): string {
  try {
    return dimensionUiCopy(locale, slug as DimensionSlug).title;
  } catch {
    return fallback;
  }
}

export default function PredictionsListPage({
  locale = 'zh-CN',
}: {
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => predictionsListCopy(locale), [locale]);
  const categoryLabels = useMemo(() => predictionCategoryLabels(locale), [locale]);
  const searchParams = useSearchParams();
  const dimensionFromQuery = searchParams.get('dimension') || 'all';
  const reportIdFromQuery = searchParams.get('reportId');
  const [loading, setLoading] = useState(true);
  const [dimensionFilter, setDimensionFilter] = useState(dimensionFromQuery);
  const [upcoming, setUpcoming] = useState<Prediction[]>([]);
  const [due, setDue] = useState<Prediction[]>([]);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [all, setAll] = useState<Prediction[]>([]);
  const [stats, setStats] = useState({ total: 0, hitRate: 0, byCategory: {} as Record<string, number> });
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setDimensionFilter(dimensionFromQuery);
  }, [dimensionFromQuery]);

  const refresh = useCallback(() => {
    const nextAll = getAllPredictions();
    setAll(nextAll);
    setUpcoming(filterPredictionsByDimension(getUpcomingPredictions(7), dimensionFilter));
    setDue(filterPredictionsByDimension(getDuePredictions(), dimensionFilter));
    setHistory(
      filterPredictionsByDimension(
        nextAll
          .filter((item) => item.outcome && item.outcome !== 'pending')
          .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
        dimensionFilter,
      ),
    );
    setStats(getAccuracyStats());
  }, [dimensionFilter]);

  useEffect(() => {
    const load = async () => {
      await hydratePredictionsFromServer();
      refresh();
      setLoading(false);
    };
    void load();
  }, [refresh]);

  const dimensionStats = useMemo(() => groupPredictionStatsByDimension(all), [all]);
  const dimensionOptions = useMemo(() => {
    const fromData = dimensionStats
      .filter((item) => item.slug !== 'report')
      .map((item) => ({
        slug: item.slug,
        title: localizeDimensionTitle(item.slug, locale, item.title),
        total: item.total,
      }));
    if (fromData.length) return fromData;
    return listDimensionsSorted()
      .filter((item) => item.priority === 'p0')
      .map((item) => ({
        slug: item.slug,
        title: localizeDimensionTitle(item.slug, locale, item.title),
        total: 0,
      }));
  }, [dimensionStats, locale]);

  const contextReportId = useMemo(
    () => resolveContextReportId(reportIdFromQuery, all),
    [reportIdFromQuery, all],
  );

  /** Opening chat: with report → continue; without → teachers gallery / opening chat. */
  const continueChatHref = useMemo(() => {
    if (contextReportId) {
      return buildReportContinueChatHref({
        reportId: contextReportId,
        teacher: 'overview',
        source: 'predictions_revisit_opening',
      });
    }
    return buildTeacherChatHref({
      teacherId: 'practice',
      source: 'predictions_hub_consultant',
    });
  }, [contextReportId]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  const hasAny = upcoming.length + due.length + history.length > 0 || all.length > 0;
  const filterLabel =
    dimensionFilter === 'all'
      ? copy.allSources
      : dimensionFilter === 'report'
        ? copy.fullReport
        : localizeDimensionTitle(dimensionFilter, locale, dimensionLabel(dimensionFilter));

  return (
    <div className="space-y-4">
      {/* Linear-clean：带报告回聊 / 顾问开场 */}
      <section className="border-y border-[color:var(--hairline)] py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{copy.consultantEyebrow}</div>
            <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
              {copy.consultantTitle}
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              {contextReportId ? copy.consultantDescWithReport : copy.consultantDescWithoutReport}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <Link
              href={continueChatHref}
              className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {contextReportId ? copy.continueChat : copy.askConsultant}
            </Link>
            {!contextReportId ? (
              <Link
                href="/teachers"
                className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
              >
                {copy.allTeachers}
              </Link>
            ) : (
              <Link
                href={buildTeacherChatHref({
                  teacherId: 'practice',
                  reportId: contextReportId,
                  source: 'predictions_hub_consultant',
                })}
                className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
              >
                {copy.practiceTeacher}
              </Link>
            )}
          </div>
        </div>
      </section>

      {stats.total > 0 || all.length > 0 ? (
        <section className="fb-card p-4 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="lk-section-eyebrow">{copy.hitRateEyebrow}</div>
              <div className="mt-1 text-[22px] font-bold text-[color:var(--ink-1)]">
                {Math.round(stats.hitRate * 100)}%
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
                {copy.feedbackSummary(stats.total, filterLabel)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, rate]) => (
                <span
                  key={category}
                  className="rounded-full border border-[color:var(--hairline)] px-2 py-1 text-[11px] text-[color:var(--ink-3)]"
                >
                  {categoryLabels[category as Prediction['category']] || category}{' '}
                  {Math.round(rate * 100)}%
                </span>
              ))}
            </div>
          </div>

          {dimensionStats.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {dimensionStats.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setDimensionFilter(item.slug)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    dimensionFilter === item.slug
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                      : 'border-[color:var(--hairline)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]'
                  }`}
                >
                  {item.slug === 'report'
                    ? copy.fullReport
                    : localizeDimensionTitle(item.slug, locale, item.title)}{' '}
                  {item.total}
                  {item.hitRate > 0 ? ` · ${Math.round(item.hitRate * 100)}%` : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDimensionFilter('all')}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  dimensionFilter === 'all'
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                    : 'border-[color:var(--hairline)] text-[color:var(--ink-3)]'
                }`}
              >
                {copy.allFilter}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="fb-card p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-[color:var(--ink-3)]">{copy.filterByDimension}</span>
          <select
            value={dimensionFilter}
            onChange={(event) => setDimensionFilter(event.target.value)}
            className="h-8 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-white px-2 text-[12px]"
          >
            <option value="all">{copy.allSources}</option>
            <option value="report">{copy.fullReport}</option>
            {dimensionOptions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
                {item.total ? ` (${item.total})` : ''}
              </option>
            ))}
          </select>
          <Link href="/dimensions" className="text-[12px] font-bold text-[color:var(--brand)] hover:underline">
            {copy.generateMorePredictions}
          </Link>
        </div>
      </section>

      {!hasAny ? (
        <section className="fb-card p-4 md:p-6">
          <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{copy.emptyBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dimensions" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              {copy.ctaDimensions}
            </Link>
            <Link href="/analyze" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              {copy.ctaFullReport}
            </Link>
          </div>
        </section>
      ) : upcoming.length + due.length + history.length === 0 ? (
        <section className="fb-card p-4">
          <p className="text-[13px] text-[color:var(--ink-3)]">
            {copy.emptyFilterPrefix(filterLabel)}
            <button
              type="button"
              className="ml-1 font-semibold text-[color:var(--brand)]"
              onClick={() => setDimensionFilter('all')}
            >
              {copy.viewAll}
            </button>
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="fb-card p-4 md:p-5">
            <div className="lk-section-eyebrow">{copy.upcomingEyebrow}</div>
            <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{copy.upcomingTitle}</h2>
            <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">{copy.upcomingDesc}</p>
            <div className="mt-4">
              <PredictionsPanel predictions={upcoming} showProgress onUpdated={refresh} locale={locale} />
            </div>
          </section>

          <section className="fb-card border-t-2 border-[color:var(--brand)] p-4 md:p-5">
            <div className="lk-section-eyebrow">{copy.dueEyebrow}</div>
            <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{copy.dueTitle}</h2>
            <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">{copy.dueDesc}</p>
            <div className="mt-4">
              <PredictionsPanel predictions={due} onUpdated={refresh} locale={locale} />
            </div>
          </section>

          <section className="fb-card p-4 md:p-5">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <div className="lk-section-eyebrow">{copy.historyEyebrow}</div>
                <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
                  {copy.historyCount(history.length)}
                </h2>
              </div>
              <span className="text-[12px] text-[color:var(--ink-4)]">
                {historyOpen ? copy.collapse : copy.expand}
              </span>
            </button>

            {historyOpen ? (
              <div className="mt-4 opacity-80">
                <PredictionsPanel predictions={history} compact onUpdated={refresh} locale={locale} />
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">{copy.historyCollapsedHint}</p>
            )}
          </section>
        </div>
      )}

      <RelatedDimensionsPanel
        title={copy.relatedTitle}
        description={copy.relatedDesc}
        limit={3}
        compact
      />
    </div>
  );
}

// re-export helper usage for tests / tooling
export { resolvePredictionDimensionSlug };
