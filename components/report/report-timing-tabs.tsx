'use client';

// v5-D38 报告页层级重构：时间地图 Tab
// 把 /r/[id] 三个 timing block (30d / 12m / 5y) 在 full 视图中以 Tab 形式合并，
// 让用户进入完整报告时，第一眼就有"我现在/近期/远期"三档时间轴可切换，
// 而不是顺序滚动 5 屏才看到"5 年"。
//
// 默认 30d——意图最高、最贴近"今天"。
// 移动端：Tab 横滑；桌面端：Tab 三栏。

import { useState } from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import Next30DaysBlock from '@/components/result-v2/next-30-days-block';
import Next12MonthsBlock from '@/components/result-v2/next-12-months-block';
import Next5YearsBlock from '@/components/result-v2/next-5-years-block';
import type { TimingProfile } from '@/lib/life-timing/types';

interface Props {
  record: Pick<
    TimingProfile,
    'next_30_days' | 'next_12_months' | 'next_5_years' | 'baziPillars'
  >;
}

type TabKey = '30d' | '12m' | '5y';

const TAB_DEFS: Array<{
  key: TabKey;
  label: string;
  hint: string;
  Icon: typeof Calendar;
}> = [
  { key: '30d', label: '近 30 天', hint: '本月可执行的关键节点', Icon: Calendar },
  { key: '12m', label: '近 12 月', hint: '半年到一年的窗口', Icon: CalendarDays },
  { key: '5y', label: '近 5 年', hint: '人生阶段切换', Icon: CalendarRange },
];

export default function ReportTimingTabs({ record }: Props) {
  const [active, setActive] = useState<TabKey>('30d');

  const counts: Record<TabKey, number> = {
    '30d': record.next_30_days?.length || 0,
    '12m': record.next_12_months?.length || 0,
    '5y': record.next_5_years?.length || 0,
  };

  return (
    <section
      aria-label="时间地图"
      className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-4 shadow-sm md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            时间地图
          </div>
          <h2 className="mt-1 text-lg font-black text-[color:var(--ink-1)] md:text-xl">
            从今天，到未来 5 年
          </h2>
        </div>
      </div>

      {/* Tab 头 */}
      <div
        role="tablist"
        aria-label="时间地图视角切换"
        className="mb-4 flex gap-1 overflow-x-auto rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] p-1"
      >
        {TAB_DEFS.map(({ key, label, hint, Icon }) => {
          const selected = active === key;
          const count = counts[key];
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`timing-panel-${key}`}
              id={`timing-tab-${key}`}
              onClick={() => setActive(key)}
              className={`group flex min-w-[110px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition ${
                selected
                  ? 'bg-[color:var(--brand)] text-white shadow-sm'
                  : 'text-[color:var(--ink-3)] hover:bg-[color:var(--brand-soft)]'
              }`}
              title={hint}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs font-bold ${
                    selected
                      ? 'bg-white/25 text-white'
                      : 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div
        role="tabpanel"
        id={`timing-panel-${active}`}
        aria-labelledby={`timing-tab-${active}`}
      >
        {active === '30d' && <Next30DaysBlock points={record.next_30_days || []} />}
        {active === '12m' && <Next12MonthsBlock points={record.next_12_months || []} />}
        {active === '5y' && (
          <Next5YearsBlock
            transitions={record.next_5_years || []}
            baziPillars={record.baziPillars}
          />
        )}
      </div>
    </section>
  );
}
