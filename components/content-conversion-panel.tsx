'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { ToolDefinition } from '@/lib/tools';

function getToolContinuationLabel(tool: ToolDefinition) {
  return tool.premiumServiceKey ? getPremiumServiceLabel(tool.premiumServiceKey) : 'AI 深问';
}

export default function ContentConversionPanel({
  tool,
  page,
  contentLabel,
  contentTitle,
  source,
  ctaStrategyKey,
  sourceFamily,
}: {
  tool: ToolDefinition;
  page: string;
  contentLabel: string;
  contentTitle: string;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const premiumLabel = getToolContinuationLabel(tool);
  const contentFollowupQuestion = `我刚看完这篇${contentLabel}《${contentTitle}》，请围绕“${tool.shortTitle}”帮我判断：如果把这个问题落到我自己身上，最该先看哪一层，下一步最值得先做什么？`;
  const toolHref = appendSourceToHref(`/tools/${tool.slug}`, source);
  const contentChatHref = buildChatHref({
    intent: tool.chatIntent || tool.slug,
    question: contentFollowupQuestion,
    source: 'content_conversion_panel',
    ctaStrategyKey,
    sourceFamily,
  });

  return (
    <section className="product-panel-strong overflow-hidden p-5 md:p-6">
      <div className="section-label">
        <LockKeyhole className="h-3.5 w-3.5" />
        内容承接路径
      </div>

      <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">
        {tool.shortTitle}
        <span className="font-serif text-[color:var(--accent-strong)]"> / {premiumLabel}</span>
      </h3>

      <div className="mt-5 rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
          <Sparkles className="h-4 w-4" />
          动作
        </div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
            1. {tool.shortTitle}
          </div>
          <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
            2. {premiumLabel}
          </div>
          <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
            3. AI 追问
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={toolHref}
            onClick={() => {
              void trackClientEvent({
                eventName: 'result_cta_clicked',
                page,
                meta: {
                  target: 'content_primary_tool',
                  source: 'content_conversion_panel',
                  toolSlug: tool.slug,
                  contentSource: source || null,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                },
              });
            }}
            className="action-primary"
          >
            先测{tool.shortTitle}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href={contentChatHref}
            onClick={() => {
              void trackClientEvent({
                eventName: 'result_cta_clicked',
                page,
                meta: {
                  target: 'content_chat_followup',
                  source: 'content_conversion_panel',
                  toolSlug: tool.slug,
                  contentType: contentLabel,
                  contentSource: source || null,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                },
              });
            }}
            className="action-secondary"
          >
            先问 AI
          </Link>
        </div>
      </div>
    </section>
  );
}
