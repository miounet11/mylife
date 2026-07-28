'use client';

/**
 * 报告结果页 · 工具分发条
 * Mobile：横向 chip 优先（转化主力在手机）
 * Desktop：卡片网格
 */

import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  reportId: string;
  yongShen?: string[];
  dayMaster?: string;
  source?: string;
  className?: string;
  /** compact：报告顶栏更矮 */
  compact?: boolean;
};

const TOOLS: Array<{
  href: (ctx: { reportId: string; source: string }) => string;
  label: string;
  short: string;
  desc: string;
  id: string;
  priority?: boolean;
}> = [
  {
    id: 'naming',
    label: '起名工坊',
    short: '起名',
    desc: '用神 · 康熙',
    priority: true,
    href: ({ reportId, source }) =>
      `/tools/naming?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'chat',
    label: '问顾问',
    short: '顾问',
    desc: '带盘深问',
    priority: true,
    href: ({ reportId, source }) =>
      `/chat?mode=opening&source=${encodeURIComponent(source)}&reportId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'physiognomy',
    label: '面相报告',
    short: '面相',
    desc: '物理→命理',
    href: ({ reportId, source }) =>
      `/tools/physiognomy?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'palmistry',
    label: '手相报告',
    short: '手相',
    desc: '三线节奏',
    href: ({ reportId, source }) =>
      `/tools/palmistry?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'fengshui',
    label: '空间场',
    short: '空间',
    desc: '人宅合参',
    href: ({ reportId, source }) =>
      `/tools/fengshui-space?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'hehun',
    label: '合婚双盘',
    short: '合婚',
    desc: '关系节奏',
    href: ({ reportId, source }) =>
      `/hehun?source=${encodeURIComponent(source)}&reportId=${encodeURIComponent(reportId)}`,
  },
];

export function ReportToolsStrip({
  reportId,
  yongShen,
  dayMaster,
  source = 'report_tools_strip',
  className = '',
  compact = false,
}: Props) {
  const track = (toolId: string) => {
    void trackClientEvent({
      eventName: 'result_cta_clicked',
      page: typeof window !== 'undefined' ? window.location.pathname : `/result/${reportId}`,
      meta: {
        target: `report_tool_${toolId}`,
        source,
        reportId,
        toolId,
      },
    });
    void trackClientEvent({
      eventName: 'tool_entry_clicked',
      page: typeof window !== 'undefined' ? window.location.pathname : `/result/${reportId}`,
      meta: {
        toolId,
        source,
        reportId,
      },
    });
  };

  return (
    <section
      id="report-tools"
      className={`scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] shadow-[var(--shadow-card)] ${
        compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            继续探索
          </div>
          <h2 className="mt-0.5 text-[14px] font-bold text-[color:var(--ink-1)] sm:text-[15px]">
            基于这份报告，下一步
          </h2>
          <p className="mt-0.5 text-[11px] text-[color:var(--ink-3)] sm:text-[12px]">
            {dayMaster ? `日主 ${dayMaster}` : '已绑定命盘'}
            {yongShen?.length ? ` · 用神 ${yongShen.join('、')}` : ''}
            <span className="hidden sm:inline"> · 工具尽量复用本报告</span>
          </p>
        </div>
        <Link
          href={`/analyze?source=${encodeURIComponent(source)}_reanalyze`}
          className="text-[12px] font-semibold text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          再排一盘
        </Link>
      </div>

      {/* Mobile: horizontal chips（优先起名/顾问） */}
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
        {TOOLS.map((t) => {
          const href = t.href({ reportId, source });
          return (
            <Link
              key={t.id}
              href={href}
              onClick={() => track(t.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold no-underline ${
                t.priority
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-[color:var(--hairline-strong)] bg-[color:var(--bg)] text-[color:var(--ink-2)]'
              }`}
            >
              {t.short}
            </Link>
          );
        })}
      </div>

      {/* Desktop / tablet: grid cards */}
      <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const href = t.href({ reportId, source });
          return (
            <Link
              key={t.id}
              href={href}
              onClick={() => track(t.id)}
              className="group rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-2.5 no-underline transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]"
            >
              <div className="text-[13px] font-bold text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                {t.label}
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">{t.desc}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
