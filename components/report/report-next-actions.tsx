'use client';

import { ArrowRight, Bot, CalendarPlus, CheckCircle2, Layers3 } from 'lucide-react';
import ResultCtaLink from '@/components/result-cta-link';

interface ReportNextActionsProps {
  reportId: string;
  chatHref: string;
  eventsHref: string;
  deepReportHref?: string;
  toolHref?: string;
  actionSuggestionCount: number;
  pastEventTemplateCount: number;
  followupQuestion?: string;
  title?: string;
  description?: string;
  deepReportLabel?: string;
  toolLabel?: string;
  chatLabel?: string;
  eventLabel?: string;
  pastEventLabel?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}

export default function ReportNextActions({
  reportId,
  chatHref,
  eventsHref,
  deepReportHref,
  toolHref,
  actionSuggestionCount,
  pastEventTemplateCount,
  followupQuestion,
  title,
  description,
  deepReportLabel,
  toolLabel,
  chatLabel,
  eventLabel,
  pastEventLabel,
  ctaStrategyKey,
  sourceFamily,
}: ReportNextActionsProps) {
  return (
    <section className="soft-card rounded-[1.35rem] p-4 md:p-5" aria-label="报告下一步动作">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">报告之后只走三步</div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">{title || '先读总览，再深问，再进入专项工具'}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {description || '不要一次展开所有内容。先确认首份报告的主判断，再用 LLM 追问最卡的一件事，最后只进入一个最相关的专项工具。'}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          {`动作 ${actionSuggestionCount > 0 ? actionSuggestionCount : 1} · 印证 ${pastEventTemplateCount}`}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {deepReportHref ? (
          <div className="rounded-[1.1rem] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/70 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              <Layers3 className="h-4 w-4" />
              第一步：进入深入报告
            </div>
            <div className="mt-2 text-xs leading-6 text-[color:var(--accent-strong)]">
              先把首份报告的主线读清楚，再展开深入层，避免把所有判断一次性塞进一个结果页。
            </div>
            <ResultCtaLink
              href={deepReportHref}
              page={`/result/${reportId}`}
              target="result_top_deep_report"
              className="action-primary action-main mt-4 justify-between"
              meta={{
                reportId,
                source: 'report_next_actions',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              {deepReportLabel || '继续看深入报告'}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
          </div>
        ) : null}

        <div className="rounded-[1.1rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Bot className="h-4 w-4 text-[color:var(--accent-strong)]" />
            第二步：追问一件事
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
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {chatLabel || '去 AI 深问这份报告'}
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[1.1rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            第三步：只进一个专项
          </div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            等主线和追问明确后，再进入最相关的单项工具，不要同时跑太多工具。
          </div>
          <ResultCtaLink
            href={toolHref || '/tools'}
            page={`/result/${reportId}`}
            target="result_top_primary_tool"
            className="action-secondary mt-4 justify-between"
            meta={{
              reportId,
              source: 'report_next_actions',
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {toolLabel || '进入专项工具'}
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[1.1rem] border border-[color:var(--line)] bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <CalendarPlus className="h-4 w-4 text-[color:var(--warm)]" />
            同时沉淀一个现实节点
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
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {eventLabel || '去事件页继续记录'}
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4 lg:col-span-2">
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
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {pastEventLabel || '直接去标记过去事件'}
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
        </div>
      </div>
    </section>
  );
}
