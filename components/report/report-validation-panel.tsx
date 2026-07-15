import type { ReportValidationSection } from '@/lib/report-types';
import { presentReportLines, presentReportText } from '@/lib/report-presentation';

interface ReportValidationPanelProps {
  section: ReportValidationSection;
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

export default function ReportValidationPanel({ section }: ReportValidationPanelProps) {
  const confidenceLabel =
    presentReportText(section.confidenceLabel, 28) || '可信度待补充';
  const summary =
    presentReportText(section.summary, 140) ||
    '当前先按主线推进，并持续记录验证事件。';
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
      : ['核心结构判断可先作为行动基线。'];
  const sensitive =
    sensitivePoints.length > 0
      ? sensitivePoints
      : ['短期时机和执行节奏需要持续复核。'];
  const prompts =
    eventPrompts.length > 0
      ? eventPrompts
      : ['遇到关键变化时及时记录：转岗、合作、关系推进或健康波动。'];

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      aria-label="验证与可信层"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-strong)]">
          验证与可信层
        </div>
        <span
          className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${tone.chip}`}
        >
          {confidenceLabel}
        </span>
      </div>

      <h3 className="mt-1.5 text-[16px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[18px]">
        先信主轴，再用事件持续校正
      </h3>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">{summary}</p>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <article className="rounded-[var(--radius)] border border-[rgba(47,125,82,0.22)] bg-[rgba(47,125,82,0.05)] px-3 py-3">
          <div className="text-[11px] font-bold text-[color:var(--data-up)]">高可信点</div>
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
          <div className="text-[11px] font-bold text-[color:var(--signal-strong)]">敏感点</div>
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
          <div className="text-[11px] font-bold opacity-80">纠偏提示</div>
          <div className="mt-0.5 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">
            {correctionSummary}
          </div>
        </div>
      ) : null}

      <div className="mt-2.5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
        <div className="text-[11px] font-bold text-[color:var(--ink-4)]">事件提示</div>
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
