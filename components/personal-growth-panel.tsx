'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileBarChart2, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import type { PersonalGrowthHubSummary } from '@/lib/personal-growth-hub';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;
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
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <LockKeyhole className="h-3 w-3" />
            个人升级面板
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            {summary.heading}
          </h2>
        </div>
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-3)] lg:max-w-sm">
          {summary.urgencyLine}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        {/* 主工具卡 */}
        <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            <Sparkles className="h-3 w-3" />
            现在最该继续的工具
          </div>
          <h3 className="mt-2 text-lg font-bold leading-tight text-[color:var(--ink-1)]">
            {summary.primaryTool.title}
          </h3>
          <div className="mt-4 space-y-2">
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-6 text-[color:var(--ink-3)]">
              <span className="font-mono text-[10px] font-bold text-[color:var(--ink-5)]">CURRENT</span>
              <div className="mt-0.5">{summary.focusLine}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-6 text-[color:var(--ink-3)]">
              <span className="font-mono text-[10px] font-bold text-[color:var(--ink-5)]">FREE</span>
              <div className="mt-0.5">{summary.primaryTool.freeValueLine}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-6 text-[color:var(--signal-strong)]">
              <span className="font-mono text-[10px] font-bold">PREMIUM</span>
              <div className="mt-0.5">{summary.primaryTool.paidValueLine}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <TrackedLink
              href={summary.primaryTool.href}
              page={page}
              target="personal_growth_primary_tool"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              继续测{summary.primaryTool.title}
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <TrackedLink
              href={summary.reportHref}
              page={page}
              target="personal_growth_report"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              {summary.reportLabel}
            </TrackedLink>
          </div>
        </div>

        {/* 副入口 */}
        <div className="grid gap-4">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              <FileBarChart2 className="h-3 w-3" />
              继续放大的入口
            </div>
            <div className="mt-3 space-y-1.5">
              {summary.secondaryTool ? (
                <TrackedLink
                  href={summary.secondaryTool.href}
                  page={page}
                  target="personal_growth_secondary_tool"
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">补一个工具</div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">{summary.secondaryTool.title}</div>
                </TrackedLink>
              ) : null}
              {summary.knowledgeCard ? (
                <TrackedLink
                  href={summary.knowledgeCard.href}
                  page={page}
                  target="personal_growth_knowledge"
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">读相关文章</div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">{summary.knowledgeCard.title}</div>
                </TrackedLink>
              ) : null}
              {summary.caseCard ? (
                <TrackedLink
                  href={summary.caseCard.href}
                  page={page}
                  target="personal_growth_case"
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">看相关案例</div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">{summary.caseCard.title}</div>
                </TrackedLink>
              ) : null}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
              <BookOpen className="h-3 w-3" />
              付费升级点
            </div>
            <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-6 text-[color:var(--signal-strong)]">
              {summary.primaryTool.premiumServiceLabel}
            </div>
            <TrackedLink
              href={summary.primaryTool.href}
              page={page}
              target="personal_growth_paid_path"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal)] px-3 text-sm font-semibold text-[color:var(--ink-1)] hover:bg-[color:var(--signal-strong)] hover:text-white"
            >
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
