'use client';

import type { AnnualReview } from '@/lib/annual-review/build-review';

export default function AnnualReviewCard({ review }: { review: AnnualReview }) {
  const hitPercent = Math.round(review.hitRate * 100);

  return (
    <section className="fb-card p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
            年度复盘
          </div>
          <h2 className="mt-1 text-lg font-bold text-[color:var(--ink-1)]">{review.year} 年回顾</h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            预测 {review.totalPredictions} 条 · 已反馈 {review.feedbackCount} 条
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-right">
          <div className="text-[11px] font-semibold text-[color:var(--ink-4)]">整体命中率</div>
          <div className="text-2xl font-black text-[color:var(--brand)]">{hitPercent}%</div>
        </div>
      </div>

      {Object.keys(review.hitRateByCategory).length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(review.hitRateByCategory).map(([category, rate]) => (
            <div
              key={category}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2"
            >
              <div className="text-[11px] text-[color:var(--ink-4)]">{category}</div>
              <div className="text-sm font-bold text-[color:var(--ink-2)]">{Math.round(rate * 100)}%</div>
            </div>
          ))}
        </div>
      ) : null}

      {review.dimensionStats?.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-[color:var(--ink-1)]">十维度命中</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {review.dimensionStats.map((item) => (
              <div
                key={item.slug}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2"
              >
                <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
                  预测 {item.total} · 反馈 {item.feedbackCount} · 访问 {item.visits}
                </div>
                <div className="mt-1 text-sm font-bold text-[color:var(--brand)]">
                  {item.feedbackCount ? `${Math.round(item.hitRate * 100)}%` : '待反馈'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {review.highlights.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-[color:var(--ink-1)]">命中亮点</h3>
          <ul className="mt-2 space-y-2">
            {review.highlights.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2"
              >
                <div className="text-[13px] font-semibold text-[color:var(--ink-2)]">{item.statement}</div>
                {item.note ? (
                  <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">{item.note}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.misses.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-[color:var(--ink-1)]">需校准</h3>
          <ul className="mt-2 space-y-2">
            {review.misses.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-sm)] border border-[color:var(--warning-border, var(--hairline))] bg-[color:var(--bg-sunken)] px-3 py-2"
              >
                <div className="text-[13px] font-semibold text-[color:var(--ink-2)]">{item.statement}</div>
                <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">{item.note || '建议补充事件反馈'}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.adjustments.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-[color:var(--ink-1)]">今年调整建议</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-[color:var(--ink-3)]">
            {review.adjustments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}