'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import NewsletterSignup from '@/components/newsletter-signup';
import type { ToolDefinition, ToolPremiumOffer } from '@/lib/tools';

export default function ToolPremiumDepthPanel({
  tool,
  offer,
  reportId,
}: {
  tool: ToolDefinition;
  offer: ToolPremiumOffer;
  reportId?: string;
}) {
  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="section-label">
            <LockKeyhole className="h-3.5 w-3.5" />
            深测版
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
            免费版先给摘要，
            <span className="font-serif text-[color:var(--accent-strong)]">深测版再把这件事真正讲透。</span>
          </h2>
          <p className="intro-copy mt-4">{offer.teaser}</p>
          <div className="mt-4 rounded-[1.25rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
            {offer.upgradeMoment}
          </div>
          <p className="intro-copy mt-4">{offer.outcomeLine}</p>

          <div className="mt-5 grid gap-3">
            {offer.deliverables.map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-white/82 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={reportId ? `/chat?reportId=${encodeURIComponent(reportId)}&intent=${encodeURIComponent(tool.chatIntent || '')}` : '/chat'}
              className="action-primary"
            >
              继续追问
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/updates" className="action-secondary">进入更新中心</Link>
          </div>
        </div>

        <NewsletterSignup
          source={`tool_premium_${tool.slug}`}
          title={offer.ctaLabel}
          description={`订阅后，后续可以围绕 ${tool.shortTitle} 接收深测提醒、工具包推荐和阶段窗口变化。`}
        />
      </div>
    </section>
  );
}
