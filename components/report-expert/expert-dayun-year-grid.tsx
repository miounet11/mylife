'use client';

import { useEffect } from 'react';
import type { DayunYearBlock } from '@/lib/dayun-year-grid';
import { trackProductEvent } from '@/lib/product-analytics';

const TONE_LABEL: Record<string, string> = {
  boost: '借力',
  ok: '中平',
  caution: '宜慎',
};

/**
 * 专业版：大运 × 逐年速查（现行 + 下一步）
 */
export default function ExpertDayunYearGrid({
  blocks,
  reportId,
}: {
  blocks: DayunYearBlock[];
  reportId?: string;
}) {
  useEffect(() => {
    if (blocks.length) {
      trackProductEvent('expert_dayun_grid_viewed', {
        reportId: reportId || '',
        steps: blocks.length,
      });
    }
  }, [blocks.length, reportId]);

  if (!blocks.length) return null;

  return (
    <section id="ex-dayun-years" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">大运 × 逐年</div>
          <h3 className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">岁运速查</h3>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            公历年柱近似 · 并临 / 空亡 / 用忌
          </p>
        </div>
        <div className="text-[11px] text-[color:var(--ink-5)]">借力 · 中平 · 宜慎</div>
      </div>

      <div className="mt-4 space-y-5">
        {blocks.map((block) => (
          <div key={`${block.dayunGanZhi}-${block.startYear}`}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px]">
              <span className="font-serif text-[16px] font-semibold text-[color:var(--ink-1)]">
                {block.dayunGanZhi}
              </span>
              <span className="font-mono text-[11px] text-[color:var(--ink-5)]">
                {block.startYear}–{block.endYear}
              </span>
              <span className="text-[11px] text-[color:var(--ink-5)]">
                {block.isCurrent ? '现行大运' : '下一步'}
              </span>
              {block.quality ? (
                <span className="text-[11px] text-[color:var(--ink-5)]">评级 {block.quality}</span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <div className="flex min-w-max border-t border-[color:var(--hairline)]">
                {block.years.map((cell) => (
                  <div
                    key={cell.year}
                    className={`w-[4.5rem] shrink-0 border-r border-[color:var(--hairline)] px-1.5 py-2 text-center last:border-r-0 ${
                      cell.isCurrentYear ? 'bg-[color:var(--bg-sunken)]/70' : ''
                    }`}
                    title={cell.note}
                  >
                    <div className="font-mono text-[10px] text-[color:var(--ink-5)]">{cell.year}</div>
                    <div className="font-serif text-[14px] font-medium leading-tight text-[color:var(--ink-1)]">
                      {cell.ganZhi}
                    </div>
                    <div className="mt-0.5 text-[9px] leading-tight text-[color:var(--ink-3)]">
                      {cell.vsDayun}
                    </div>
                    <div className="mt-0.5 text-[9px] leading-tight text-[color:var(--ink-5)]">
                      {TONE_LABEL[cell.tone] || TONE_LABEL.ok}
                      {cell.changSheng ? ` · ${cell.changSheng}` : ''}
                      {cell.isKongWang ? ' ·空' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
