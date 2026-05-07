'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileBarChart2, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import type { PersonalGrowthHubSummary } from '@/lib/personal-growth-hub';

export default function PersonalGrowthPanel({
  summary,
  page,
}: {
  summary: PersonalGrowthHubSummary;
  page: string;
}) {
  if (!summary.primaryTool) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="section-label">
            <LockKeyhole className="h-3.5 w-3.5" />
            个人升级面板
          </div>
          <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)] md:text-3xl">{summary.heading}</h2>
        </div>
        <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm leading-6 text-[color:var(--ink)] lg:max-w-sm">
          <div className="intro-copy">{summary.urgencyLine}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Sparkles className="h-4 w-4" />
            现在最该继续的工具
          </div>
          <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{summary.primaryTool.title}</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm leading-6 text-[color:var(--ink)]">
              当前主线：{summary.focusLine}
            </div>
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm leading-6 text-[color:var(--ink)]">
              免费层先拿：{summary.primaryTool.freeValueLine}
            </div>
            <div className="rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--accent-strong)]">
              付费承接：{summary.primaryTool.paidValueLine}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedLink href={summary.primaryTool.href} page={page} target="personal_growth_primary_tool" className="action-primary">
              继续测{summary.primaryTool.title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
            <TrackedLink href={summary.reportHref} page={page} target="personal_growth_report" className="action-secondary">
              {summary.reportLabel}
            </TrackedLink>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <FileBarChart2 className="h-4 w-4" />
              继续放大的入口
            </div>
            <div className="mt-4 grid gap-3">
              {summary.secondaryTool ? (
                <TrackedLink href={summary.secondaryTool.href} page={page} target="personal_growth_secondary_tool" className="interactive-card rounded-[1.2rem] px-4 py-4 text-sm font-semibold text-[color:var(--ink)]">
                  补一个工具：{summary.secondaryTool.title}
                </TrackedLink>
              ) : null}
              {summary.knowledgeCard ? (
                <TrackedLink href={summary.knowledgeCard.href} page={page} target="personal_growth_knowledge" className="interactive-card rounded-[1.2rem] px-4 py-4 text-sm font-semibold text-[color:var(--ink)]">
                  读相关文章：{summary.knowledgeCard.title}
                </TrackedLink>
              ) : null}
              {summary.caseCard ? (
                <TrackedLink href={summary.caseCard.href} page={page} target="personal_growth_case" className="interactive-card rounded-[1.2rem] px-4 py-4 text-sm font-semibold text-[color:var(--ink)]">
                  看相关案例：{summary.caseCard.title}
                </TrackedLink>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <BookOpen className="h-4 w-4" />
              付费升级点
            </div>
            <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-4 text-sm text-[color:var(--accent-strong)]">
              {summary.primaryTool.premiumServiceLabel}
            </div>
            <TrackedLink href={summary.primaryTool.href} page={page} target="personal_growth_paid_path" className="action-secondary mt-4">
              从这个工具进入付费承接
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackedLink({
  href,
  className,
  children,
  page,
  target,
}: {
  href: string;
  className: string;
  children: ReactNode;
  page: string;
  target: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void trackClientEvent({
          eventName: 'result_cta_clicked',
          page,
          meta: {
            target,
            source: 'personal_growth_panel',
          },
        });
      }}
    >
      {children}
    </Link>
  );
}
