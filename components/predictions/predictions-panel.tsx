'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Prediction, PredictionOutcome } from '@/lib/predictions/types';
import { updatePredictionOutcome } from '@/lib/predictions/store';
import {
  dimensionLabel,
  resolvePredictionDimensionSlug,
} from '@/lib/predictions/dimension-source';
import { buildEventFromPrediction, eventsHrefForReport } from '@/lib/prediction-to-event';
import { trackProductEvent } from '@/lib/product-analytics';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import type { DimensionSlug } from '@/lib/dimensions/types';
import {
  predictionCategoryLabels,
  predictionOutcomeLabels,
  predictionsPanelCopy,
} from '@/lib/i18n/predictions-copy';
import { dimensionUiCopy } from '@/lib/i18n/dimensions-copy';

const LOCAL_EVENTS_KEY = 'lk_events_cache_v1';

async function persistEventFromPrediction(
  prediction: Prediction,
  outcome: Exclude<PredictionOutcome, 'pending'>,
  feedback?: string
) {
  const payload = buildEventFromPrediction(prediction, outcome, feedback);
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true as const, local: false };
  } catch {
    // fall through
  }
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const list = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    const localItem = {
      id: `local_pred_${prediction.id}_${Date.now()}`,
      ...payload,
    };
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify([localItem, ...(Array.isArray(list) ? list : [])]));
    return { ok: true as const, local: true };
  } catch {
    return { ok: false as const, local: true };
  }
}

function daysUntil(dueDate: string): number {
  const due = new Date(`${dueDate}T23:59:59`).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function progressPercent(dueDate: string): number {
  const days = daysUntil(dueDate);
  if (days <= 0) return 100;
  if (days >= 30) return 8;
  return Math.max(8, Math.min(96, Math.round(((30 - days) / 30) * 100)));
}

function localizeDimLabel(slug: string | null, locale: SiteLocale): string {
  if (!slug) return dimensionLabel(slug);
  try {
    return dimensionUiCopy(locale, slug as DimensionSlug).title;
  } catch {
    return dimensionLabel(slug);
  }
}

export function PredictionsPanel({
  predictions,
  showProgress = false,
  compact = false,
  onUpdated,
  locale = 'zh-CN',
}: {
  predictions: Prediction[];
  showProgress?: boolean;
  compact?: boolean;
  onUpdated?: () => void;
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => predictionsPanelCopy(locale), [locale]);
  const categoryLabels = useMemo(() => predictionCategoryLabels(locale), [locale]);
  const outcomeLabels = useMemo(() => predictionOutcomeLabels(locale), [locale]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loggedMap, setLoggedMap] = useState<Record<string, 'server' | 'local' | 'fail'>>({});

  if (!predictions.length) {
    return (
      <p className="text-[13px] text-[color:var(--ink-3)]">{copy.empty}</p>
    );
  }

  const handleOutcome = async (id: string, outcome: Exclude<PredictionOutcome, 'pending'>) => {
    setSavingId(id);
    const prediction = predictions.find((p) => p.id === id);
    await updatePredictionOutcome(id, outcome, feedbackMap[id]);
    trackProductEvent('mass_prediction_outcome', {
      predictionId: id,
      outcome,
      reportId: prediction?.reportId || '',
      category: prediction?.category || '',
    });
    if (prediction) {
      const result = await persistEventFromPrediction(prediction, outcome, feedbackMap[id]);
      setLoggedMap((prev) => ({
        ...prev,
        [id]: result.ok ? (result.local ? 'local' : 'server') : 'fail',
      }));
      if (result.ok) {
        trackProductEvent('mass_prediction_to_event', {
          predictionId: id,
          reportId: prediction.reportId,
          transport: result.local ? 'local' : 'server',
        });
      }
    }
    setSavingId(null);
    onUpdated?.();
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {predictions.map((prediction) => {
        const pending = !prediction.outcome || prediction.outcome === 'pending';
        const days = daysUntil(prediction.dueDate);
        const dimensionSlug = resolvePredictionDimensionSlug(prediction);

        return (
          <article
            key={prediction.id}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--brand)]">
                {categoryLabels[prediction.category]}
              </span>
              {dimensionSlug ? (
                <Link
                  href={`/dimensions/${dimensionSlug}`}
                  className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)] hover:text-[color:var(--brand)] hover:no-underline"
                >
                  {localizeDimLabel(dimensionSlug, locale)}
                </Link>
              ) : null}
              {prediction.window ? (
                <span className="text-[11px] text-[color:var(--ink-4)]">{prediction.window}</span>
              ) : null}
              <span className="text-[11px] text-[color:var(--ink-4)]">
                {copy.duePrefix} {prediction.dueDate}
                {pending && days >= 0 ? ` · ${copy.daysLeft(days)}` : null}
              </span>
            </div>

            <p className="mt-2 text-[13px] font-semibold leading-[1.5] text-[color:var(--ink-1)]">
              {prediction.statement}
            </p>

            {!compact ? (
              <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                {copy.evidencePrefix}
                {prediction.evidence}
              </p>
            ) : null}

            {showProgress && pending ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--hairline)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--brand)] transition-all"
                    style={{ width: `${progressPercent(prediction.dueDate)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {!compact && prediction.verifyChecklist.length ? (
              <ul className="mt-2 space-y-1 text-[11px] text-[color:var(--ink-3)]">
                {prediction.verifyChecklist.slice(0, 2).map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            ) : null}

            {pending ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(['fulfilled', 'partial', 'missed'] as const).map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      disabled={savingId === prediction.id}
                      onClick={() => handleOutcome(prediction.id, outcome)}
                      className={
                        outcome === 'fulfilled'
                          ? 'fb-btn fb-btn-primary h-8 px-3 text-[12px]'
                          : 'fb-btn h-8 px-3 text-[12px]'
                      }
                    >
                      {outcomeLabels[outcome]}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={feedbackMap[prediction.id] || ''}
                  onChange={(event) =>
                    setFeedbackMap((prev) => ({ ...prev, [prediction.id]: event.target.value }))
                  }
                  placeholder={copy.feedbackPlaceholder}
                  className="h-8 w-full rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 text-[12px] text-[color:var(--ink-2)]"
                />
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">
                  {copy.feedbackDone}
                  {outcomeLabels[prediction.outcome as Exclude<PredictionOutcome, 'pending'>]}
                  {prediction.userFeedback ? ` · ${prediction.userFeedback}` : ''}
                </div>
                {loggedMap[prediction.id] === 'server' || loggedMap[prediction.id] === 'local' ? (
                  <p className="text-[11px] text-[color:var(--ink-4)]">
                    {copy.loggedToEvents}
                    {loggedMap[prediction.id] === 'local' ? copy.localSuffix : ''}
                    {' · '}
                    <Link
                      href={eventsHrefForReport(prediction.reportId)}
                      className="font-semibold text-[color:var(--brand)] hover:underline"
                    >
                      {copy.viewEvents}
                    </Link>
                  </p>
                ) : null}
                {!loggedMap[prediction.id] && prediction.outcome && prediction.outcome !== 'pending' ? (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[color:var(--brand)] hover:underline"
                    onClick={async () => {
                      const result = await persistEventFromPrediction(
                        prediction,
                        prediction.outcome as Exclude<PredictionOutcome, 'pending'>,
                        prediction.userFeedback
                      );
                      setLoggedMap((prev) => ({
                        ...prev,
                        [prediction.id]: result.ok ? (result.local ? 'local' : 'server') : 'fail',
                      }));
                    }}
                  >
                    {copy.logToEvents}
                  </button>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
