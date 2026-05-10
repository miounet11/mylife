import type { TimingPoint, TimingSeverity } from '@/lib/life-timing/types';

interface Props {
  points: TimingPoint[];
}

const SEVERITY_DOT: Record<TimingSeverity, string> = {
  notice: 'bg-[color:var(--brand-soft-2)]',
  caution: 'bg-amber-400',
  critical: 'bg-red-500',
};

export default function Next12MonthsBlock({ points }: Props) {
  // 按月聚合
  const byMonth = new Map<string, TimingPoint[]>();
  for (const p of points) {
    const ym = p.startDate.slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym)!.push(p);
  }

  const months = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        未来 12 个月时间地图
      </div>
      <h3 className="mt-1 text-lg md:text-xl font-bold text-[color:var(--ink-1)]">
        {months.length} 个月里有 {points.length} 个时点
      </h3>
      {months.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--ink-3)]">这一段时期相对平稳。</p>
      ) : (
        <div className="mt-4 space-y-3">
          {months.map(([ym, monthPoints]) => (
            <div key={ym} className="border-l-2 border-[color:var(--brand-soft-2)] pl-4">
              <div className="text-sm font-bold text-[color:var(--ink-1)] mb-2">
                {formatMonth(ym)}
              </div>
              <ul className="space-y-1.5">
                {monthPoints.map((p) => (
                  <li key={p.id} className="flex items-start gap-2 text-xs leading-5">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[p.severity]}`}
                    />
                    <span className="text-[color:var(--ink-2)]">
                      <span className="font-mono text-[color:var(--ink-3)]">
                        {p.startDate.slice(5)}
                      </span>{' '}
                      — {p.userCopy?.summary || p.rawReason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y} 年 ${parseInt(m, 10)} 月`;
}
