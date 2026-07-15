'use client';

import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';

const TREND_LABEL: Record<string, string> = {
  up: '上升',
  down: '下行',
  flat: '平稳',
};

const WINDOW_TYPE: Record<string, string> = {
  peak: '高点窗口',
  trough: '低点窗口',
  turning: '转折窗口',
  stable: '稳定窗口',
};

export default function ReportRhythmTimeline({ kline }: { kline: EngineGroundTruth['kline'] }) {
  const phases = kline.phases || [];
  const windows = kline.windows || [];
  if (!phases.length && !windows.length) return null;

  return (
    <section id="rhythm" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader eyebrow="节奏" title="阶段与窗口" description="人生 K 线的阶段划分与关键时间窗口。" />
      {phases.length ? (
        <div className="mt-4 space-y-2">
          {phases.map((phase) => (
            <div
              key={`${phase.label}-${phase.startYear}`}
              className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">{phase.label}</div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  {phase.startYear}–{phase.endYear} · 均分 {phase.avgScore}
                </div>
              </div>
              <span className="text-[11px] font-bold text-[color:var(--brand)]">
                {TREND_LABEL[phase.trend] || phase.trend}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {windows.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {windows.slice(0, 6).map((window) => (
            <div
              key={`${window.label}-${window.startYear}`}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5"
            >
              <div className="text-[11px] font-bold text-[color:var(--ink-4)]">
                {WINDOW_TYPE[window.type] || window.type}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-[color:var(--ink-2)]">{window.label}</div>
              <div className="text-[11px] text-[color:var(--ink-4)]">
                {window.startYear}–{window.endYear} · 得分 {window.score}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}