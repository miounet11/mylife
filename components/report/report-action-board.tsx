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
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="行动执行板"
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        行动执行板
      </div>
      <h3 className="mt-1.5 text-base font-black leading-snug text-[color:var(--ink-1)] md:text-lg">
        现在、30 天、90 天，按顺序推进
      </h3>

      {focusSummary ? (
        <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">{focusSummary}</p>
      ) : null}

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[var(--radius)] border border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.06)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--data-up)]">
            NOW · 现在
          </div>
          <ul className="mt-2 space-y-1.5">
            {now.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius)] border border-[color:var(--env)] bg-[color:var(--env-soft)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--env)]">
            30D
          </div>
          <ul className="mt-2 space-y-1.5">
            {next30Days.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
            90D
          </div>
          <ul className="mt-2 space-y-1.5">
            {next90Days.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--alert)]">
            AVOID · 先别做
          </div>
          <ul className="mt-2 space-y-1.5">
            {avoidList.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
