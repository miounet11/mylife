'use client';

import { useMemo, useState } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import {
  LIFE_KLINE_PRODUCT,
  type KlineShowcaseSample,
} from '@/lib/kline-showcase';

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-[12px] bg-[color:var(--bg-sunken)]" />
  ),
  ssr: false,
});

type Props = {
  samples: KlineShowcaseSample[];
  /** 锚定测算表单 */
  ctaHref?: string;
  /** 更紧凑（结果页内嵌） */
  compact?: boolean;
  className?: string;
};

/**
 * 公开「人生 K 线」产品说明 + 真实引擎示例曲线。
 * 用于首页 / 说明位：先看懂是什么，再去填生辰出自己的线。
 */
export default function LifeKlineShowcase({
  samples,
  ctaHref = '#analyze-workspace',
  compact = false,
  className = '',
}: Props) {
  const safe = Array.isArray(samples) ? samples.filter((s) => s.series?.length) : [];
  const [activeId, setActiveId] = useState(safe[0]?.id || '');
  const active = useMemo(
    () => safe.find((s) => s.id === activeId) || safe[0] || null,
    [safe, activeId],
  );

  if (!safe.length) return null;

  const chartData = (active?.series || []).map((p) => ({
    year: p.year,
    career: p.career,
    wealth: p.wealth,
    marriage: p.marriage,
    health: p.health,
    score: p.score,
    evidence: p.evidence,
  }));

  return (
    <section
      id="life-kline-showcase"
      className={`scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] ${
        compact ? 'p-4' : 'p-4 md:p-6'
      } ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            核心能力 · {LIFE_KLINE_PRODUCT.english}
          </p>
          <h2
            className={`mt-1 font-bold tracking-tight text-[color:var(--ink-1)] ${
              compact ? 'text-[17px]' : 'text-[20px] md:text-[22px]'
            }`}
          >
            {LIFE_KLINE_PRODUCT.name}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--ink-3)] md:text-[14px]">
            {LIFE_KLINE_PRODUCT.oneLiner}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="shrink-0 rounded-full bg-[color:var(--ink-1)] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          生成我的人生 K 线
        </Link>
      </div>

      {!compact ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {LIFE_KLINE_PRODUCT.whatItIs.map((line) => (
            <li
              key={line}
              className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-3 py-2.5 text-[12px] leading-relaxed text-[color:var(--ink-3)]"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {!compact ? (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {LIFE_KLINE_PRODUCT.howBuilt.map((item) => (
            <li
              key={item.step}
              className="rounded-[10px] border border-[color:var(--hairline)] px-3 py-2.5"
            >
              <div className="text-[11px] font-bold text-[color:var(--ink-5)]">步骤 {item.step}</div>
              <div className="mt-0.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
                {item.title}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-5 border-t border-[color:var(--hairline)] pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">示例人生 K 线</h3>
            <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
              以下由真实 V6 引擎演算，仅作读图教学 · 非真人档案
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {safe.map((s) => {
            const on = s.id === active?.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={
                  on
                    ? 'rounded-full bg-[color:var(--ink-1)] px-3 py-1.5 text-[12px] font-semibold text-white'
                    : 'rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-1.5 text-[12px] text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)]'
                }
                aria-pressed={on}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {active ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2.5">
              <p className="text-[13px] font-medium text-[color:var(--ink-2)]">{active.persona}</p>
              <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">{active.teach}</p>
              <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">{active.birthSummary}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-[color:var(--ink-3)]">
                {active.peakYear ? <span>高点参考 · {active.peakYear}</span> : null}
                {active.troughYear ? <span>低谷参考 · {active.troughYear}</span> : null}
                <span>{active.series.length} 年样本</span>
              </div>
            </div>

            <FortuneChart
              data={chartData}
              height={compact ? 260 : 300}
              title={`${active.label} · 人生 K 线示例`}
              subtitle="可切换 综合 / 事业 / 财富 / 关系 / 健康"
            />
          </div>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 border-t border-[color:var(--hairline)] pt-4">
          <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">怎么读图</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {LIFE_KLINE_PRODUCT.howToRead.map((item) => (
              <li
                key={item.title}
                className="rounded-[8px] border border-[color:var(--hairline)] px-3 py-2 text-[12px] leading-relaxed"
              >
                <span className="font-semibold text-[color:var(--ink-1)]">{item.title}</span>
                <span className="text-[color:var(--ink-4)]"> — {item.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
            {LIFE_KLINE_PRODUCT.disclaimer}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
          {LIFE_KLINE_PRODUCT.disclaimer}
        </p>
      )}
    </section>
  );
}
