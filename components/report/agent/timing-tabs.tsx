'use client';

import { useMemo, useState } from 'react';
import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportTimingCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

type TabKey = 'career' | 'wealth' | 'relationship' | 'health';

export default function ReportTimingTabs({
  timeWindows,
  calibrated = false,
  locale: localeProp,
}: {
  timeWindows: EngineGroundTruth['timeWindows'];
  calibrated?: boolean;
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportTimingCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));
  const tabs = useMemo(
    () =>
      [
        { key: 'career' as const, label: copy.domainCareer },
        { key: 'wealth' as const, label: copy.domainWealth },
        { key: 'relationship' as const, label: copy.domainRelationship },
        { key: 'health' as const, label: copy.domainHealth },
      ] as const,
    [copy.domainCareer, copy.domainWealth, copy.domainRelationship, copy.domainHealth],
  );

  const [active, setActive] = useState<TabKey>('career');
  const windows = timeWindows[active] || [];
  if (!tabs.some((tab) => (timeWindows[tab.key] || []).length)) return null;

  return (
    <section id="timing" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader
        title={copy.agentTitle}
        description={
          calibrated ? copy.agentDescriptionCalibrated : copy.agentDescription
        }
      />
      <div className="mt-3 flex flex-wrap gap-1 border-b border-[color:var(--hairline)] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-semibold transition',
              active === tab.key
                ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {windows.length ? (
          windows.slice(0, 5).map((window) => (
            <div
              key={`${window.label}-${window.startYear}`}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2"
            >
              <div>
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">{window.label}</div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  {window.startYear}–{window.endYear}
                </div>
              </div>
              <span className="font-mono text-[13px] font-bold text-[color:var(--brand)]">{window.score}</span>
            </div>
          ))
        ) : (
          <p className="text-[12px] text-[color:var(--ink-4)]">{copy.agentEmpty}</p>
        )}
      </div>
    </section>
  );
}
