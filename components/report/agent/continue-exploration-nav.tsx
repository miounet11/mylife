'use client';

import Link from 'next/link';
import { BookOpen, MessageSquareText, Wrench } from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';

export default function ReportContinueExplorationNav({ reportId }: { reportId: string }) {
  const items = [
    {
      href: `/chat?reportId=${encodeURIComponent(reportId)}&source=result_explore`,
      icon: MessageSquareText,
      title: '结构追问',
      description: '把结论拆成更具体的行动顺序。',
    },
    {
      href: '/learn',
      icon: BookOpen,
      title: '学习地图',
      description: '按事业、财富、关系主题继续深入。',
    },
    {
      href: '/tools',
      icon: Wrench,
      title: '工具中心',
      description: '用单项工具验证具体问题。',
    },
  ];

  return (
    <section className="fb-card p-5 md:p-6">
      <SectionHeader title="继续探索" description="报告是起点，不是终点。" />
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius)] border border-[color:var(--hairline)] p-3.5 transition hover:border-[color:var(--hairline-strong)] hover:bg-[color:var(--bg-sunken)]/40 hover:no-underline"
            >
              <Icon className="h-4 w-4 text-[color:var(--brand)]" strokeWidth={1.75} />
              <div className="mt-2.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
                {item.title}
              </div>
              <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-3)]">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}