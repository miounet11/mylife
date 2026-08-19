'use client';

import { useMemo, useState } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import {
  LIFE_KLINE_PRODUCT,
  type KlineShowcaseSample,
} from '@/lib/kline-showcase';
import { useLocale } from '@/components/i18n/locale-provider';
import { ArrowRight, CheckCircle } from 'lucide-react';

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-2xl bg-[color:var(--bg-sunken)]" />
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
  const { locale } = useLocale();
  const en = locale === 'en';
  const product = {
    name: en ? LIFE_KLINE_PRODUCT.english : LIFE_KLINE_PRODUCT.name,
    oneLiner: en ? LIFE_KLINE_PRODUCT.oneLinerEn : LIFE_KLINE_PRODUCT.oneLiner,
    whatItIs: en ? LIFE_KLINE_PRODUCT.whatItIsEn : LIFE_KLINE_PRODUCT.whatItIs,
    howBuilt: en ? LIFE_KLINE_PRODUCT.howBuiltEn : LIFE_KLINE_PRODUCT.howBuilt,
  };
  const safe = Array.isArray(samples) ? samples.filter((s) => s.series?.length) : [];
  const [activeId, setActiveId] = useState(safe[0]?.id || '');
  const active = useMemo(
    () => safe.find((s) => s.id === activeId) || safe[0] || null,
    [safe, activeId],
  );

  if (!safe.length) return null;

  const sparkline = useMemo(
    () => (active?.series || []).map((p) => p.score || 0).filter((n) => n > 0),
    [active],
  );
  const sparkHere = useMemo(() => {
    if (!active?.series?.length) return undefined;
    const y = new Date().getFullYear();
    const idx = active.series.findIndex((p) => p.year === y);
    return idx >= 0 ? idx : Math.min(active.series.length - 1, Math.floor(active.series.length * 0.7));
  }, [active]);

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
      className={`scroll-mt-header overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] shadow-[0_4px_24px_rgba(15,23,42,0.05)] ${
        compact ? 'p-4' : 'p-5 md:p-7'
      } ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[color:var(--hairline)] pb-4">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center rounded bg-[#182638] px-2 text-[11px] font-semibold tracking-wider text-white">
              {en ? 'Engine viz' : '引擎可视化'}
            </span>
            <h2
              className={`font-bold tracking-tight text-[color:var(--ink-1)] ${
                compact ? 'text-[16px]' : 'text-[18px] md:text-[22px]'
              }`}
            >
              {product.name}
            </h2>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            {product.oneLiner}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#182638] to-[#253950] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs transition hover:brightness-110"
        >
          <span>{en ? 'Generate my K-Line' : '生成我的专属 K 线'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!compact ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {product.whatItIs.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-xl border border-[color:var(--hairline)]/80 bg-[#f8f9fa] p-3.5 text-[12px] leading-relaxed text-[color:var(--ink-2)]"
            >
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!compact ? (
        <ol className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {product.howBuilt.map((item) => (
            <li
              key={item.step}
              className="rounded-xl border border-[color:var(--hairline)]/70 bg-white p-3.5 shadow-2xs"
            >
              <div className="inline-flex rounded-md bg-[color:var(--bg-sunken)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[color:var(--ink-3)]">
                {en ? `Step ${item.step}` : `步骤 ${item.step}`}
              </div>
              <div className="mt-1 text-[13px] font-bold text-[color:var(--ink-1)]">
                {item.title}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-6 border-t border-[color:var(--hairline)] pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-[color:var(--ink-1)]">
              {en ? 'Live engine samples' : '真实引擎演算案例'}
            </h3>
            <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
              {en
                ? 'Generated by the V6 engine — 80-year curves and turning points, not stock photos.'
                : '以下由 V6 真实引擎生成，直观展示 80 年起伏曲线与关键能量转折点'}
            </p>
          </div>
        </div>

        {/* 样本切换 Tab */}
        <div className="mt-4 flex flex-wrap gap-2">
          {safe.map((s) => {
            const on = s.id === active?.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`rounded-xl border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  on
                    ? 'border-[#182638] bg-[#182638] text-white shadow-xs'
                    : 'border-[color:var(--hairline)] bg-white text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)] hover:text-[color:var(--ink-1)]'
                }`}
                aria-pressed={on}
              >
                {en ? s.labelEn || s.label : s.label}
              </button>
            );
          })}
        </div>

        {active ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[color:var(--hairline)] bg-gradient-to-r from-[#f8f9fa] to-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-bold text-[color:var(--ink-1)]">
                  {en ? active.personaEn || active.persona : active.persona}
                </span>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-[color:var(--ink-4)]">
                  {active.peakYear ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 border border-emerald-200/60">
                      {en ? `Peak · ${active.peakYear}` : `巅峰年 · ${active.peakYear}`}
                    </span>
                  ) : null}
                  {active.troughYear ? (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200/60">
                      {en ? `Trough · ${active.troughYear}` : `低谷防守 · ${active.troughYear}`}
                    </span>
                  ) : null}
                  <span className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--gold-soft)] px-2 py-0.5 text-[color:var(--gold-ink)]">
                    {en
                      ? `${active.series.length}-year sample`
                      : `${active.series.length} 年走势样本`}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
                {en ? active.teachEn || active.teach : active.teach}
              </p>
            </div>

            <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-2 md:p-4">
              <FortuneChart
                data={chartData}
                height={compact ? 260 : 320}
                title={`${en ? active.labelEn || active.label : active.label} · ${en ? 'Life K-Line sample' : '人生 K 线示例'}`}
                subtitle={
                  en
                    ? 'Candles by default · switch to career / wealth / relationship / health'
                    : '默认蜡烛图 · 可切曲线看综合 / 事业 / 财富 / 关系 / 健康'
                }
                birthYear={
                  active.series[0]?.year && active.series[0].year > 1900
                    ? active.series[0].year
                    : undefined
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
