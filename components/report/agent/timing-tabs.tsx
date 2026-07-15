'use client';

import { useState } from 'react';
import type { EngineGroundTruth } from '@/lib/agentic-report/types';
import { SectionHeader } from '@/components/layout/section-header';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财富' },
  { key: 'relationship', label: '关系' },
  { key: 'health', label: '健康' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ReportTimingTabs({
  timeWindows,
  calibrated = false,
}: {
  timeWindows: EngineGroundTruth['timeWindows'];
  calibrated?: boolean;
}) {
  const [active, setActive] = useState<TabKey>('career');
  const windows = timeWindows[active] || [];
  if (!TABS.some((tab) => (timeWindows[tab.key] || []).length)) return null;

  return (
    <section id="timing" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader
        title="时间窗口"
        description={
          calibrated
            ? '已校准用户可优先按月细读窗口；此处按主题汇总关键年份与得分。'
            : '按主题查看关键年份窗口与得分。'
        }
      />
      <div className="mt-3 flex flex-wrap gap-1 border-b border-[color:var(--hairline)] pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-semibold transition',
              active === tab.key
                ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {windows.length ? (
          windows.slice(0, 5).map((window) => (
            <div
              key={`${window.label}-${window.startYear}`}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2"
            >
              <div>
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">{window.label}</div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  {window.startYear}–{window.endYear}
                </div>
              </div>
              <span className="font-mono text-[13px] font-bold text-[color:var(--brand)]">{window.score}</span>
            </div>
          ))
        ) : (
          <p className="text-[12px] text-[color:var(--ink-4)]">该主题暂无窗口数据。</p>
        )}
      </div>
    </section>
  );
}