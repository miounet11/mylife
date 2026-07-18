'use client';

import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { ProBaziChartMount } from '@/components/report/pro-bazi-chart-mount';

const QUALITY_LABEL: Record<string, string> = {
  excellent: '优',
  good: '良',
  neutral: '中',
  poor: '弱',
};

const STRENGTH_LABEL: Record<string, string> = {
  strong: '身旺',
  weak: '身弱',
  balanced: '中和',
  follow: '从格',
};

export default function ReportBlueprintCards({ engine }: { engine: EngineGroundTruth }) {
  const { constitution, dayun } = engine;
  const strengthNote = STRENGTH_LABEL[constitution.strength] || constitution.strength;

  return (
    <section id="blueprint" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader eyebrow="命盘" title="结构蓝图" description="四柱、用神与大运窗口的结构摘要。" />

      {/* PR A4: dense 四柱一屏 — stems/branches/十神/用神/大运 */}
      <div className="mt-4">
        <ProBaziChartMount
          engine={engine}
          className="border-0 bg-transparent p-0 md:p-0"
        />
      </div>

      {strengthNote || dayun.direction ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
          {strengthNote ? (
            <span className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-2.5 py-1 text-[color:var(--ink-3)]">
              强弱 · <span className="font-semibold text-[color:var(--ink-2)]">{strengthNote}</span>
            </span>
          ) : null}
          {dayun.direction ? (
            <span className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-2.5 py-1 text-[color:var(--ink-3)]">
              大运方向 · <span className="font-semibold text-[color:var(--ink-2)]">{dayun.direction}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {dayun.windows.length ? (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-medium text-[color:var(--ink-4)]">大运序列</div>
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