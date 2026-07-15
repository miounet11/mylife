import type { ProOutlookBlock } from '@/lib/report-pro-view';
import ProScoreBar from '@/components/report-pro/pro-score-bar';

export default function ProOutlookPair({
  month,
  year,
}: {
  month: ProOutlookBlock | null;
  year: ProOutlookBlock | null;
}) {
  if (!month && !year) return null;

  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">运势节奏</h2>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">本月与今年</p>
      </div>

      <div className="mt-3 grid gap-0 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)] md:grid-cols-2 md:divide-x md:divide-y-0">
        {month ? <OutlookCard block={month} /> : null}
        {year ? <OutlookCard block={year} /> : null}
      </div>
    </section>
  );
}

function OutlookCard({ block }: { block: ProOutlookBlock }) {
  return (
    <article className="py-3.5 md:px-4 md:first:pl-0 md:last:pr-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">{block.title}</h3>
        {typeof block.score10 === 'number' ? <ProScoreBar score10={block.score10} compact /> : null}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-[12px] leading-[1.7] text-[color:var(--ink-2)] md:text-[13px]">
        {block.body}
      </p>

      {block.tags.length > 0 ? (
        <div className="mt-2 text-[11px] text-[color:var(--ink-5)]">{block.tags.join(' · ')}</div>
      ) : null}

      {block.keyDates.length > 0 ? (
        <div className="mt-2.5 border-t border-[color:var(--hairline)] pt-2">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">重点日期</div>
          <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">{block.keyDates.join(' · ')}</div>
        </div>
      ) : null}
    </article>
  );
}
