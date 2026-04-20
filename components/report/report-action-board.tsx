import type { ReportActionBoardSection } from '@/lib/report-types';

interface ReportActionBoardProps {
  section: ReportActionBoardSection;
}

function compactCopy(value?: string, maxLength = 64) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function compactList(items: string[] | undefined, fallback: string, limit = 3) {
  const lines = (items || []).map((item) => compactCopy(item, 62)).filter(Boolean);
  if (lines.length === 0) {
    return [fallback];
  }
  return lines.slice(0, limit);
}

export default function ReportActionBoard({ section }: ReportActionBoardProps) {
  const now = compactList(section.now, '先做一个最小可验证动作。');
  const next30Days = compactList(section.next30Days, '先排一个30天节点并记录反馈。');
  const next90Days = compactList(section.next90Days, '90天内保持一条主线，不并行硬推。');
  const avoidList = compactList(section.avoidList, '避免在时机未确认前并行高成本动作。');
  const focusSummary = compactCopy(section.focusSummary, 108);

  return (
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="行动执行板">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">行动执行板</div>
      <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">现在、30天、90天，按顺序推进</h3>

      {focusSummary ? (
        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{focusSummary}</p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">现在</div>
          <ul className="mt-2 grid gap-2">
            {now.map((item) => (
              <li key={item} className="rounded-xl bg-white/85 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.2rem] border border-sky-200 bg-sky-50/70 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">30 天</div>
          <ul className="mt-2 grid gap-2">
            {next30Days.map((item) => (
              <li key={item} className="rounded-xl bg-white/85 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/84 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">90 天</div>
          <ul className="mt-2 grid gap-2">
            {next90Days.map((item) => (
              <li key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.2rem] border border-rose-200 bg-rose-50/70 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">先别做</div>
          <ul className="mt-2 grid gap-2">
            {avoidList.map((item) => (
              <li key={item} className="rounded-xl bg-white/88 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
