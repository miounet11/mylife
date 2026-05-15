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
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      aria-label="报告下一步动作"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-strong)]">
            报告之后只走三步
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-tight text-[color:var(--ink-1)] md:text-lg">
            {title || '先读总览，再深问，再进入专项工具'}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[color:var(--ink-3)]">
            {description ||
              '不要一次展开所有内容。先确认首份报告的主判断，再追问最卡的一件事，最后只进入一个最相关的专项工具。'}
          </p>
        </div>
        <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 font-mono text-[10px] font-semibold tabular-nums text-[color:var(--ink-4)]">
          动作 {actionSuggestionCount > 0 ? actionSuggestionCount : 1} · 印证 {pastEventTemplateCount}
        </span>
      </div>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-4 py-3 lg:col-span-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--brand-strong)]">
            <Bot className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wider">01</span>
            继续追问这份报告
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--brand-strong)]">
            {followupQuestion
              ? '系统已经替你带上报告上下文和第一句追问，点进去直接拆最卡的一件事。'
              : '先把最卡的一件事问深，让报告从「看懂了」推进到「知道下一步」。'}
          </div>
          <ResultCtaLink
            href={chatHref}
            page={`/result/${reportId}`}
            target="result_top_followup_chat"
            className="mt-3 inline-flex h-9 w-full items-center justify-between gap-1 rounded-[var(--radius-sm)] bg-[color:var(--brand-strong)] px-3 text-sm font-bold text-white transition hover:bg-[color:var(--brand-deep)]"
            meta={{
              reportId,
              source: 'report_next_actions',
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {chatLabel || '继续追问这份报告'}
            <ArrowRight className="h-3.5 w-3.5" />
          </ResultCtaLink>
        </div>

        {deepReportHref ? (
          <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--ink-1)]">
              <Layers3 className="h-3.5 w-3.5 text-[color:var(--brand-strong)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-strong)]">02</span>
              展开深入报告
            </div>
            <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">
              主线不清楚时先追问；需要证据细节时再展开深入层。
            </div>
            <ResultCtaLink
              href={deepReportHref}
              page={`/result/${reportId}`}
              target="result_top_deep_report"
              className="mt-3 inline-flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-bold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
              meta={{
                reportId,
                source: 'report_next_actions',
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              {deepReportLabel || '继续看深入报告'}
              <ArrowRight className="h-3.5 w-3.5" />
            </ResultCtaLink>
          </div>
        ) : null}

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--ink-1)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--data-up)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-strong)]">03</span>
            只进一个专项
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">
            等主线和追问明确后，再进入最相关的单项工具。
          </div>
          <ResultCtaLink
            href={toolHref || '/tools'}
            page={`/result/${reportId}`}
            target="result_top_primary_tool"
            className="mt-3 inline-flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-bold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            meta={{
              reportId,
              source: 'report_next_actions',
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {toolLabel || '进入专项工具'}
            <ArrowRight className="h-3.5 w-3.5" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--ink-1)]">
            <CalendarPlus className="h-3.5 w-3.5 text-[color:var(--signal-strong)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-5)]">+</span>
            沉淀一个现实节点
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">
            把一个关键动作或窗口存成事件，后面你才能知道这份判断准在哪里。
          </div>
          <ResultCtaLink
            href={eventsHref}
            page={`/result/${reportId}`}
            target="result_top_followup_event"
            className="mt-3 inline-flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-bold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            meta={{
              reportId,
              source: 'report_next_actions',
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {eventLabel || '去事件页继续记录'}
            <ArrowRight className="h-3.5 w-3.5" />
          </ResultCtaLink>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.06)] px-4 py-3 lg:col-span-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--data-up)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            回看过去是否已经发生过
          </div>
          <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">
            如果报告里提到的过去节点你已经经历过，尽快标记出来。这比继续看更多描述更能提高后续判断质量。
          </div>
          <ResultCtaLink
            href="#result-event-capture"
            page={`/result/${reportId}`}
            target="result_top_followup_past_event"
            className="mt-3 inline-flex h-8 items-center justify-between gap-1 rounded-[var(--radius-sm)] border border-[color:var(--data-up)] bg-[color:var(--paper)] px-3 text-xs font-bold text-[color:var(--data-up)] transition hover:bg-[rgba(47,125,82,0.10)]"
            meta={{
              reportId,
              source: 'report_next_actions',
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {pastEventLabel || '直接去标记过去事件'}
            <ArrowRight className="h-3.5 w-3.5" />
          </ResultCtaLink>
        </div>
      </div>
    </section>
  );
}
