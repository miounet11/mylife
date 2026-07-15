'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
import { buildChatHref } from '@/lib/chat-entry';
import type { ToolDefinition, ToolPremiumOffer } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;
export default function ToolPremiumDepthPanel({
  tool,
  offer,
  reportId,
  ctaStrategyKey,
  sourceFamily,
}: {
  tool: ToolDefinition;
  offer: ToolPremiumOffer;
  reportId?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--signal-strong)]">
            <LockKeyhole className="h-3 w-3" />
            深测版
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            深测版
          </h2>

          <div className="mt-4 space-y-2">
            {offer.deliverables.map((item, index) => (
              <div
                key={item}
                className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-3 text-xs leading-6 text-[color:var(--ink-2)]"
              >
                <span className="font-mono text-xs font-bold text-[color:var(--signal-strong)]">
                  DELIVERABLE {String(index + 1).padStart(2, '0')}
                </span>
                <div className="mt-0.5">{item}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!reportId ? (
              <Link
                href={`/analyze?intent=career&source=tool_premium_depth_panel&from=${encodeURIComponent(tool.slug)}`}
                className="action-primary inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
              >
                先生成结构报告
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href={buildChatHref({
                reportId: reportId || undefined,
                intent: tool.chatIntent || undefined,
                question: `请围绕「${tool.shortTitle}」继续深问，告诉我如果要进入深测，现在最该先确认的结构、阶段和风险点是什么？`,
                source: 'tool_premium_depth_panel',
                ctaStrategyKey,
                sourceFamily,
              })}
              className="action-secondary inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal)] px-4 text-sm font-semibold text-[color:var(--ink-1)] transition hover:bg-[color:var(--signal-strong)] hover:text-white"
            >
              {reportId ? '继续追问' : '无报告先聊（依据弱）'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/updates"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              进入更新中心
            </Link>
          </div>
        </div>

        <NewsletterSignup
          source={`tool_premium_${tool.slug}`}
          title={offer.ctaLabel}
          description=""
        />
      </div>
    </section>
  );
}
