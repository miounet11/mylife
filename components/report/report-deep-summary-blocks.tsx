import { CalendarClock } from 'lucide-react';

// v5-D7 (2026-05-16) 把 result/[id]/page.tsx details 区下半部分三个稳定结构块抽出：
// - ValidationFeedbackHero: canManage 时的验证状态条（关联事件/待验证/偏差/纠偏 summary）
// - ReportHighlightsGrid:   4 卡片 highlight 网格
// - ReadingPathPlanner:     "继续展开的顺序" 双列卡片
// Why: 主 page 仍 1279 行，这三块都是纯展示且数据耦合极低，抽出几乎零风险。
// How: 各自接最小 props；多个块同文件因为它们都是 details 内部的尾部装饰块，
//      改动通常一起发生，集中维护更稳定。

interface ValidationInsightsLike {
  totalLinkedEvents?: number;
  pendingCount?: number;
  driftCount?: number;
  summary?: string;
}

interface CorrectionInsightLike {
  summary?: string;
}

export function ValidationFeedbackHero({
  toneClass,
  label,
  validationInsights,
  correctionInsight,
}: {
  toneClass: string;
  label: string;
  validationInsights: ValidationInsightsLike;
  correctionInsight: CorrectionInsightLike;
}) {
  return (
    <div className="mt-5 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
          {label}
        </span>
        <span className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          {`关联事件 ${validationInsights.totalLinkedEvents || 0}`}
        </span>
        <span className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          {`待验证 ${validationInsights.pendingCount || 0}`}
        </span>
        <span className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          {`偏差 ${validationInsights.driftCount || 0}`}
        </span>
      </div>
      <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
        {validationInsights.summary}
      </div>
      <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
        {correctionInsight.summary}
      </div>
    </div>
  );
}

export function ReportHighlightsGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
          <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

interface EvidenceBlock {
  eyebrow: string;
  headline: string;
  evidence: string[];
}

export function PastPresentFutureRow({
  past,
  present,
  future,
}: {
  past: EvidenceBlock;
  present: EvidenceBlock;
  future: EvidenceBlock;
}) {
  const tones = [
    'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)]/70',
    'border-[color:var(--line)] bg-[color:var(--paper)]',
    'border-[color:var(--signal)] bg-[color:var(--signal-soft)]/75',
  ];
  const blocks = [past, present, future];
  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-3">
      {blocks.map((section, index) => (
        <div
          key={section.eyebrow}
          className={`rounded-[var(--radius)] border px-5 py-5 ${tones[index]}`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {section.eyebrow}
          </div>
          <div className="mt-3 text-base font-bold leading-7 text-[color:var(--ink)]">
            {section.headline}
          </div>
          <div className="mt-4 grid gap-3">
            {section.evidence.map((item) => (
              <div
                key={item}
                className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReadingPathPlanner({
  coreSectionNames,
  deferredSectionNames,
}: {
  coreSectionNames: string[];
  deferredSectionNames: string[];
}) {
  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius)] p-5">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-5 w-5 text-[color:var(--warm)]" />
        <div className="font-semibold text-[color:var(--ink)]">继续展开的顺序</div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4">
          <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">现在先看</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {coreSectionNames.map((item) => (
              <span key={item} className="rounded-full bg-[color:var(--paper)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4">
          <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">后面再展开</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {deferredSectionNames.map((item) => (
              <span key={item} className="rounded-full bg-[color:var(--paper)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
