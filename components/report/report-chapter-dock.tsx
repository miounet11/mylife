'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Compass,
  Footprints,
  Layers,
  List,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** 仅允许可序列化字段：禁止把 Lucide 组件函数从 Server Component 传入 */
export type ReportChapterDockItem = {
  id: string;
  label: string;
  /** 客户端映射的图标 key，勿传 React 组件 */
  iconKey?:
    | 'compass'
    | 'calendar'
    | 'layers'
    | 'target'
    | 'check'
    | 'bell'
    | 'footprints';
};

const ICON_MAP: Record<NonNullable<ReportChapterDockItem['iconKey']>, LucideIcon> = {
  compass: Compass,
  calendar: CalendarDays,
  layers: Layers,
  target: Target,
  check: CheckCircle2,
  bell: Bell,
  footprints: Footprints,
};

/**
 * 悬浮章节导航：不占正文版面。
 * - 桌面：右侧竖条
 * - 移动：底部 pill + 抽屉
 */
export default function ReportChapterDock({
  items,
  title = '章节',
}: {
  items: ReportChapterDockItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(items[0]?.id || '');

  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.08, 0.2, 0.4],
      }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  const jump = (id: string) => {
    setActiveId(id);
    setOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* 桌面：右侧悬浮竖轨 */}
      <nav
        aria-label={title}
        className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-5"
      >
        <div className="pointer-events-auto flex flex-col gap-1 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)]/95 p-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur">
          {items.map((item, index) => {
            const active = activeId === item.id;
            const Icon = item.iconKey ? ICON_MAP[item.iconKey] : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => jump(item.id)}
                title={item.label}
                className={cn(
                  'group flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition',
                  active
                    ? 'bg-[#3b5998] text-white'
                    : 'text-[color:var(--ink-3)] hover:bg-[#e9ebee] hover:text-[#3b5998]'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                    active ? 'bg-white/20' : 'bg-[color:var(--bg-elevated)]'
                  )}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-semibold opacity-0 transition-all duration-200 group-hover:max-w-[7.5rem] group-hover:opacity-100 xl:inline xl:max-w-[7.5rem] xl:opacity-100">
                  {item.label.replace(/^[①-⑦]\s*/, '')}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 移动：底部悬浮 + 抽屉 */}
      <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 lg:hidden">
        <div className="w-full max-w-md">
          {open ? (
            <div className="mb-2 max-h-[50vh] overflow-auto rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2 shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
              <div className="px-2 py-1 text-[11px] font-bold text-[color:var(--ink-4)]">
                {title} · 点选跳转
              </div>
              <ul className="mt-1 grid grid-cols-2 gap-1">
                {items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => jump(item.id)}
                        className={cn(
                          'w-full rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold',
                          active
                            ? 'bg-[#3b5998] text-white'
                            : 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-2)]'
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mx-auto flex h-11 items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)]/95 px-4 text-[13px] font-bold text-[color:var(--ink-1)] shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur"
          >
            <List className="h-4 w-4 text-[#3b5998]" />
            {open ? '收起章节' : `章节 · ${items.find((i) => i.id === activeId)?.label || title}`}
          </button>
        </div>
      </div>
    </>
  );
}
