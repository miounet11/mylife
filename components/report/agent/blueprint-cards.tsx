'use client';

import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';

const QUALITY_LABEL: Record<string, string> = {
  excellent: '优',
  good: '良',
  neutral: '中',
  poor: '弱',
};

export default function ReportBlueprintCards({ engine }: { engine: EngineGroundTruth }) {
  const { constitution, pillars, dayun } = engine;

  return (
    <section id="blueprint" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader eyebrow="命盘" title="结构蓝图" description="四柱、用神与大运窗口的结构摘要。" />

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.label}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-center"
          >
            <div className="text-[11px] font-bold text-[color:var(--ink-4)]">{pillar.label}</div>
            <div className="mt-1 font-serif text-[16px] font-black text-[color:var(--ink-1)]">{pillar.ganZhi}</div>
            <div className="text-[10px] text-[color:var(--ink-4)]">{pillar.nayin}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 text-[12px] sm:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5">
          <span className="text-[color:var(--ink-4)]">日主 · </span>
          <span className="font-semibold text-[color:var(--ink-2)]">
            {constitution.dayMaster}（{constitution.strength}）
          </span>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5">
          <span className="text-[color:var(--ink-4)]">格局 · </span>
          <span className="font-semibold text-[color:var(--ink-2)]">{constitution.patternType}</span>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5">
          <span className="text-[color:var(--ink-4)]">用神 · </span>
          <span className="font-semibold text-[color:var(--ink-2)]">
            {constitution.yongShen.join('、') || '待定'}
          </span>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5">
          <span className="text-[color:var(--ink-4)]">大运方向 · </span>
          <span className="font-semibold text-[color:var(--ink-2)]">{dayun.direction}</span>
        </div>
      </div>

      {dayun.windows.length ? (
        <div className="mt-4 space-y-2">
          {dayun.windows.slice(0, 5).map((window) => (
            <div
              key={`${window.ganZhi}-${window.startAge}`}
              className={`flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2 text-[12px] ${
                window.isCurrent
                  ? 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]'
                  : 'border-[color:var(--hairline)]'
              }`}
            >
              <span className="font-semibold text-[color:var(--ink-2)]">
                {window.ganZhi} · {window.startAge}–{window.endAge} 岁
                {window.isCurrent ? '（当前）' : ''}
              </span>
              <span className="text-[11px] font-bold text-[color:var(--brand)]">
                {QUALITY_LABEL[window.quality] || window.quality}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}