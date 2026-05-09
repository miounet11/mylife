'use client';

import type { EntryReadinessItem } from './types';

type EntryReadinessSidebarProps = {
  readinessScore: number;
  nextHint: string;
  entryReadiness: EntryReadinessItem[];
  birthLabel: string;
  addressLabel: string;
  sunTimeLabel: string;
  hasTacitContext: boolean;
};

export default function EntryReadinessSidebar({
  readinessScore,
  nextHint,
  entryReadiness,
  birthLabel,
  addressLabel,
  sunTimeLabel,
  hasTacitContext,
}: EntryReadinessSidebarProps) {
  return (
    <div className="hidden space-y-3 xl:sticky xl:top-24 xl:block">
      <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[color:var(--ink)]">录入完成度</div>
            <div className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{nextHint}</div>
          </div>
          <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--accent-strong)]">
            {readinessScore}%
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {entryReadiness.map((item) => (
            <div key={item.label} className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-[color:var(--muted)]">{item.label}</div>
                <div
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    item.done
                      ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                      : 'bg-[#f3f3f3] text-[#8a8a8a]'
                  }`}
                >
                  {item.done ? '已确认' : '待确认'}
                </div>
              </div>
              <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-3 text-sm leading-6 text-[color:var(--muted)] xl:block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-semibold text-[color:var(--ink)]">当前摘要</div>
          {hasTacitContext ? (
            <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              已补充默会信息
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2">
          <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
            <div className="text-xs text-[color:var(--muted)]">出生时间</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{birthLabel}</div>
          </div>
          <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
            <div className="text-xs text-[color:var(--muted)]">出生地点</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{addressLabel}</div>
          </div>
          <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
            <div className="text-xs text-[color:var(--muted)]">真太阳时</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{sunTimeLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
