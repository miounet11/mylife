// v5-D37 今日一签卡片
// 作为 home 顶部"日 ritual"入口，给玄学用户每日重复访问的钩子。

import Link from 'next/link';
import { ArrowRight, Sparkles, AlertTriangle, Sun, Compass } from 'lucide-react';
import type { TodayCardData } from '@/lib/today-card';
import ResultCtaLink from '@/components/result-cta-link';

interface TodayCardProps {
  /** 档案 id，CTA 跳转用 */
  fortuneId: string;
  /** 显示名称（默认"你的"） */
  displayName?: string;
  /** 服务端预算的卡片数据 */
  card: TodayCardData;
  /** 埋点 page */
  page?: string;
}

const TONE_STYLE = {
  auspicious: {
    border: 'border-emerald-300/60',
    bg: 'bg-gradient-to-br from-emerald-50 via-white to-amber-50',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: Sun,
    label: '吉',
  },
  neutral: {
    border: 'border-[color:var(--brand-soft-2)]',
    bg: 'bg-gradient-to-br from-[color:var(--brand-tint)] via-white to-[color:var(--bg-sunken)]',
    badge: 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]',
    icon: Compass,
    label: '平',
  },
  caution: {
    border: 'border-rose-300/60',
    bg: 'bg-gradient-to-br from-rose-50 via-white to-amber-50',
    badge: 'bg-rose-100 text-rose-800',
    icon: AlertTriangle,
    label: '慎',
  },
} as const;

export default function TodayCard({ fortuneId, displayName, card, page = '/' }: TodayCardProps) {
  const style = TONE_STYLE[card.toneLabel];
  const Icon = style.icon;
  const owner = displayName || '你';

  // 友好显示日期：5 月 19 日
  const [, mm, dd] = card.date.split('-');
  const dateLabel = `${Number(mm)} 月 ${Number(dd)} 日`;

  return (
    <section
      aria-label="今日一签"
      className={`mb-6 overflow-hidden rounded-[calc(var(--radius-md)+8px)] border ${style.border} ${style.bg} p-4 shadow-sm md:p-6`}
    >
      {/* 顶部 meta */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-bold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
          <Sparkles className="h-3 w-3" />
          今日一签
        </span>
        <span className="font-semibold text-[color:var(--ink-4)]">{dateLabel}</span>
        <span className="font-semibold text-[color:var(--ink-4)]">·</span>
        <span className="font-bold text-[color:var(--ink-2)]">{card.dayPillar}</span>
        {card.todayShiShen && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ${style.badge}`}>
            <Icon className="h-3 w-3" />
            {card.todayShiShen} · {style.label}
          </span>
        )}
      </div>

      {/* 主标题 */}
      <h2 className="text-xl font-black leading-snug text-[color:var(--ink-1)] md:text-2xl">
        {owner}今天：{card.headline}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)] md:text-[15px]">
        {card.summary}
      </p>

      {/* 宜 / 忌 双栏 */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-emerald-200/70 bg-white/70 p-3 backdrop-blur">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            宜
          </div>
          <ul className="space-y-1.5 text-sm text-[color:var(--ink-2)]">
            {card.doTags.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--radius-md)] border border-rose-200/70 bg-white/70 p-3 backdrop-blur">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-700">
            忌
          </div>
          <ul className="space-y-1.5 text-sm text-[color:var(--ink-2)]">
            {card.avoidTags.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 时段 + 关系命中 */}
      <div className="mt-4 rounded-[var(--radius-md)] border border-white/60 bg-white/60 p-3 text-xs leading-6 text-[color:var(--ink-3)] backdrop-blur">
        <div className="font-bold text-[color:var(--ink-2)]">关键时段</div>
        <div className="mt-1">{card.windowHint}</div>
        {(card.relations.he.length +
          card.relations.chong.length +
          card.relations.xing.length +
          card.relations.hai.length) > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {card.relations.he.map((b) => (
              <span key={`he-${b}`} className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                合 {b}
              </span>
            ))}
            {card.relations.chong.map((b) => (
              <span key={`ch-${b}`} className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">
                冲 {b}
              </span>
            ))}
            {card.relations.xing.map((b) => (
              <span key={`xi-${b}`} className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-800">
                刑 {b}
              </span>
            ))}
            {card.relations.hai.map((b) => (
              <span key={`ha-${b}`} className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                害 {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ResultCtaLink
          href={`/r/${fortuneId}?source=today_card`}
          page={page}
          target="today_card_open_report"
          meta={{ fortuneId, date: card.date, tone: card.toneLabel }}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[2px] bg-[color:var(--fb-blue)] px-4 py-2 text-[14px] font-bold text-white transition hover:bg-[#365899] hover:no-underline"
        >
          看我的时间地图
          <ArrowRight className="h-4 w-4" />
        </ResultCtaLink>
        <Link
          href={`/events?source=today_card&fortuneId=${encodeURIComponent(fortuneId)}`}
          className="inline-flex min-h-10 items-center rounded-[2px] border border-[#dddfe2] bg-white px-3 py-1.5 text-[13px] font-bold text-[color:var(--fb-ink-2)] hover:bg-[#f5f6f7] hover:no-underline"
        >
          记一笔今天 →
        </Link>
      </div>
    </section>
  );
}
