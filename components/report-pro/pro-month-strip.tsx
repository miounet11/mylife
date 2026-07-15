import type { ProMonthStripItem } from '@/lib/report-pro-view';

const LEVEL_LABEL = {
  good: '顺',
  ok: '平',
  caution: '守',
} as const;

/** 近 12 月合一时间轴 — 中性列表，级别用文字 */
export default function ProMonthStrip({ items }: { items: ProMonthStripItem[] }) {
  if (!items.length) return null;

  return (
    <section id="pro-strip" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">近 12 个月</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            顺 · 平 · 守（优先记住宜守月份）
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-0 overflow-x-auto border-t border-[color:var(--hairline)] pb-1 scrollbar-none">
        {items.map((item) => (
          <div
            key={item.key}
            className={`min-w-[64px] shrink-0 border-r border-[color:var(--hairline)] px-2.5 py-2.5 text-center last:border-r-0 ${
              item.isCurrent ? 'bg-[color:var(--bg-sunken)]/60' : ''
            }`}
            title={`${item.label} ${item.theme} ${item.score10}/10`}
          >
            <div className="text-[11px] text-[color:var(--ink-5)]">
              {item.shortLabel}
              {item.isCurrent ? ' · 今' : ''}
            </div>
            <div className="mt-1 font-mono text-[15px] tabular-nums text-[color:var(--ink-1)]">
              {item.score10}
            </div>
            <div className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">
              {LEVEL_LABEL[item.level]}
            </div>
            {item.theme ? (
              <div className="mt-0.5 truncate text-[10px] text-[color:var(--ink-5)]">{item.theme}</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
