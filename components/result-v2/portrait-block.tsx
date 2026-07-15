import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import { presentReportText } from '@/lib/report-presentation';

interface Props {
  baziPillars: string;
  pattern?: string;
  locale?: SiteLocale;
}

export default function PortraitBlock({ baziPillars, pattern, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const summary = presentReportText(
    pattern ? copy.portraitWithPattern(pattern) : copy.portraitFallback,
    120,
  );
  const pillars = `${baziPillars || ''}`.trim();

  return (
    <section className="h-full rounded-[10px] border border-[color:var(--hairline)] bg-gradient-to-br from-white to-[#f7f9fc] p-4 shadow-sm md:p-5">
      <div className="inline-flex rounded-full border border-[#3b5998]/20 bg-[#3b5998]/08 px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-[#3b5998]">
        {copy.portraitEyebrow}
      </div>
      <h2 className="mt-3 text-[18px] font-bold leading-snug tracking-tight text-[color:var(--ink-1)] md:text-[20px]">
        {summary}
      </h2>
      {pillars ? (
        <div className="mt-3 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-[8px] border border-[color:var(--hairline)] bg-white px-2.5 py-1.5 font-mono text-[12px] font-semibold text-[color:var(--ink-2)]">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-4)]">
            {copy.baziLabel}
          </span>
          <span className="break-all">{pillars}</span>
        </div>
      ) : null}
      {pattern ? (
        <div className="mt-2 text-[12px] text-[color:var(--ink-4)]">
          {locale === 'en' ? 'Pattern' : '格局'}：
          <span className="font-semibold text-[color:var(--ink-2)]">{pattern}</span>
        </div>
      ) : null}
    </section>
  );
}
