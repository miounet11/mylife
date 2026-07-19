import type { DimensionReport } from '@/lib/dimensions/types';
import Link from 'next/link';
import TimingWindowPanel from '@/components/timing/timing-window-panel';
import { dimensionReportShellCopy } from '@/lib/i18n/dimensions-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

const TONE_CLASS: Record<string, string> = {
  default: 'border-[color:var(--fb-border)]',
  positive: 'border-emerald-200 bg-emerald-50/40',
  warning: 'border-amber-200 bg-amber-50/40',
  muted: 'border-slate-200 bg-slate-50/50',
};

export default function DimensionReportShell({
  report,
  onSyncPredictions,
  syncing,
  syncStatus = 'idle',
  locale = 'zh-CN',
}: {
  report: DimensionReport;
  onSyncPredictions?: () => void;
  syncing?: boolean;
  syncStatus?: 'idle' | 'synced' | 'error';
  locale?: SiteLocale;
}) {
  const copy = dimensionReportShellCopy(locale);
  const narrativeSummary = report.meta?.narrativeSummary;
  const llmEnhanced = report.meta?.llmEnhanced === 1 || report.meta?.llmEnhanced === '1';

  const syncLabel = syncing
    ? copy.syncing
    : syncStatus === 'synced'
      ? copy.syncedRetry
      : syncStatus === 'error'
        ? copy.syncFailedRetry
        : copy.syncToPredictions;

  const yongShen = asStringArray(report.meta?.yongShen);
  const xiShen = asStringArray(report.meta?.xiShen);
  const jiShen = asStringArray(report.meta?.jiShen);
  const showTiming90 = report.slug === 'timing-selection';

  return (
    <div className="space-y-4">
      {showTiming90 ? (
        <TimingWindowPanel yongShen={yongShen} xiShen={xiShen} jiShen={jiShen} />
      ) : null}

      {llmEnhanced || narrativeSummary ? (
        <div className="flex flex-wrap items-center gap-2">
          {llmEnhanced ? (
            <span className="inline-flex items-center rounded-full border border-[color:var(--brand)]/25 bg-[color:var(--brand)]/5 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--brand)]">
              {copy.aiPolished}
            </span>
          ) : null}
          {narrativeSummary ? (
            <p className="text-[13px] leading-[1.5] text-[color:var(--ink-2)]">{narrativeSummary}</p>
          ) : null}
        </div>
      ) : null}

      {report.sections.map((block) => (
        <section
          key={block.key}
          className={`fb-card border p-4 md:p-5 ${TONE_CLASS[block.tone || 'default']}`}
        >
          <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">{block.title}</h3>
          <ul className="mt-3 space-y-2">
            {block.items.map((item) => (
              <li key={item} className="text-[13px] leading-[1.6] text-[color:var(--ink-2)]">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {report.predictions.length > 0 ? (
        <section className="fb-card border border-[color:var(--brand)]/20 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">
                {copy.verifiablePredictions(report.predictions.length)}
              </h3>
              {syncStatus === 'synced' ? (
                <p className="mt-0.5 text-[11px] text-emerald-700">{copy.autoSynced}</p>
              ) : null}
              {syncStatus === 'error' ? (
                <p className="mt-0.5 text-[11px] text-amber-700">{copy.autoSyncFailed}</p>
              ) : null}
            </div>
            {onSyncPredictions ? (
              <button
                type="button"
                onClick={onSyncPredictions}
                disabled={syncing}
                className="fb-btn fb-btn-primary h-8 px-3 text-[12px]"
              >
                {syncLabel}
              </button>
            ) : null}
          </div>
          <ul className="mt-3 space-y-3">
            {report.predictions.map((item) => (
              <li key={item.id} className="rounded-[var(--radius)] border border-[color:var(--fb-border)] bg-white p-3">
                <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">{item.statement}</p>
                <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
                  {copy.verifyBy} {item.dueDate}
                  {item.window ? ` · ${item.window}` : ''}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/predictions" className="mt-3 inline-block text-[12px] font-bold text-[color:var(--brand)] hover:underline">
            {copy.goToPredictions}
          </Link>
        </section>
      ) : null}

      {report.disclaimers.length > 0 ? (
        <p className="text-[12px] leading-[1.5] text-[color:var(--ink-3)]">
          {report.disclaimers.join(' ')}
        </p>
      ) : null}
    </div>
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}
