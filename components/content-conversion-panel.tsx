'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles, Target } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { ToolDefinition } from '@/lib/tools';

export default function ContentConversionPanel({
  tool,
  page,
  contentLabel,
  contentTitle,
}: {
  tool: ToolDefinition;
  page: string;
  contentLabel: string;
  contentTitle: string;
}) {
  const premiumLabel = getPremiumServiceLabel(tool.premiumServiceKey || 'event-verdict');

  return (
    <section className="product-panel-strong overflow-hidden p-5 md:p-6">
      <div className="section-label">
        <LockKeyhole className="h-3.5 w-3.5" />
        内容承接路径
      </div>

      <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">
        这篇{contentLabel}最该承接到的，
        <span className="font-serif text-[color:var(--accent-strong)]">是 {tool.shortTitle} 和后续 {premiumLabel}。</span>
      </h3>
      <p className="intro-copy mt-3">《{contentTitle}》已经帮你建立理解框架，下一步直接压进最相关的工具。</p>
      <div className="intro-panel mt-3">优先动作：先测工具，再决定是否进入更深专项。</div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Target className="h-4 w-4" />
            为什么先测这个
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              钩子：{tool.hook}
            </div>
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              免费层：{tool.freeValueLine}
            </div>
            <div className="rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-4 text-xs leading-6 text-[color:var(--accent-strong)]">
              付费点：{tool.paidValueLine}
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/84 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Sparkles className="h-4 w-4" />
            推荐动作顺序
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              1. 先做 {tool.shortTitle}，把这篇{contentLabel}里的抽象逻辑转成你的个人判断。
            </div>
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              2. 如果免费结果已经命中问题，再继续进入 {premiumLabel}。
            </div>
            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              3. 这篇{contentLabel}、工具结果和后续专项会自动关联，不需要重复交代背景。
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/tools/${tool.slug}`}
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page,
                  meta: {
                    target: 'content_primary_tool',
                    source: 'content_conversion_panel',
                    toolSlug: tool.slug,
                  },
                });
              }}
              className="action-primary"
            >
              先测{tool.shortTitle}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/chat?intent=${encodeURIComponent(tool.chatIntent || tool.slug)}`}
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page,
                  meta: {
                    target: 'content_chat_followup',
                    source: 'content_conversion_panel',
                    toolSlug: tool.slug,
                  },
                });
              }}
              className="action-secondary"
            >
              先问 AI 适不适合测这个
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
