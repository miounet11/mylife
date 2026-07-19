'use client';

import type { MergedAgentResults, StructuredAgenticContext } from '@/lib/agentic-report/types';
import { StatGrid } from '@/components/layout/stat-grid';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportCockpitCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

export default function ReportCockpit({
  context,
  merged,
  locale: localeProp,
}: {
  context: StructuredAgenticContext;
  merged: MergedAgentResults;
  /** Optional UI locale; falls back to LocaleProvider / zh-CN */
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const siteLocale: SiteLocale = resolveReportChromeLocale(localeProp ?? ctxLocale);
  const copy = reportCockpitCopy(siteLocale);

  const { engine } = context;
  const constitution = merged.merged.core_constitution as {
    constitutionSummary?: string;
    actions?: string[];
  } | undefined;
  const kline = merged.merged.kline_narrative as {
    currentPhase?: string;
    peakYears?: number[];
    troughYears?: number[];
  } | undefined;

  const yearHelper = siteLocale === 'en'
    ? String(engine.derivedFacts.currentYear)
    : `${engine.derivedFacts.currentYear} ${copy.yearSuffix}`.trim();

  return (
    <section id="cockpit" className="fb-card scroll-mt-header p-5 md:p-6">
      <div className="lk-section-eyebrow">{copy.eyebrow}</div>
      <h2 className="lk-report-section-title mt-1.5">{copy.title}</h2>

      {constitution?.constitutionSummary ? (
        <p className="lk-report-prose mt-4">{constitution.constitutionSummary}</p>
      ) : (
        <p className="lk-report-prose-muted mt-4">
          {siteLocale === 'en' ? (
            <>
              {copy.dayMasterSuffix} {engine.constitution.dayMaster}
              {' · '}
              {engine.constitution.patternType}
              {' · '}
              {copy.yongShen}{' '}
              {engine.constitution.yongShen.join(', ') || copy.pending}
            </>
          ) : (
            <>
              {engine.constitution.dayMaster}
              {copy.dayMasterSuffix}
              {' · '}
              {engine.constitution.patternType}
              {' · '}
              {copy.yongShen}
              {engine.constitution.yongShen.join('、') || copy.pending}
            </>
          )}
        </p>
      )}

      <div className="mt-5">
        <StatGrid
          columns={4}
          items={[
            { label: copy.currentScore, value: engine.derivedFacts.currentScore, mono: true },
            { label: copy.peak, value: engine.derivedFacts.peakScore, mono: true },
            { label: copy.trough, value: engine.derivedFacts.troughScore, mono: true },
            {
              label: copy.currentPhase,
              value: kline?.currentPhase || '—',
              helper: yearHelper,
            },
          ]}
        />
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {[
          [copy.careerRhythm, engine.timeWindows.career[0]?.label || copy.pendingExpand],
          [
            copy.relationshipMode,
            (merged.merged.relationship_family as { relationshipFocus?: string } | undefined)
              ?.relationshipFocus || copy.pendingExpand,
          ],
          [
            copy.yearWindow,
            kline?.peakYears?.[0] ? copy.peakYear(kline.peakYears[0]) : copy.pendingExpand,
          ],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-3.5 py-3"
          >
            <div className="text-[11px] font-medium text-[color:var(--ink-4)]">{title}</div>
            <div className="mt-1 text-[13px] font-medium leading-[1.4] text-[color:var(--ink-1)]">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
