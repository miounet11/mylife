'use client';

import { ArrowRight, Bot, CalendarPlus, CheckCircle2 } from 'lucide-react';
import ResultCtaLink from '@/components/result-cta-link';

interface ReportNextActionsProps {
  reportId: string;
  chatHref: string;
  eventsHref: string;
  actionSuggestionCount: number;
  pastEventTemplateCount: number;
  followupQuestion?: string;
}

export default function ReportNextActions({
  reportId,
  chatHref,
  eventsHref,
  actionSuggestionCount,
  pastEventTemplateCount,
  followupQuestion,
}: ReportNextActionsProps) {
  return (
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="报告下一步动作">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">下一步不要靠记忆</div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">先追问，再沉淀，再回头印证</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            真正让这份报告变得有用的，不是多看一遍，而是把当前疑问追下去，把关键节点存下来，再用真实事件回头校正。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            {`可直接追问 ${actionSuggestionCount > 0 ? actionSuggestionCount : 1} 个动作点`}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            {`可回看 ${pastEventTemplateCount} 个过去印证点`}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.35rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Bot className="h-4 w-4 text-[color:var(--accent-strong)]" />
            先追问这份报告
          </div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            {followupQuestion
              ? '系统已经替你准备好第一句追问，点进去就能直接接着这份报告往下拆。'
              : '把最卡的一件事继续问深，不要让报告停在“看懂了”，而是推进到“知道下一步怎么做”。'}
          </div>
          <ResultCtaLink
            href={chatHref}
            page={`/result/${reportId}`}
            target="result_top_followup_chat"
            className="action-primary action-main mt-4 justify-between"
            meta={{
              reportId,
              source: 'report_next_actions',
            }}
          >
            去 AI 深问这份报告
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[1.35rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <CalendarPlus className="h-4 w-4 text-[color:var(--warm)]" />
            记录接下来会发生的节点
          </div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            先把一个关键动作或窗口存成事件，后面你才能知道这份判断到底准在什么地方、偏在什么地方。
          </div>
          <ResultCtaLink
            href={eventsHref}
            page={`/result/${reportId}`}
            target="result_top_followup_event"
            className="action-secondary mt-4 justify-between"
            meta={{
              reportId,
              source: 'report_next_actions',
            }}
          >
            去事件页继续记录
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4" />
            回看过去是否已经发生过
          </div>
          <div className="mt-2 text-xs leading-6 text-emerald-800">
            如果报告里提到的过去节点你已经经历过，尽快标记出来。这比继续看更多描述更能提高后续判断质量。
          </div>
          <ResultCtaLink
            href="#result-event-capture"
            page={`/result/${reportId}`}
            target="result_top_followup_past_event"
            className="action-secondary mt-4 justify-between border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
            meta={{
              reportId,
              source: 'report_next_actions',
            }}
          >
            直接去标记过去事件
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>
      </div>
    </section>
  );
}
