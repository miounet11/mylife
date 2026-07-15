'use client';

import type { EngineGroundTruth } from '@/lib/agentic-report/types';

export default function LifeKLineSummaryCard({ kline }: { kline: EngineGroundTruth['kline'] }) {
  const points = kline.points || [];
  if (!points.length) return null;

  const maxScore = Math.max(...points.map((p) => p.score || 0), 1);
  const recent = points.slice(-24);

  return (
    <section className="fb-card overflow-hidden p-0">
      <div className="border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)]">
        运势曲线 · 图表内嵌
      </div>
      <div className="theme-ming p-4 md:p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-subtle">人生 K 线</div>
        <h3 className="mt-1 text-base font-bold text-gold">阶段趋势概览</h3>

        <div className="mt-4 flex h-28 items-end gap-0.5">
          {recent.map((point, index) => {
            const height = Math.max(6, Math.round(((point.score || 0) / maxScore) * 100));
            const tone =
              (point.score || 0) >= 60 ? 'bg-[color:var(--color-ming-accent-up)]' :
              (point.score || 0) <= 40 ? 'bg-[color:var(--color-ming-accent-down)]' :
              'bg-[color:var(--color-ming-gold-dim)]';
            return (
              <div
                key={`${point.year}-${index}`}
                className={`flex-1 rounded-t-[2px] ${tone}`}
                style={{ height: `${height}%` }}
                title={`${point.year}: ${point.score}`}
              />
            );
          })}
        </div>

        {kline.phases.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {kline.phases.slice(0, 4).map((phase) => (
              <div
                key={phase.label}
                className="rounded-[var(--radius-sm)] border border-[color:var(--color-ming-border)] bg-[color:var(--color-ming-surface-light)] px-3 py-2"
              >
                <div className="text-[11px] text-subtle">{phase.startYear}–{phase.endYear}</div>
                <div className="text-[12px] font-semibold text-[color:var(--color-ming-text)]">{phase.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}