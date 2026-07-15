'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Quote, Star, UserRound } from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';
import {
  EXPERT_ENDORSEMENTS,
  USER_REVIEWS,
  reviewTimeLabel,
  starsLabel,
  type ExpertEndorsement,
  type UserReview,
} from '@/lib/social-proof';
import { cn } from '@/lib/utils';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[color:var(--brand-strong)]" aria-label={`${rating} 星`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn('h-3 w-3', index < rating ? 'fill-current' : 'opacity-25')}
          strokeWidth={1.75}
        />
      ))}
    </span>
  );
}

function ExpertCard({ item }: { item: ExpertEndorsement }) {
  return (
    <article className="fb-card flex h-full flex-col p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--brand-strong)]">
          <BadgeCheck className="h-3 w-3" />
          专家推荐
        </div>
        <Stars rating={item.rating} />
      </div>
      <Quote className="mt-3 h-4 w-4 text-[color:var(--brand)] opacity-70" />
      <p className="mt-2 flex-1 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">“{item.quote}”</p>
      <div className="mt-4 border-t border-[color:var(--hairline)] pt-3">
        <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">{item.name}</div>
        <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">
          {item.title} · {item.org}
        </div>
        <div className="mt-1.5 text-[11px] font-medium text-[color:var(--brand-strong)]">{item.focus}</div>
      </div>
    </article>
  );
}

function ReviewCard({ item }: { item: UserReview }) {
  return (
    <article className="fb-card flex h-full flex-col p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--ink-3)]">
          <UserRound className="h-3.5 w-3.5 text-[color:var(--brand)]" />
          {item.scene}
        </div>
        <div className="text-[10px] text-[color:var(--ink-5)]">{reviewTimeLabel(item.daysAgo)}</div>
      </div>
      <p className="mt-3 flex-1 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">“{item.quote}”</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[color:var(--hairline)] pt-3">
        <div>
          <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">{item.name}</div>
          <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">
            {item.role} · {item.city}
          </div>
        </div>
        <Stars rating={item.rating} />
      </div>
    </article>
  );
}

export default function SocialProofPanel({
  className,
  expertLimit = 3,
  reviewLimit = 6,
}: {
  className?: string;
  expertLimit?: number;
  reviewLimit?: number;
}) {
  const [tab, setTab] = useState<'experts' | 'reviews'>('reviews');
  const experts = useMemo(() => EXPERT_ENDORSEMENTS.slice(0, expertLimit), [expertLimit]);
  const reviews = useMemo(() => USER_REVIEWS.slice(0, reviewLimit), [reviewLimit]);
  const avgRating = useMemo(() => {
    const all = [...EXPERT_ENDORSEMENTS, ...USER_REVIEWS];
    const sum = all.reduce((acc, item) => acc + item.rating, 0);
    return Math.round((sum / all.length) * 10) / 10;
  }, []);

  return (
    <section className={cn('space-y-3', className)} aria-label="专家推荐与用户评价">
      <SectionHeader
        eyebrow="口碑与推荐"
        title="专家怎么看 · 用户怎么说"
        description={`综合评分 ${avgRating} / 5 · ${starsLabel(Math.round(avgRating))} · 来自真实使用场景的反馈整理`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
            tab === 'reviews'
              ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
              : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)]',
          )}
        >
          用户评价 ({USER_REVIEWS.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('experts')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
            tab === 'experts'
              ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
              : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)]',
          )}
        >
          专家推荐 ({EXPERT_ENDORSEMENTS.length})
        </button>
      </div>

      {tab === 'experts' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {experts.map((item) => (
            <ExpertCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <p className="text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
        展示评价用于帮助新用户理解产品场景，内容经编辑整理；不构成投资、医疗、法律或录取承诺。
      </p>
    </section>
  );
}
