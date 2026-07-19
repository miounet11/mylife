'use client';

// v5-D38 报告页层级重构：时间地图 Tab
// 把 /r/[id] 三个 timing block (30d / 12m / 5y) 在 full 视图中以 Tab 形式合并，
// 让用户进入完整报告时，第一眼就有"我现在/近期/远期"三档时间轴可切换，
// 而不是顺序滚动 5 屏才看到"5 年"。
//
// 默认 30d——意图最高、最贴近"今天"。
// 移动端：Tab 横滑；桌面端：Tab 三栏。

import { useMemo, useState } from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import Next30DaysBlock from '@/components/result-v2/next-30-days-block';
import Next12MonthsBlock from '@/components/result-v2/next-12-months-block';
import Next5YearsBlock from '@/components/result-v2/next-5-years-block';
import type { TimingProfile } from '@/lib/life-timing/types';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportTimingCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

interface Props {
  record: Pick<
    TimingProfile,
    'next_30_days' | 'next_12_months' | 'next_5_years' | 'baziPillars'
  >;
  /** UI locale — English chrome when en; falls back to LocaleProvider / zh-CN */
  locale?: string | null;
}

type TabKey = '30d' | '12m' | '5y';

export default function ReportTimingTabs({ record, locale: localeProp }: Props) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportTimingCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));
  const [active, setActive] = useState<TabKey>('30d');

  const tabDefs = useMemo(
    () =>
      [
        { key: '30d' as const, label: copy.tab30d, hint: copy.tab30dHint, Icon: Calendar },
        { key: '12m' as const, label: copy.tab12m, hint: copy.tab12mHint, Icon: CalendarDays },
        { key: '5y' as const, label: copy.tab5y, hint: copy.tab5yHint, Icon: CalendarRange },
      ] as const,
    [copy.tab30d, copy.tab30dHint, copy.tab12m, copy.tab12mHint, copy.tab5y, copy.tab5yHint],
  );

  const counts: Record<TabKey, number> = {
    '30d': record.next_30_days?.length || 0,
    '12m': record.next_12_months?.length || 0,
    '5y': record.next_5_years?.length || 0,
  };

  return (
    <section
      aria-label={copy.ariaLabel}
      className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-4 shadow-sm md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            {copy.eyebrow}
          </div>
          <h2 className="mt-1 text-lg font-black text-[color:var(--ink-1)] md:text-xl">
            {copy.title}
          </h2>
        </div>
      </div>

      {/* Tab 头 */}
      <div
        role="tablist"
        aria-label={copy.tablistAria}
        className="mb-4 flex gap-1 overflow-x-auto rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] p-1"
      >
        {tabDefs.map(({ key, label, hint, Icon }) => {
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
