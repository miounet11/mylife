import type { ReportValidationSection } from '@/lib/report-types';

interface ReportValidationPanelProps {
  section: ReportValidationSection;
}

function compactCopy(value?: string, maxLength = 88) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function compactList(items: string[] | undefined, fallback: string, limit = 3, maxLength = 70) {
  const lines = (items || []).map((item) => compactCopy(item, maxLength)).filter(Boolean);
  if (lines.length === 0) {
    return [fallback];
  }
  return lines.slice(0, limit);
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
  const confidenceLabel = compactCopy(section.confidenceLabel, 26) || '可信度待补充';
  const summary = compactCopy(section.summary, 108) || '当前先按主线推进，并持续记录验证事件。';
  const highConfidencePoints = compactList(section.highConfidencePoints, '核心结构判断可先作为行动基线。');
  const sensitivePoints = compactList(section.sensitivePoints, '短期时机和执行节奏需要持续复核。');
  const eventPrompts = compactList(
    section.eventPrompts,
    '遇到关键变化时及时记录：转岗、合作、关系推进或健康波动。',
    3,
    72
  );
  const correctionSummary = compactCopy(section.correctionSummary, 108);
  const tone = toneClasses(section.tone);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="验证与可信层"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          验证与可信层
        </div>
        <span className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 font-mono text-xs font-bold uppercase tracking-wider ${tone.chip}`}>
          {confidenceLabel}
        </span>
      </div>

      <h3 className="mt-2 text-base font-black leading-snug text-[color:var(--ink-1)] md:text-lg">
        先信主轴，再用事件持续校正
      </h3>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">{summary}</p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <article className="rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.06)] px-3 py-3">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--data-up)]">
            高可信点
          </div>
          <ul className="mt-2 space-y-1.5">
            {highConfidencePoints.map((item) => (
              <li
                key={item}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-3">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            敏感点
          </div>
          <ul className="mt-2 space-y-1.5">
            {sensitivePoints.map((item) => (
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

      {correctionSummary ? (
        <div className={`mt-2.5 rounded-[var(--radius)] border px-3 py-2.5 text-xs leading-5 ${tone.panel}`}>
          <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-80">
            纠偏提示
          </span>
          <div className="mt-0.5 text-[color:var(--ink-2)]">{correctionSummary}</div>
        </div>
      ) : null}

      <div className="mt-2.5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
          事件提示
        </div>
        <ul className="mt-2 space-y-1.5">
          {eventPrompts.map((item) => (
            <li
              key={item}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--ink-2)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
