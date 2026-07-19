'use client';

import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportRhythmCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

export default function ReportRhythmTimeline({
  kline,
  locale: localeProp,
}: {
  kline: EngineGroundTruth['kline'];
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportRhythmCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));

  const trendLabel: Record<string, string> = {
    up: copy.trendUp,
    down: copy.trendDown,
    flat: copy.trendFlat,
  };
  const windowType: Record<string, string> = {
    peak: copy.windowPeak,
    trough: copy.windowTrough,
    turning: copy.windowTurning,
    stable: copy.windowStable,
  };

  const phases = kline.phases || [];
  const windows = kline.windows || [];
  if (!phases.length && !windows.length) return null;

  return (
    <section id="rhythm" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader
        eyebrow={copy.agentEyebrow}
        title={copy.agentTitle}
        description={copy.agentDescription}
      />
      {phases.length ? (
        <div className="mt-4 space-y-2">
          {phases.map((phase) => (
            <div
              key={`${phase.label}-${phase.startYear}`}
              className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">{phase.label}</div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  {phase.startYear}–{phase.endYear} · {copy.avgScore} {phase.avgScore}
                </div>
              </div>
              <span className="text-[11px] font-bold text-[color:var(--brand)]">
                {trendLabel[phase.trend] || phase.trend}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {windows.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {windows.slice(0, 6).map((window) => (
            <div
              key={`${window.label}-${window.startYear}`}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5"
            >
              <div className="text-[11px] font-bold text-[color:var(--ink-4)]">
                {windowType[window.type] || window.type}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-[color:var(--ink-2)]">{window.label}</div>
              <div className="text-[11px] text-[color:var(--ink-4)]">
                {window.startYear}–{window.endYear} · {copy.score} {window.score}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
