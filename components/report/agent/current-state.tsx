'use client';

import type { MergedAgentResults, StructuredAgenticContext } from '@/lib/agentic-report/types';
import { StatGrid } from '@/components/layout/stat-grid';
import { SectionHeader } from '@/components/layout/section-header';

export default function ReportCurrentState({
  context,
  merged,
}: {
  context: StructuredAgenticContext;
  merged: MergedAgentResults;
}) {
  const { engine, context: signals } = context;
  const spatial = merged.merged.temporal_spatial_advisor as {
    temporalSignal?: string;
    spatialSignal?: string;
    macroSignal?: string;
    environmentSummary?: string;
    movementAdvice?: string[];
  } | undefined;

  const environmentText =
    spatial?.environmentSummary
    || [spatial?.temporalSignal, spatial?.spatialSignal, spatial?.macroSignal].filter(Boolean).join(' · ')
    || signals.geoClimate.geographyPreference
    || signals.spatialFactors.environmentAdvice?.[0]
    || '待展开';

  return (
    <section id="current-state" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader title="当前状态快照" description="结合时位信号与现实处境的结构定位。" />

      <StatGrid
        className="mt-4"
        columns={4}
        items={[
          { label: '当前年龄', value: engine.derivedFacts.currentAge, mono: true },
          { label: '流年', value: signals.temporal.liuNian || String(engine.derivedFacts.currentYear) },
          { label: '节气', value: signals.temporal.currentSolarTerm || '—' },
          { label: '人生阶段', value: signals.humanFactors.lifeStage || '—' },
        ]}
      />

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--ink-4)]">世界状态</div>
          <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-3)]">
            {signals.worldState.summary || signals.worldState.priority}
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
          <div className="text-[11px] font-bold text-[color:var(--ink-4)]">环境层</div>
          <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-3)]">{environmentText}</p>
        </div>
      </div>
    </section>
  );
}