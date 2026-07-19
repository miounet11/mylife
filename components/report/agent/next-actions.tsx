'use client';

import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';
import type { MergedAgentResults } from '@/lib/agentic-report/types';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportNextActionsCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

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
  locale: localeProp,
}: {
  reportId: string;
  merged: MergedAgentResults;
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportNextActionsCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));
  const actions = collectActions(merged);
  const items = actions.length ? actions : copy.fallbacks;

  return (
    <section id="actions" className="fb-card scroll-mt-header p-4 md:p-6">
      <SectionHeader title={copy.title} description={copy.description} />
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
          {copy.consultantOpening}
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          className="fb-btn h-9 px-4 text-[13px] hover:no-underline"
        >
          {copy.logEvents}
        </Link>
      </div>
    </section>
  );
}
