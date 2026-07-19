import type { ReportValidationSection } from '@/lib/report-types';
import { presentReportLines, presentReportText } from '@/lib/report-presentation';
import {
  reportValidationCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

interface ReportValidationPanelProps {
  section: ReportValidationSection;
  /** UI locale — English chrome when en; default zh-CN */
  locale?: string | null;
}

function toneClasses(tone?: ReportValidationSection['tone']) {
  if (tone === 'high') {
    return {
      chip: 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]',
      panel: 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.06)]',
    };
  }
  if (tone === 'watch') {
    return {
      chip: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]',
      panel: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
    };
  }
  return {
    chip: 'border-[color:var(--env)] bg-[color:var(--env-soft)] text-[color:var(--env)]',
    panel: 'border-[color:var(--env)] bg-[color:var(--env-soft)]',
  };
}

export default function ReportValidationPanel({
  section,
  locale,
}: ReportValidationPanelProps) {
  const copy = reportValidationCopy(resolveReportChromeLocale(locale));
  const confidenceLabel =
    presentReportText(section.confidenceLabel, 28) || copy.confidenceFallback;
  const summary =
    presentReportText(section.summary, 140) || copy.summaryFallback;
  const highConfidencePoints = presentReportLines(section.highConfidencePoints, {
    limit: 3,
    maxLen: 88,
  });
  const sensitivePoints = presentReportLines(section.sensitivePoints, {
    limit: 3,
    maxLen: 88,
  });
  const eventPrompts = presentReportLines(section.eventPrompts, {
    limit: 3,
    maxLen: 88,
  });
  const correctionSummary = presentReportText(section.correctionSummary, 140);
  const tone = toneClasses(section.tone);

  const high =
    highConfidencePoints.length > 0
      ? highConfidencePoints
      : [copy.highFallback];
  const sensitive =
    sensitivePoints.length > 0
      ? sensitivePoints
      : [copy.sensitiveFallback];
  const prompts =
    eventPrompts.length > 0
      ? eventPrompts
      : [copy.promptsFallback];

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      aria-label={copy.ariaLabel}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-strong)]">
          {copy.eyebrow}
        </div>
        <span
          className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${tone.chip}`}
        >
          {confidenceLabel}
        </span>
      </div>

      <h3 className="mt-1.5 text-[16px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[18px]">
        {copy.title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{summary}</p>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <article className="rounded-[var(--radius)] border border-[rgba(47,125,82,0.22)] bg-[rgba(47,125,82,0.05)] px-3 py-3">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">{copy.highLabel}</div>
          <ul className="mt-2 space-y-1.5">
            {high.map((item, i) => (
              <li
                key={`h-${i}`}
                className="text-[13px] leading-[1.6] text-[color:var(--ink-1)] break-words"
              >
                · {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/50 px-3 py-3">
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">{copy.sensitiveLabel}</div>
          <ul className="mt-2 space-y-1.5">
            {sensitive.map((item, i) => (
              <li
                key={`s-${i}`}
                className="text-[13px] leading-[1.6] text-[color:var(--ink-1)] break-words"
              >
                · {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {correctionSummary ? (
        <div className={`mt-2.5 rounded-[var(--radius)] border px-3 py-2.5 ${tone.panel}`}>
          <div className="text-[11px] font-bold opacity-80">{copy.correctionLabel}</div>
          <div className="mt-0.5 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">
            {correctionSummary}
          </div>
        </div>
      ) : null}

      <div className="mt-2.5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
        <div className="text-[11px] font-bold text-[color:var(--ink-4)]">{copy.eventPromptsLabel}</div>
        <ul className="mt-2 space-y-1.5">
          {prompts.map((item, i) => (
            <li
              key={`e-${i}`}
              className="text-[13px] leading-[1.6] text-[color:var(--ink-2)] break-words"
            >
              · {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
