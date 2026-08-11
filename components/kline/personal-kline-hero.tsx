'use client';

import type { PersonalKlineHighlight } from '@/lib/kline-showcase';
import { LIFE_KLINE_PRODUCT } from '@/lib/kline-showcase';

/**
 * 结果页人生 K 线「核心功能」说明条：先讲清是什么，再跳到完整曲线。
 */
export default function PersonalKlineHero({
  highlight,
  anchorId = 'pro-kline',
}: {
  highlight: PersonalKlineHighlight | null;
  anchorId?: string;
}) {
  return (
    <section
      id="life-kline-hero"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            本报告核心 · {LIFE_KLINE_PRODUCT.english}
          </p>
          <h2 className="mt-1 text-[17px] font-bold text-[color:var(--ink-1)] md:text-[18px]">
            {LIFE_KLINE_PRODUCT.name}
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            {LIFE_KLINE_PRODUCT.oneLiner}
            下面曲线按你的生辰锁定：原局基线 + 大运背景 + 流年触发。
          </p>
        </div>
        <a
          href={`#${anchorId}`}
          className="shrink-0 rounded-full border border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)] px-3.5 py-1.5 text-[12px] font-semibold text-[color:var(--ink-1)] hover:bg-white"
        >
          查看完整 K 线 ↓
        </a>
      </div>

      {highlight ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="样本跨度" value={highlight.spanLabel} />
          <Metric
            label="今年参考"
            value={
              highlight.currentYearScore != null ? String(highlight.currentYearScore) : '—'
            }
          />
          <Metric
            label="高点参考"
            value={
              highlight.peak
                ? `${highlight.peak.year} · ${highlight.peak.score}`
                : '—'
            }
          />
          <Metric
            label="低谷参考"
            value={
              highlight.trough
                ? `${highlight.trough.year} · ${highlight.trough.score}`
                : '—'
            }
          />
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">
          本报告 K 线样本生成中或暂缺；可先看结构判断与大运，稍后再回看曲线。
        </p>
      )}

      {highlight?.readingTips?.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-[color:var(--hairline)] pt-3">
          {highlight.readingTips.map((tip) => (
            <li key={tip} className="text-[12px] leading-relaxed text-[color:var(--ink-3)]">
              · {tip}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--ink-5)]">
        {LIFE_KLINE_PRODUCT.howBuilt.map((s) => (
          <span key={s.step}>
            {s.step}.{s.title}
          </span>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-bold tabular-nums text-[color:var(--ink-1)]">
        {value}
      </div>
    </div>
  );
}
