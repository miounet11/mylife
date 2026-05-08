import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import type { PremiumServiceOffer } from '@/lib/report-premium-services';
import ResultCtaLink from '@/components/result-cta-link';

// v5-D1 (2026-05-08) 决策台风专项服务 teaser
// 位置：结果页 cockpit 之后、downstream 章节之前
// 目的：在用户第一次看完核心判断时，给一个「如果想深挖这件事」的入口
//      不是弹窗、不是推广——是决策台对用户此刻最可能关心的问题给出一个定向推荐
//
// 选中逻辑（caller 负责）：
//   - 若 scenario caution 存在 → event-verdict（需要倾向判断）
//   - 若 correction level=action → event-review（有偏差要复盘）
//   - 若有明确近期窗口 → event-simulation（可以推演）
//   - 否则不渲染（宁缺勿滥）

type PremiumTeaserProps = {
  reportId: string;
  offer: PremiumServiceOffer | null;
  // 用于定位到完整 premium 面板的锚
  anchorHref?: string;
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
};

export default function PremiumTeaser({
  reportId,
  offer,
  anchorHref = '#premium',
  ctaStrategyKey,
  sourceFamily,
}: PremiumTeaserProps) {
  if (!offer) return null;

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] p-4 md:p-5"
      data-premium-teaser={offer.key}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--paper)] text-[color:var(--signal-strong)]">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--paper)] px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
              {offer.badge}
            </span>
            <h3 className="text-base font-black text-[color:var(--ink-1)]">{offer.title}</h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
            {offer.tagline}
          </p>

          <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
            <span className="font-mono font-bold text-[color:var(--signal-strong)]">SIGNAL</span>{' '}
            {offer.featuredSignal}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <ResultCtaLink
              href={anchorHref}
              page={`/result/${reportId}`}
              target={`result_premium_teaser:${offer.key}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal-strong)] px-3 text-xs font-semibold text-white hover:opacity-90"
              meta={{
                reportId,
                source: 'result_premium_teaser',
                offerKey: offer.key,
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              看看是否适合我
              <ArrowRight className="h-3.5 w-3.5" />
            </ResultCtaLink>
            <Link
              href={anchorHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              查看全部 4 项专项
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
