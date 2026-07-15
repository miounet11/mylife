import type { MajorTransition } from '@/lib/life-timing/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import { localizeRawReason } from '@/lib/life-timing/user-copy-i18n';
import { presentReportText } from '@/lib/report-presentation';

interface Props {
  transitions: MajorTransition[];
  baziPillars: string;
  locale?: SiteLocale;
}

export default function Next5YearsBlock({
  transitions,
  baziPillars,
  locale = 'zh-CN',
}: Props) {
  const copy = timingMapCopy(locale);
  const list = Array.isArray(transitions) ? transitions : [];

  return (
    <section className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3.5 shadow-sm md:p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-3)]">
        {copy.next5Eyebrow}
      </div>
      <h3 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
        {list.length === 0 ? copy.next5Empty : copy.next5Title(list.length)}
      </h3>

      {list.length > 0 ? (
        <div className="mt-3 space-y-2">
          {list.map((item, i) => {
            const reason = presentReportText(localizeRawReason(item.rawReason, locale), 140);
            return (
              <div
                key={`${item.type}_${item.year}_${i}`}
                className="flex flex-col gap-1.5 rounded-[8px] border border-[color:var(--hairline)] bg-white px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3"
              >
                <div className="flex shrink-0 items-center gap-2 sm:w-[140px] sm:flex-col sm:items-start sm:gap-1">
                  <span className="font-mono text-[15px] font-bold text-[color:var(--ink-1)]">
                    {item.year}
                  </span>
                  <span className="text-[11px] text-[color:var(--ink-4)]">
                    {copy.ageLabel(item.ageAtYear)}
                  </span>
                  <span className="inline-flex rounded-full bg-[color:var(--brand-soft-2)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
                    {copy.transitionType[item.type] || item.type}
                  </span>
                </div>
                <p className="min-w-0 flex-1 text-[13px] leading-[1.6] text-[color:var(--ink-2)] break-words">
                  {reason}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {baziPillars ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-2.5 font-mono text-[11px] text-[color:var(--ink-4)]">
          {copy.chartLabel}：{baziPillars}
        </div>
      ) : null}
    </section>
  );
}
