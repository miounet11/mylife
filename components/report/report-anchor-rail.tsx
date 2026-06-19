// v5-D60 (2026-05-21) 报告页 FB 2017 timeline 风左侧 sticky 锚点 rail
// Why: 报告页内容长、板块多，timeline 风需要一个稳定的快速跳转工具栏；
//      桌面端 sticky 在 220px 宽左栏，移动端折叠成顶部水平 chip 滚动。
// How: 接 `items=[{ id, label, icon? }]`，纯展示；样式走 .fb-* 主题层。

import type { LucideIcon } from 'lucide-react';

export interface ReportAnchorRailItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface ReportAnchorRailProps {
  items: ReportAnchorRailItem[];
  /** 顶部小标题，例如「这份报告」 */
  title?: string;
}

export default function ReportAnchorRail({
  items,
  title = '这份报告',
}: ReportAnchorRailProps) {
  if (!items.length) return null;
  return (
    <>
      {/* 桌面端 sticky 列 */}
      <aside
        aria-label="报告板块导航"
        className="hidden xl:block xl:w-[220px] xl:shrink-0"
      >
        <nav className="fb-card sticky-top-header">
          <div className="fb-section-title border-b border-[color:var(--hairline)] px-3 py-2 text-[13px] font-bold text-[#3b5998]">
            {title}
          </div>
          <ul className="flex flex-col py-1 text-[13px]">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 leading-[1.34] text-[color:var(--ink-2)] transition hover:bg-[#e9ebee] hover:text-[#3b5998]"
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5 text-[#3b5998]" /> : null}
                    <span className="truncate" title={item.label}>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* 移动端水平 chip 滚动 */}
      <div className="xl:hidden -mx-4 mb-2 overflow-x-auto px-4">
        <ul className="flex gap-1.5 whitespace-nowrap pb-1 text-[12px]">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                title={item.label}
                className="inline-flex items-center gap-1 rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 py-1 text-[color:var(--ink-2)] hover:border-[#3b5998] hover:text-[#3b5998]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
