'use client';

import { SectionHeader } from '@/components/layout/section-header';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportReadingPathCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

export default function ReportReadingPath({
  locale: localeProp,
}: {
  locale?: string | null;
} = {}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportReadingPathCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));

  return (
    <section className="fb-card p-5 md:p-6">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <ol className="mt-4 space-y-2">
        {copy.steps.map((step, index) => (
          <li key={step.anchor}>
            <a
              href={step.anchor}
              className="flex gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3.5 py-3 transition hover:border-[color:var(--hairline-strong)] hover:bg-[color:var(--bg-sunken)]/50 hover:no-underline"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[12px] font-semibold text-[color:var(--brand-strong)]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                  {step.label}
                </div>
                <div className="mt-0.5 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">{step.detail}</div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
