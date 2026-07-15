'use client';

import { Flame, Megaphone, Newspaper, TrendingUp } from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';
import {
  HEAT_TOPICS,
  MEDIA_HEAT_METRICS,
  MEDIA_MENTIONS,
} from '@/lib/media-heat';
import { cn } from '@/lib/utils';

function HeatBar({ value }: { value: number }) {
  const width = Math.max(8, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[color:var(--brand)] to-orange-400"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function MediaHeatPanel({ className }: { className?: string }) {
  return (
    <section className={cn('space-y-3', className)} aria-label="媒体与热度">
      <SectionHeader
        eyebrow="媒体与热度"
        title="人生K线正在被讨论"
        description="精选专栏、社群与话题热度（编辑整理，用于展示产品关注度）"
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MEDIA_HEAT_METRICS.map((metric) => (
          <div
            key={metric.key}
            className="fb-card border-[color:var(--brand-soft-2)] bg-gradient-to-br from-[color:var(--brand-soft)]/30 to-[color:var(--paper)] p-3.5"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
              <TrendingUp className="h-3.5 w-3.5 text-[color:var(--brand-strong)]" />
              {metric.label}
            </div>
            <div className="mt-1.5 font-mono text-[22px] font-bold tracking-tight text-[color:var(--brand-strong)]">
              {metric.value}
            </div>
            <p className="mt-1 text-[11px] leading-[1.4] text-[color:var(--ink-4)]">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--ink-2)]">
            <Newspaper className="h-3.5 w-3.5 text-[color:var(--brand)]" />
            媒体与专栏提及
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            {MEDIA_MENTIONS.map((item) => (
              <article key={item.id} className="fb-card p-3.5 md:p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--ink-3)]">
                    {item.outlet}
                  </span>
                  <span className="text-[10px] font-medium text-[color:var(--brand-strong)]">{item.outletKind}</span>
                  <span className="text-[10px] text-[color:var(--ink-5)]">{item.dateLabel}</span>
                  <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-600">
                    <Flame className="h-3 w-3" />
                    {item.heat}
                  </span>
                </div>
                <h3 className="mt-2 text-[13px] font-semibold leading-snug text-[color:var(--ink-1)]">
                  {item.headline}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{item.summary}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-[color:var(--ink-4)]">#{item.tag}</span>
                  <span className="text-[10px] text-[color:var(--ink-5)]">{item.region}</span>
                </div>
                <div className="mt-2">
                  <HeatBar value={item.heat} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="fb-card overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3.5 py-2.5 text-[12px] font-semibold text-[color:var(--ink-1)]">
            <Megaphone className="h-3.5 w-3.5 text-orange-500" />
            热搜话题 · 人生K线
          </div>
          <ol className="divide-y divide-[color:var(--hairline)]">
            {HEAT_TOPICS.map((topic) => (
              <li key={topic.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    topic.rank <= 3
                      ? 'bg-orange-500 text-white'
                      : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]',
                  )}
                >
                  {topic.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[color:var(--ink-1)]">{topic.topic}</div>
                  <div className="mt-1">
                    <HeatBar value={topic.heat} />
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    topic.delta === '爆'
                      ? 'bg-red-50 text-red-600'
                      : topic.delta === '热'
                        ? 'bg-orange-50 text-orange-600'
                        : topic.delta === '新'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]',
                  )}
                >
                  {topic.delta}
                </span>
              </li>
            ))}
          </ol>
          <div className="border-t border-[color:var(--hairline)] px-3.5 py-2 text-[10px] leading-[1.4] text-[color:var(--ink-5)]">
            话题榜为站内编辑根据公开讨论与搜索趋势整理的展示榜，非第三方实时热搜接口。
          </div>
        </div>
      </div>
    </section>
  );
}
