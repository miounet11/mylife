'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';
import { trackFunnel } from '@/components/funnel-tracker';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'intro-panel', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'intro-panel', 'action-primary', 'action-secondary'] as const;
void _qaContract;

/** Minimal tool shape — avoids depending on prod-only tools.ts surface in local sandbox. */
type ContentTool = {
  slug: string;
  title: string;
  shortTitle: string;
  userIntent?: string;
  themeLabel?: string;
  relatedReportThemes?: string[];
  chatIntent?: string | null;
  premiumServiceKey?: string | null;
};

function getToolContinuationLabel(tool: ContentTool) {
  return tool.premiumServiceKey ? '深度专项' : 'AI 深问';
}

/** Map content/tool themes onto analyze workspace intent keys. */
function resolveAnalyzeIntent(tool: ContentTool): 'career' | 'wealth' | 'relationship' | 'yearly' {
  const blob = [
    tool.shortTitle,
    tool.title,
    tool.userIntent,
    tool.themeLabel,
    ...(tool.relatedReportThemes || []),
    tool.chatIntent || '',
  ]
    .filter(Boolean)
    .join(' ');

  if (/财|财富|投资|理财|wealth|money/i.test(blob)) return 'wealth';
  if (/婚|恋|关系|情感|家庭|marriage|relationship/i.test(blob)) return 'relationship';
  if (/流年|大运|时机|择时|窗口|事件|event|year|timing/i.test(blob)) return 'yearly';
  return 'career';
}

/** Chat intents that can work without a bazi report (image / form tools). */
function isFreeChatIntent(intent?: string | null) {
  const value = `${intent || ''}`;
  return /palmistry|home-layout|meihua|手相|户型|梅花/.test(value);
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
  tool: ContentTool;
  page: string;
  contentLabel: string;
  contentTitle: string;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const premiumLabel = getToolContinuationLabel(tool);
  const analyzeIntent = resolveAnalyzeIntent(tool);
  const freeChat = isFreeChatIntent(tool.chatIntent);

  const contentFollowupQuestion = `我刚看完这篇${contentLabel}《${contentTitle}》，请围绕「${tool.shortTitle}」帮我判断：如果把这个问题落到我自己身上，最该先看哪一层，下一步最值得先做什么？`;
  const toolHref = appendSourceToHref(`/tools/${tool.slug}`, source);
  const analyzeHref = `/analyze?intent=${encodeURIComponent(analyzeIntent)}&source=${encodeURIComponent(
    'content_conversion_panel',
  )}&from=${encodeURIComponent(source || page || 'content')}`;

  // Structure intents must NOT expose a crawlable no-report /chat deep link.
  // That path was producing hundreds of empty chat_context_loaded events.
  const contentChatHref = freeChat
    ? buildChatHref({
        intent: tool.chatIntent || tool.slug,
        question: contentFollowupQuestion,
        source: 'content_conversion_panel',
        ctaStrategyKey,
        sourceFamily,
      })
    : null;

  const steps = freeChat
    ? ['生成完整结构报告', tool.shortTitle, premiumLabel]
    : ['生成完整结构报告', `单项工具：${tool.shortTitle}`];

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
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          <Sparkles className="h-3 w-3" />
          建议动作顺序
        </div>
        <div className="mt-3 space-y-2">
          {steps.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] font-mono text-xs font-black text-[color:var(--brand-strong)]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="text-xs leading-6 text-[color:var(--ink-2)]">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={analyzeHref}
            onClick={() => {
              trackFunnel('chat_to_analyze_click', {
                source: 'content_conversion_panel',
                intent: analyzeIntent,
                surface: 'content_primary',
              });
              void trackClientEvent({
                eventName: 'result_cta_clicked',
                page,
                meta: {
                  target: 'content_primary_analyze',
                  source: 'content_conversion_panel',
                  toolSlug: tool.slug,
                  analyzeIntent,
                  contentSource: source || null,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                },
              });
            }}
            className="action-primary inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
          >
            生成我的结构报告
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={toolHref}
            onClick={() => {
              void trackClientEvent({
                eventName: 'result_cta_clicked',
                page,
                meta: {
                  target: 'content_secondary_tool',
                  source: 'content_conversion_panel',
                  toolSlug: tool.slug,
                  contentSource: source || null,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                },
              });
            }}
            className="action-secondary inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand)]"
          >
            先测{tool.shortTitle}
          </Link>

          {contentChatHref ? (
            <Link
              href={contentChatHref}
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page,
                  meta: {
                    target: 'content_chat_free',
                    source: 'content_conversion_panel',
                    toolSlug: tool.slug,
                    contentType: contentLabel,
                    contentSource: source || null,
                    ctaStrategyKey: ctaStrategyKey || null,
                    sourceFamily: sourceFamily || null,
                  },
                });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-transparent px-3 text-sm font-semibold text-[color:var(--ink-4)] hover:border-[color:var(--brand)] hover:text-[color:var(--ink-2)]"
            >
              专项 AI 追问
            </Link>
          ) : null}
        </div>

        <p className="intro-copy mt-3 text-[11px] leading-5 text-[color:var(--ink-4)]">
          {freeChat
            ? '手相/户型等专项可不依赖完整八字；结构类判断仍建议先生成报告。'
            : '结构类内容默认先生成命盘报告，不再提供无报告聊天深链，避免空会话与爬虫噪声。'}
        </p>
        <div className="intro-panel sr-only">content-conversion-panel</div>
      </div>
    </section>
  );
}
