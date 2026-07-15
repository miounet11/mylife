import type { TimingPoint, TimingSeverity } from '@/lib/life-timing/types';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { timingMapCopy } from '@/lib/i18n/timing-map-copy';
import { localizeUserCopy } from '@/lib/life-timing/user-copy-i18n';
import { presentReportText } from '@/lib/report-presentation';

interface Props {
  point: TimingPoint;
  locale?: SiteLocale;
}

const SEVERITY_BADGE_CLASS: Record<TimingSeverity, string> = {
  notice: 'bg-[color:var(--brand-soft-2)] text-[color:var(--ink-2)] border border-[color:var(--hairline)]',
  caution: 'bg-amber-50 text-amber-800 border border-amber-200',
  critical: 'bg-red-50 text-red-800 border border-red-200',
};

export default function TimingPointCard({ point, locale = 'zh-CN' }: Props) {
  const copy = timingMapCopy(locale);
  const user = localizeUserCopy(point, locale);
  const dateLabel = formatDateRange(point.startDate, point.endDate, copy.dateTo);
  const summary = presentReportText(user.summary, 180);
  const title = presentReportText(user.title, 48);
  const todos = (user.todoSuggestions || [])
    .map((s) => presentReportText(s, 72))
    .filter(Boolean)
    .slice(0, 4);
  const avoids = (user.avoidSuggestions || [])
    .map((s) => presentReportText(s, 72))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <article
      data-timing-point-id={point.id}
      className="rounded-[10px] border border-[color:var(--hairline)] bg-white p-3.5 shadow-sm md:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${SEVERITY_BADGE_CLASS[point.severity]}`}
        >
          {copy.severity[point.severity] || point.severity}
        </span>
        <span className="font-mono text-[12px] font-semibold text-[color:var(--ink-3)]">
          {dateLabel}
        </span>
        {title ? (
          <span className="text-[13px] font-bold text-[color:var(--ink-1)]">{title}</span>
        ) : null}
      </div>

      {summary ? (
        <p className="mt-2 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{summary}</p>
      ) : null}

      {(todos.length > 0 || avoids.length > 0) && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {todos.length > 0 ? (
            <div className="rounded-[8px] border border-emerald-100 bg-emerald-50/80 px-3 py-2">
              <div className="text-[11px] font-bold text-emerald-800">{copy.todoLabel}</div>
              <ul className="mt-1 space-y-1">
                {todos.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-1.5 text-[12px] leading-[1.55] text-emerald-950"
                  >
                    <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                    <span className="min-w-0 break-words">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {avoids.length > 0 ? (
            <div className="rounded-[8px] border border-rose-100 bg-rose-50/80 px-3 py-2">
              <div className="text-[11px] font-bold text-rose-800">{copy.avoidLabel}</div>
              <ul className="mt-1 space-y-1">
                {avoids.map((s, i) => (
                  <li key={i} className="flex gap-1.5 text-[12px] leading-[1.55] text-rose-950">
                    <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                    <span className="min-w-0 break-words">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

function formatDateRange(start: string, end: string | undefined, toWord: string): string {
  if (!end) return start;
  if (start === end) return start;
  const [sy, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');
  if (sy === ey) {
    if (sm === em) return `${sy}-${sm}-${sd} ${toWord} ${ed}`;
    return `${sy}-${sm}-${sd} ${toWord} ${em}-${ed}`;
  }
  return `${start} ${toWord} ${end}`;
}
