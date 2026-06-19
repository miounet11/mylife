import type { ReportCurrentStateSection } from '@/lib/report-types';

interface ReportCurrentStateProps {
  section: ReportCurrentStateSection;
}

function compactCopy(value?: string, maxLength = 92) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function stanceTone(stance: ReportCurrentStateSection['stance']) {
  if (stance === 'push') return 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  if (stance === 'hold') return 'border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
  if (stance === 'adjust') return 'border-[color:var(--env)] bg-[color:var(--env-soft)] text-[color:var(--env)]';
  if (stance === 'recover') return 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-2)]';
}

function fallbackStanceLabel(stance: ReportCurrentStateSection['stance']) {
  if (stance === 'push') return '主动推进';
  if (stance === 'hold') return '稳住节奏';
  if (stance === 'adjust') return '边走边校准';
  if (stance === 'recover') return '先复盘修正';
  return '稳住节奏';
}

export default function ReportCurrentState({ section }: ReportCurrentStateProps) {
  const evidence = (section.evidence || []).map((item) => compactCopy(item, 70)).filter(Boolean).slice(0, 3);
  const headline = compactCopy(section.headline, 88) || '先稳住节奏，再推进关键动作。';
  const summary = compactCopy(section.summary, 118);
  const usageNote = compactCopy(section.usageNote, 84);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="当前运行状态"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          当前操作系统
        </div>
        <span className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 font-mono text-xs font-bold uppercase tracking-wider ${stanceTone(section.stance)}`}>
          {compactCopy(section.stanceLabel, 18) || fallbackStanceLabel(section.stance)}
        </span>
      </div>

      <h2 className="mt-2 text-lg font-bold leading-7 text-[color:var(--ink-1)] md:text-xl">{headline}</h2>

      {summary ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">{summary}</p>
      ) : null}

      {evidence.length > 0 ? (
        <ul className="mt-3 space-y-1.5" aria-label="当前状态证据">
          {evidence.map((item) => (
            <li
              key={item}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-3)]"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-5)]">
          当前证据项较少，先按驾驶舱的优先动作推进并持续记录反馈。
        </div>
      )}

      <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-5 text-[color:var(--ink-4)]">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
          USAGE
        </span>
        <div className="mt-0.5">
          {usageNote || '使用方式：本段用于校准当前节奏，不替代后续验证和复盘。'}
        </div>
      </div>
    </section>
  );
}
