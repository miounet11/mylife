'use client';

import Link from 'next/link';
import type { CombinedRevisitStats } from '@/lib/revisit-combined-stats';

export default function CombinedRevisitSummary({
  stats,
  locale = 'zh-CN',
  className = '',
}: {
  stats: CombinedRevisitStats;
  locale?: string | null;
  className?: string;
}) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const { predictions, era, combined } = stats;
  const rate = Math.round(combined.hitRate * 100);

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-white p-4 md:p-5 ${className}`}
      data-combined-revisit="1"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            {en ? 'Combined calibration' : '合并回访校准'}
          </p>
          <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Predictions + era hypotheses' : '个人预测 + 时代假设'}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {en
              ? 'Hit rate weights partial as half-hit. Era scores sync when signed in.'
              : '命中率将「部分」计为半命中。登录后时代假设分可跨设备同步。'}
          </p>
        </div>
        <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-2 text-right">
          <div className="text-[10px] text-[color:var(--ink-5)]">
            {en ? 'Combined hit rate' : '合并命中率'}
          </div>
          <div className="text-xl font-black text-[color:var(--brand)]">
            {combined.resolved ? `${rate}%` : '—'}
          </div>
          <div className="text-[10px] text-[color:var(--ink-5)]">
            {en
              ? `${combined.resolved} scored`
              : `${combined.resolved} 条已评`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-[color:var(--hairline)] px-3 py-2">
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en ? 'Personal predictions' : '个人预测'}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-[color:var(--ink-2)]">
            {en
              ? `${predictions.hitCount} hit · ${predictions.partialCount || 0} partial · ${predictions.missCount || 0} miss`
              : `${predictions.hitCount} 命中 · ${predictions.partialCount || 0} 部分 · ${predictions.missCount || 0} 落空`}
          </div>
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en
              ? `${predictions.predictionCount} revisited / ${predictions.catalog} total`
              : `已回访 ${predictions.predictionCount} / 共 ${predictions.catalog}`}
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--hairline)] px-3 py-2">
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en ? 'Era hypotheses' : '时代假设'}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-[color:var(--ink-2)]">
            {en
              ? `${era.hit} hit · ${era.partial} partial · ${era.miss} miss`
              : `${era.hit} 命中 · ${era.partial} 部分 · ${era.miss} 落空`}
          </div>
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en
              ? `${era.total} scored / ${era.catalogSize} catalog · ${era.pending} open`
              : `已评 ${era.total} / 目录 ${era.catalogSize} · 待评 ${era.pending}`}
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--hairline)] px-3 py-2">
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en ? 'Combined' : '合计'}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-[color:var(--ink-2)]">
            {en
              ? `${combined.hit} hit · ${combined.partial} partial · ${combined.miss} miss`
              : `${combined.hit} 命中 · ${combined.partial} 部分 · ${combined.miss} 落空`}
          </div>
          <div className="text-[11px] text-[color:var(--ink-5)]">
            {en ? 'Partial counts as 0.5 hit' : '部分按 0.5 计入命中率'}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
        <Link
          href="/predictions"
          className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          {en ? 'Score predictions' : '评个人预测'}
        </Link>
        <Link
          href="/world-yi/era-timing"
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          {en ? 'Score era hypotheses' : '评时代假设'}
        </Link>
        <Link
          href="/annual-review"
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          {en ? 'Annual review' : '年度复盘'}
        </Link>
      </div>
    </section>
  );
}
