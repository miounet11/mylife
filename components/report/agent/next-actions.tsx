'use client';

import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';
import type { MergedAgentResults } from '@/lib/agentic-report/types';
import { buildReportContinueChatHref } from '@/lib/chat-entry';

function collectActions(merged: MergedAgentResults): string[] {
  const actions: string[] = [];
  for (const value of Object.values(merged.merged)) {
    if (value && typeof value === 'object' && Array.isArray((value as { actions?: string[] }).actions)) {
      for (const item of (value as { actions: string[] }).actions) {
        if (item && !actions.includes(item)) actions.push(item);
      }
    }
  }
  const strategy = merged.merged.strategy_advisor as {
    topPriority?: string;
    avoidNow?: string;
    actions?: string[];
  } | undefined;
  if (strategy?.topPriority) actions.unshift(strategy.topPriority);
  return actions.slice(0, 5);
}

export default function ReportNextActions({
  reportId,
  merged,
}: {
  reportId: string;
  merged: MergedAgentResults;
}) {
  const actions = collectActions(merged);
  const fallback = [
    '先确认本次报告最想解决的问题是否匹配你的现实处境。',
    '把一项可验证的事件记入事件日历，用于后续回测。',
    '用结构追问把结论拆成更具体的行动顺序。',
  ];
  const items = actions.length ? actions : fallback;

  return (
    <section id="actions" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader title="下一步动作" description="把判断落成可执行的三步顺序。" />
      <ol className="mt-3 space-y-2 text-[13px] text-[color:var(--ink-3)]">
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2"
          >
            {index + 1}. {item}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildReportContinueChatHref({ reportId: reportId, source: 'result_actions', teacher: 'overview' })}
          className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline"
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          继续追问
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          className="fb-btn h-9 px-4 text-[13px] hover:no-underline"
        >
          记录事件
        </Link>
      </div>
    </section>
  );
}