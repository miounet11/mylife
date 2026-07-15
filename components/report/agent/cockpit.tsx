'use client';

import type { MergedAgentResults, StructuredAgenticContext } from '@/lib/agentic-report/types';
import { StatGrid } from '@/components/layout/stat-grid';

export default function ReportCockpit({
  context,
  merged,
}: {
  context: StructuredAgenticContext;
  merged: MergedAgentResults;
}) {
  const { engine } = context;
  const constitution = merged.merged.core_constitution as {
    constitutionSummary?: string;
    actions?: string[];
  } | undefined;
  const kline = merged.merged.kline_narrative as {
    currentPhase?: string;
    peakYears?: number[];
    troughYears?: number[];
  } | undefined;

  return (
    <section id="cockpit" className="fb-card scroll-mt-header p-5 md:p-6">
      <div className="lk-section-eyebrow">先看核心结论</div>
      <h2 className="lk-report-section-title mt-1.5">核心结论与当前状态</h2>

      {constitution?.constitutionSummary ? (
        <p className="lk-report-prose mt-4">{constitution.constitutionSummary}</p>
      ) : (
        <p className="lk-report-prose-muted mt-4">
          {engine.constitution.dayMaster}日主 · {engine.constitution.patternType} · 用神
          {engine.constitution.yongShen.join('、') || '待定'}
        </p>
      )}

      <div className="mt-5">
        <StatGrid
          columns={4}
          items={[
            { label: '当前得分', value: engine.derivedFacts.currentScore, mono: true },
            { label: '高点', value: engine.derivedFacts.peakScore, mono: true },
            { label: '低点', value: engine.derivedFacts.troughScore, mono: true },
            {
              label: '当前阶段',
              value: kline?.currentPhase || '—',
              helper: `${engine.derivedFacts.currentYear} 年`,
            },
          ]}
        />
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {[
          ['事业节奏', engine.timeWindows.career[0]?.label || '待展开'],
          ['关系模式', (merged.merged.relationship_family as { relationshipFocus?: string } | undefined)?.relationshipFocus || '待展开'],
          ['年度窗口', kline?.peakYears?.[0] ? `${kline.peakYears[0]} 高点` : '待展开'],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-3.5 py-3"
          >
            <div className="text-[11px] font-medium text-[color:var(--ink-4)]">{title}</div>
            <div className="mt-1 text-[13px] font-medium leading-[1.4] text-[color:var(--ink-1)]">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
