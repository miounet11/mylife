import ResultCtaLink from '@/components/result-cta-link';
import type { ReportOpeningTension } from '@/lib/report-opening-tension';

/** First-screen judgment: one conflict + one tap-to-ask. */
export default function ProOpeningTension({
  tension,
  reportId,
}: {
  tension: ReportOpeningTension;
  reportId: string;
}) {
  return (
    <section
      id="pro-tension"
      className="scroll-mt-header border-b border-[color:var(--hairline)] pb-5"
    >
      <p className="text-[11px] font-medium tracking-[0.08em] text-[color:var(--ink-5)]">
        {tension.eyebrow}
      </p>
      <h2 className="mt-1.5 max-w-2xl text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[20px]">
        {tension.headline}
      </h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-[1.65] text-[color:var(--ink-3)]">
        {tension.why}
      </p>
      <p className="mt-2 max-w-2xl text-[13px] leading-[1.6] text-[color:var(--ink-2)]">
        <span className="text-[color:var(--ink-5)]">现在就做 · </span>
        {tension.doNow}
      </p>
      <div className="mt-3">
        <ResultCtaLink
          href={tension.askHref}
          page={`/result/${reportId}`}
          target="result_opening_tension"
          className="inline-flex min-h-10 items-center justify-between gap-3 rounded-[10px] bg-[color:var(--brand-strong)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
          meta={{ reportId, source: 'result_opening_tension', label: tension.askLabel }}
        >
          <span>问顾问 · {tension.askLabel}</span>
          <span aria-hidden>→</span>
        </ResultCtaLink>
      </div>
    </section>
  );
}
