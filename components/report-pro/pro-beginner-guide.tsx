import type { ProReportView } from '@/lib/report-pro-view';

export default function ProBeginnerGuide({
  oneLiner,
  guide,
  overviewScore,
}: {
  oneLiner: string;
  guide: string[];
  overviewScore: number;
}) {
  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[12px] font-medium text-[color:var(--ink-5)]">怎么读这份报告</span>
        <span className="font-mono text-[12px] tabular-nums text-[color:var(--ink-3)]">
          综合 {overviewScore}/10
        </span>
      </div>
      <p className="mt-2 text-[14px] font-medium leading-[1.65] text-[color:var(--ink-1)]">
        {oneLiner}
      </p>
      <ol className="mt-3 space-y-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
        {guide.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className="font-mono text-[11px] text-[color:var(--ink-4)]">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
