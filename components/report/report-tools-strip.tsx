'use client';

/**
 * 报告结果页 · 工具分发条
 * 把已完成报告用户导流到起名 / 面相 / 手相 / 空间场 / 合婚 / 顾问
 * 样式：全站 Linear 浅色，无彩虹壳
 */

import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  reportId: string;
  /** 用神，便于起名 deep link 提示 */
  yongShen?: string[];
  dayMaster?: string;
  source?: string;
  className?: string;
};

const TOOLS: Array<{
  href: (ctx: { reportId: string; source: string }) => string;
  label: string;
  desc: string;
  id: string;
}> = [
  {
    id: 'naming',
    label: '起名工坊',
    desc: '用神 · 康熙 · 个人/公司',
    href: ({ reportId, source }) =>
      `/tools/naming?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'physiognomy',
    label: '面相报告',
    desc: '先物理 · 再命理交叉',
    href: ({ reportId, source }) =>
      `/tools/physiognomy?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'palmistry',
    label: '手相报告',
    desc: '三线结构 · 节奏交叉',
    href: ({ reportId, source }) =>
      `/tools/palmistry?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'fengshui',
    label: '空间场',
    desc: '户型 · 人宅合参',
    href: ({ reportId, source }) =>
      `/tools/fengshui-space?source=${encodeURIComponent(source)}&fortuneId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'hehun',
    label: '合婚双盘',
    desc: '关系节奏对照',
    href: ({ reportId, source }) =>
      `/hehun?source=${encodeURIComponent(source)}&reportId=${encodeURIComponent(reportId)}`,
  },
  {
    id: 'chat',
    label: '问顾问',
    desc: '带报告上下文深问',
    href: ({ reportId, source }) =>
      `/chat?mode=opening&source=${encodeURIComponent(source)}&reportId=${encodeURIComponent(reportId)}`,
  },
];

export function ReportToolsStrip({
  reportId,
  yongShen,
  dayMaster,
  source = 'report_tools_strip',
  className = '',
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
      className={`scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            继续探索
          </div>
          <h2 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)]">
            基于这份报告，下一步可以做什么
          </h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
            {dayMaster ? `日主 ${dayMaster}` : '已绑定命盘'}
            {yongShen?.length ? ` · 用神 ${yongShen.join('、')}` : ''}
            {' · '}
            工具会尽量复用本报告，无需重填生辰
          </p>
        </div>
        <Link
          href={`/analyze?source=${encodeURIComponent(source)}_reanalyze`}
          className="text-[12px] font-semibold text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          再排一盘
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const href = t.href({ reportId, source });
          return (
            <Link
              key={t.id}
              href={href}
              onClick={() => track(t.id)}
              className="group rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 py-3 no-underline transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]"
            >
              <div className="text-[13px] font-bold text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                {t.label}
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">{t.desc}</div>
              <div className="mt-1.5 text-[11px] font-semibold text-[color:var(--brand)]">打开 →</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
