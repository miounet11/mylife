import type { TimingPoint, TimingSeverity } from '@/lib/life-timing/types';

interface Props {
  point: TimingPoint;
}

const SEVERITY_LABEL: Record<TimingSeverity, string> = {
  notice: '提示',
  caution: '留意',
  critical: '关键',
};

const SEVERITY_BADGE_CLASS: Record<TimingSeverity, string> = {
  notice: 'bg-[color:var(--brand-soft-2)] text-[color:var(--ink-2)]',
  caution: 'bg-amber-50 text-amber-800 border border-amber-200',
  critical: 'bg-red-50 text-red-800 border border-red-200',
};

export default function TimingPointCard({ point }: Props) {
  const dateLabel = formatDateRange(point.startDate, point.endDate);

  return (
    <div
      data-timing-point-id={point.id}
      className="lk-readonly rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-xs text-[color:var(--ink-3)]">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${SEVERITY_BADGE_CLASS[point.severity]}`}>
          {SEVERITY_LABEL[point.severity]}
        </span>
        <span className="font-mono">{dateLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-1)]">
        {point.userCopy?.summary || point.rawReason}
      </p>
      {point.userCopy && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {point.userCopy.todoSuggestions.length > 0 && (
            <div className="rounded bg-emerald-50 border border-emerald-100 p-2">
              <div className="text-emerald-700 font-bold mb-1">该做</div>
              <ul className="list-disc list-inside text-emerald-900 space-y-0.5">
                {point.userCopy.todoSuggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {point.userCopy.avoidSuggestions.length > 0 && (
            <div className="rounded bg-rose-50 border border-rose-100 p-2">
              <div className="text-rose-700 font-bold mb-1">该避</div>
              <ul className="list-disc list-inside text-rose-900 space-y-0.5">
                {point.userCopy.avoidSuggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDateRange(start: string, end?: string): string {
  if (!end) return start;
  if (start === end) return start;
  // 同年简写
  const [sy, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');
  if (sy === ey) {
    if (sm === em) return `${sy}-${sm}-${sd} 至 ${ed}`;
    return `${sy}-${sm}-${sd} 至 ${em}-${ed}`;
  }
  return `${start} 至 ${end}`;
}
