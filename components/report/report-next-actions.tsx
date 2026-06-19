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
  const secondaryActions = [
    ...(deepReportHref
      ? [
          {
            key: 'deep-report',
            href: deepReportHref,
            target: 'result_top_deep_report',
            icon: Layers3,
            step: '02',
            title: deepReportLabel || '继续看深入报告',
            note: '证据细节',
          },
        ]
      : []),
    {
      key: 'tool',
      href: toolHref || '/tools',
      target: 'result_top_primary_tool',
      icon: CheckCircle2,
      step: '03',
      title: toolLabel || '进入专项工具',
      note: '只选一个',
    },
    {
      key: 'event',
      href: eventsHref,
      target: 'result_top_followup_event',
      icon: CalendarPlus,
      step: '+',
      title: eventLabel || '记录关键事件',
      note: '用于复盘',
    },
    {
      key: 'past-event',
      href: '#result-event-capture',
      target: 'result_top_followup_past_event',
      icon: CheckCircle2,
      step: '✓',
      title: pastEventLabel || '标记过去事件',
      note: '提高判断质量',
    },
  ];

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4"
      aria-label="报告下一步动作"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--brand-strong)]">
              报告之后只走三步
            </div>
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] px-2 font-mono text-xs font-semibold tabular-nums text-[color:var(--brand-strong)]">
              动作 {actionSuggestionCount > 0 ? actionSuggestionCount : 1} · 印证 {pastEventTemplateCount}
            </span>
          </div>

          <h3 className="mt-2 text-base font-bold leading-tight text-[color:var(--ink-1)] md:text-lg">
            {title || '先问深一件事，再看细节'}
          </h3>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[color:var(--brand-strong)]">
            {description || '别一次读完所有内容。先把当前最卡的一件事问清楚，再决定看深入报告、工具或事件验证。'}
          </p>

          <ResultCtaLink
            href={chatHref}
            page={`/result/${reportId}`}
            target="result_top_followup_chat"
            className="mt-4 inline-flex h-10 w-full items-center justify-between gap-1 rounded-[var(--radius-sm)] bg-[color:var(--brand-strong)] px-4 text-sm font-bold text-white transition hover:bg-[color:var(--brand-deep)] sm:w-auto sm:min-w-[220px]"
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

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--brand-strong)]">
            <Bot className="h-3.5 w-3.5" />
            {followupQuestion ? '已带报告上下文和第一句追问' : '进入后直接拆最卡的一件事'}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--ink-5)]">
            右区 · 可选路径
          </div>
          <div className="grid gap-2">
            {secondaryActions.map((item) => {
              const Icon = item.icon;
              return (
                <ResultCtaLink
                  key={item.key}
                  href={item.href}
                  page={`/result/${reportId}`}
                  target={item.target}
                  className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 transition hover:border-[color:var(--brand)] hover:bg-white"
                  meta={{
                    reportId,
                    source: 'report_next_actions',
                    ctaStrategyKey: ctaStrategyKey || null,
                    sourceFamily: sourceFamily || null,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] font-mono text-xs font-black text-[color:var(--brand-strong)]">
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[color:var(--ink-1)]">{item.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--ink-4)]">
                        <Icon className="h-3 w-3" />
                        {item.note}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)] transition group-hover:text-[color:var(--brand-strong)]" />
                </ResultCtaLink>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
