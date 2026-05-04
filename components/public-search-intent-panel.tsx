'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Search, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { appendSourceToHref } from '@/lib/source-url';

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
      helper: '把搜索里的泛问题转成你的个人结构判断。',
    },
    toolHref ? {
      href: appendSourceToHref(toolHref, source),
      label: toolLabel || '直接进对应工具',
      tone: 'secondary' as const,
      target: 'search_intent_tool',
      helper: '如果你的问题已经非常具体，直接进入对应工具更快。',
    } : null,
    caseHref ? {
      href: appendSourceToHref(caseHref, source),
      label: caseLabel || '看相近案例',
      tone: 'secondary' as const,
      target: 'search_intent_case',
      helper: '先看别人怎么落地，再回来判断自己。',
    } : null,
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    tone: 'primary' | 'secondary';
    target: string;
    helper: string;
  }>;

  return (
    <section className="product-panel-strong overflow-hidden p-5 md:p-6">
      <div className="section-label">
        <Search className="h-3.5 w-3.5" />
        搜索意图承接
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h2 className="text-2xl font-black text-[color:var(--ink)] md:text-3xl">
            你现在搜索的，
            <span className="font-serif text-[color:var(--accent-strong)]">其实不是一篇文章，而是一个要落到自己身上的判断。</span>
          </h2>
          <div className="intro-copy mt-3 text-sm text-[color:var(--muted)]">
            当前页面主要回答「{queryIntent}」这类搜索问题，但真正有价值的下一步，通常不是继续泛读，而是把这套结构带进自己的报告、工具和案例验证里。
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.35rem] bg-white/84 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Sparkles className="h-4 w-4 text-[color:var(--accent-strong)]" />
                先理解
              </div>
              <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{title}</div>
            </div>
            <div className="rounded-[1.35rem] bg-white/84 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4 text-[color:var(--accent-strong)]" />
                再落自己
              </div>
              <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">先有个人底盘，后续追问和提醒才真正有用。</div>
            </div>
            <div className="rounded-[1.35rem] bg-white/84 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)]" />
                形成动作
              </div>
              <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">结果页、工具、事件验证和 AI 追问才是留存核心。</div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">推荐下一步</div>
          <div className="mt-4 grid gap-3">
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
                className={action.tone === 'primary' ? 'action-primary justify-between' : 'action-secondary justify-between'}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <div className="mt-4 text-xs leading-6 text-[color:var(--muted)]">
            当前公开流量更容易停在阅读层。把搜索意图直接带进个人分析与后续动作，才会明显改善用户停留、回访和复用。
          </div>
        </div>
      </div>
    </section>
  );
}
