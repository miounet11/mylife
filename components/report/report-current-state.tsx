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
  if (stance === 'push') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (stance === 'hold') return 'border-slate-200 bg-slate-50 text-slate-700';
  if (stance === 'adjust') return 'border-sky-200 bg-sky-50 text-sky-800';
  if (stance === 'recover') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-[color:var(--line)] bg-white text-[color:var(--ink)]';
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
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="当前运行状态">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前操作系统</div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stanceTone(section.stance)}`}>
          {compactCopy(section.stanceLabel, 18) || fallbackStanceLabel(section.stance)}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-bold leading-8 text-[color:var(--ink)]">{headline}</h2>

      {summary ? (
        <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">{summary}</p>
      ) : null}

      {evidence.length > 0 ? (
        <ul className="mt-4 grid gap-2" aria-label="当前状态证据">
          {evidence.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
          当前证据项较少，先按驾驶舱的优先动作推进并持续记录反馈。
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white/84 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
        {usageNote || '使用方式：本段用于校准当前节奏，不替代后续验证和复盘。'}
      </div>
    </section>
  );
}
