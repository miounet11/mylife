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
      chip: 'bg-emerald-100 text-emerald-700',
      panel: 'border-emerald-200 bg-emerald-50/70',
    };
  }
  if (tone === 'watch') {
    return {
      chip: 'bg-amber-100 text-amber-800',
      panel: 'border-amber-200 bg-amber-50/75',
    };
  }
  return {
    chip: 'bg-sky-100 text-sky-800',
    panel: 'border-sky-200 bg-sky-50/70',
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
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="验证与可信层">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">验证与可信层</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.chip}`}>{confidenceLabel}</span>
      </div>

      <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">先信主轴，再用事件持续校正</h3>
      <p className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{summary}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">高可信点</div>
          <ul className="mt-2 grid gap-2">
            {highConfidencePoints.map((item) => (
              <li key={item} className="rounded-xl bg-white/85 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.2rem] border border-amber-200 bg-amber-50/75 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">敏感点</div>
          <ul className="mt-2 grid gap-2">
            {sensitivePoints.map((item) => (
              <li key={item} className="rounded-xl bg-white/88 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {correctionSummary ? (
        <div className={`mt-3 rounded-[1.2rem] border px-4 py-3 text-xs leading-6 text-[color:var(--ink)] ${tone.panel}`}>
          <span className="font-semibold text-[color:var(--muted)]">纠偏提示：</span>
          {correctionSummary}
        </div>
      ) : null}

      <div className="mt-3 rounded-[1.2rem] border border-[color:var(--line)] bg-white/84 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">事件提示</div>
        <ul className="mt-2 grid gap-2">
          {eventPrompts.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-[color:var(--ink)]">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
