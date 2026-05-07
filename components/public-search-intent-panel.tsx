'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Search, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { appendSourceToHref } from '@/lib/source-url';

// 决策台风「搜索意图承接」面板
// 用于 /knowledge/[slug] 等 SEO 详情页底部，把搜索流量转向个人分析
export default function PublicSearchIntentPanel({
  page,
  title,
  queryIntent,
  analyzeHref = '/analyze',
  toolHref,
  caseHref,
  source,
  analyzeLabel,
  toolLabel,
  caseLabel,
  ctaStrategyKey,
  sourceFamily,
}: {
  page: string;
  title: string;
  queryIntent: string;
  analyzeHref?: string;
  toolHref?: string;
  caseHref?: string;
  source?: string;
  analyzeLabel?: string;
  toolLabel?: string;
  caseLabel?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const actions = [
    {
      href: appendSourceToHref(analyzeHref, source),
      label: analyzeLabel || '先测我的情况',
      tone: 'primary' as const,
      target: 'search_intent_analyze',
    },
    toolHref
      ? {
          href: appendSourceToHref(toolHref, source),
          label: toolLabel || '直接进对应工具',
          tone: 'secondary' as const,
          target: 'search_intent_tool',
        }
      : null,
    caseHref
      ? {
          href: appendSourceToHref(caseHref, source),
          label: caseLabel || '看相近案例',
          tone: 'secondary' as const,
          target: 'search_intent_case',
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    tone: 'primary' | 'secondary';
    target: string;
  }>;

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Search className="h-3 w-3" />
        搜索意图承接
      </div>

      <div className="mt-3 grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <div>
          <h2 className="text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
            你现在搜索的，<br />
            <span className="text-[color:var(--brand-strong)]">其实是一个要落到自己身上的判断。</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
            当前页面主要回答「{queryIntent}」这类搜索问题；真正有价值的下一步是把这套结构带进自己的报告、工具与案例验证。
          </p>

          <div className="mt-5 grid gap-2 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                <span>01</span>
                <Sparkles className="h-3 w-3" />
                先理解
              </div>
              <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">{title}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                <span>02</span>
                <Compass className="h-3 w-3" />
                再落自己
              </div>
              <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                先有个人底盘，后续追问和提醒才真正有用。
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                <span>03</span>
                <ArrowRight className="h-3 w-3" />
                形成动作
              </div>
              <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                结果页、工具、事件验证和 AI 追问才是留存核心。
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            推荐下一步
          </div>
          <div className="mt-3 space-y-2">
            {actions.map((action) => (
              <Link
                key={action.target}
                href={action.href}
                onClick={() => {
                  void trackClientEvent({
                    eventName: 'result_cta_clicked',
                    page,
                    meta: {
                      target: action.target,
                      source: 'public_search_intent_panel',
                      attributionSource: source || null,
                      ctaStrategyKey: ctaStrategyKey || null,
                      sourceFamily: sourceFamily || null,
                    },
                  });
                }}
                className={
                  action.tone === 'primary'
                    ? 'flex h-10 items-center justify-between rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]'
                    : 'flex h-10 items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-4 text-sm font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)]'
                }
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
