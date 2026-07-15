import type { TimingPoint, TimingSeverity } from '@/lib/life-timing/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import { localizeUserCopy } from '@/lib/life-timing/user-copy-i18n';
import { presentReportText } from '@/lib/report-presentation';

interface Props {
  points: TimingPoint[];
  locale?: SiteLocale;
}

const SEVERITY_DOT: Record<TimingSeverity, string> = {
  notice: 'bg-[color:var(--brand-soft-2)]',
  caution: 'bg-amber-400',
  critical: 'bg-red-500',
};

export default function Next12MonthsBlock({ points, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const list = Array.isArray(points) ? points : [];
  const byMonth = new Map<string, TimingPoint[]>();
  for (const p of list) {
    const ym = p.startDate.slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym)!.push(p);
  }
  const months = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3.5 shadow-sm md:p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
        {copy.next12Eyebrow}
      </div>
      <h3 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
        {copy.next12Title(months.length, list.length)}
      </h3>
      {months.length === 0 ? (
        <p className="mt-3 rounded-[8px] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3 text-[13px] text-[color:var(--ink-4)]">
          {copy.next12Empty}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {months.map(([ym, monthPoints]) => (
            <div
              key={ym}
              className="rounded-[8px] border border-[color:var(--hairline)] border-l-[3px] border-l-[#3b5998]/50 bg-white px-3 py-2.5"
            >
              <div className="text-[13px] font-bold text-[color:var(--ink-1)]">
                {copy.formatMonth(ym)}
                <span className="ml-2 text-[11px] font-semibold text-[color:var(--ink-4)]">
                  {monthPoints.length}
                  {locale === 'en' ? ' points' : ' 点'}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {monthPoints.map((p) => {
                  const user = localizeUserCopy(p, locale);
                  const summary = presentReportText(user.summary, 120);
                  return (
                    <li
                      key={p.id}
                      data-timing-point-id={p.id}
                      className="flex items-start gap-2 text-[12px] leading-[1.55] text-[color:var(--ink-2)]"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[p.severity]}`}
                      />
                      <span className="min-w-0 break-words">
                        <span className="font-mono font-semibold text-[color:var(--ink-4)]">
                          {p.startDate.slice(5)}
                        </span>
                        <span className="mx-1 text-[color:var(--ink-5)]">—</span>
                        {summary}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
