'use client';

import type { EngineGroundTruth, MergedAgentResults } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { buildReportContinueChatHref } from '@/lib/chat-entry';

export function PastPresentFutureRow({ kline }: { kline: EngineGroundTruth['kline'] }) {
  const phases = kline.phases || [];
  const currentYear = new Date().getFullYear();
  const past = phases.filter((p) => p.endYear < currentYear).slice(-1)[0];
  const present = phases.find((p) => p.startYear <= currentYear && p.endYear >= currentYear);
  const future = phases.filter((p) => p.startYear > currentYear)[0];

  if (!past && !present && !future) return null;

  const cells = [
    { label: '过去', phase: past },
    { label: '现在', phase: present },
    { label: '未来', phase: future },
  ];

  return (
    <section className="fb-card p-4 md:p-5">
      <SectionHeader eyebrow="时序" title="过去 · 现在 · 未来" />
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {cells.map(({ label, phase }) => (
          <div
            key={label}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5"
          >
            <div className="text-[11px] font-bold text-[color:var(--brand)]">{label}</div>
            {phase ? (
              <>
                <div className="mt-1 text-[13px] font-bold text-[color:var(--ink-1)]">{phase.label}</div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  {phase.startYear}–{phase.endYear}
                </div>
              </>
            ) : (
              <div className="mt-1 text-[12px] text-[color:var(--ink-4)]">—</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReportHighlightsGrid({ merged }: { merged: MergedAgentResults }) {
  const highlights: string[] = [];
  const constitution = merged.merged.core_constitution as { constitutionSummary?: string } | undefined;
  if (constitution?.constitutionSummary) highlights.push(constitution.constitutionSummary);

  const kline = merged.merged.kline_narrative as { currentPhase?: string } | undefined;
  if (kline?.currentPhase) highlights.push(`当前阶段：${kline.currentPhase}`);

  const strategy = merged.merged.strategy_advisor as { topPriority?: string } | undefined;
  if (strategy?.topPriority) highlights.push(strategy.topPriority);

  if (!highlights.length) return null;

  return (
    <section className="fb-card p-4 md:p-5">
      <SectionHeader title="要点摘录" />
      <ul className="mt-3 space-y-2">
        {highlights.slice(0, 4).map((item) => (
          <li
            key={item}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2 text-[13px] text-[color:var(--ink-2)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ValidationFeedbackHero({ reportId }: { reportId: string }) {
  return (
    <section className="fb-card p-5 md:p-6">
      <SectionHeader
        title="用现实节点验证判断"
        description="记录关键事件，三个月后回来看判断在哪些年份应验、哪些需要修正。"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`/events?reportId=${encodeURIComponent(reportId)}`} className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline">
          记录事件
        </a>
        <a href="/predictions" className="fb-btn h-9 px-4 text-[13px] hover:no-underline">
          预测回访
        </a>
        <a href={buildReportContinueChatHref({ reportId: reportId, source: 'result_deep_summary', teacher: 'overview' })} className="fb-btn h-9 px-4 text-[13px] hover:no-underline">
          继续追问
        </a>
      </div>
    </section>
  );
}

export function ReadingPathPlanner() {
  return null;
}