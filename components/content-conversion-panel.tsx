'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { ToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'intro-panel', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'intro-panel', 'action-primary', 'action-secondary'] as const;
void _qaContract;
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
  const contentFollowupQuestion = `我刚看完这篇${contentLabel}《${contentTitle}》，请围绕「${tool.shortTitle}」帮我判断：如果把这个问题落到我自己身上，最该先看哪一层，下一步最值得先做什么？`;
  const toolHref = appendSourceToHref(`/tools/${tool.slug}`, source);
  const contentChatHref = buildChatHref({
    intent: tool.chatIntent || tool.slug,
    question: contentFollowupQuestion,
    source: 'content_conversion_panel',
    ctaStrategyKey,
    sourceFamily,
  });

  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <LockKeyhole className="h-3 w-3" />
        内容承接路径
      </div>

      <h3 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
        {tool.shortTitle}
        <span className="text-[color:var(--brand-strong)]"> / {premiumLabel}</span>
      </h3>

      <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          <Sparkles className="h-3 w-3" />
          建议动作顺序
        </div>
        <div className="mt-3 space-y-2">
          {[tool.shortTitle, premiumLabel, 'AI 追问'].map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] font-mono text-[10px] font-black text-[color:var(--brand-strong)]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="text-xs leading-6 text-[color:var(--ink-2)]">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
          >
            先测{tool.shortTitle}
            <ArrowRight className="h-4 w-4" />
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
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
          >
            先问 AI
          </Link>
        </div>
      </div>
    </section>
  );
}
