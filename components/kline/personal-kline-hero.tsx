'use client';

import type { PersonalKlineHighlight } from '@/lib/kline-showcase';
import { LIFE_KLINE_PRODUCT } from '@/lib/kline-showcase';

const TONE_LABEL: Record<NonNullable<PersonalKlineHighlight['tone']>, string> = {
  rising: '偏顺',
  steady: '偏稳',
  pressure: '宜守',
  mixed: '冷热不均',
};

/**
 * 结果页人生 K 线「一眼好」首屏：
 * 人话阶段结论 → 关键数字 → 跳到完整焦点曲线。
 */
export default function PersonalKlineHero({
  highlight,
  anchorId = 'pro-kline',
}: {
  highlight: PersonalKlineHighlight | null;
  anchorId?: string;
}) {
  const tone = highlight?.tone;
  const toneLabel = tone ? TONE_LABEL[tone] : null;
  const calCount = highlight?.calibrationCount || 0;

  return (
    <section
      id="life-kline-hero"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
              本报告核心 · {LIFE_KLINE_PRODUCT.english}
            </p>
            {toneLabel ? (
              <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-3)]">
                阶段 {toneLabel}
                {highlight?.age != null ? ` · ${highlight.age} 岁` : ''}
              </span>
            ) : null}
            {calCount > 0 ? (
              <span className="rounded-full border border-[color:var(--data-up)]/30 bg-[rgba(47,125,82,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--data-up)]">
                已校准 {calCount} 点
              </span>
            ) : null}
          </div>
          <h2 className="mt-1.5 text-[17px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[19px]">
            {highlight?.stageHeadline || LIFE_KLINE_PRODUCT.name}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            {highlight?.stageSupport ||
              `${LIFE_KLINE_PRODUCT.oneLiner} 曲线按你的生辰锁定：原局 + 大运 + 流年。`}
          </p>
        </div>
        <a
          href={`#${anchorId}`}
          className="shrink-0 rounded-full bg-[color:var(--ink-1)] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
        >
          看我的曲线 ↓
        </a>
      </div>

      {highlight ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label="今年综合"
            value={
              highlight.currentYearScore != null ? String(highlight.currentYearScore) : '—'
            }
            hint="引擎刻度，非吉凶判决"
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
          <Metric label="样本跨度" value={highlight.spanLabel} />
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">
          本报告 K 线样本生成中或暂缺；可先看结构判断与大运，稍后再回看曲线。
        </p>
      )}

      {highlight?.stageAction ? (
        <div className="mt-3 rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
            因此建议
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-2)]">
            {highlight.stageAction}
          </p>
        </div>
      ) : null}

      {highlight?.calibrationNote ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <span className="font-semibold text-[color:var(--data-up)]">校准对照</span>
          {' · '}
          {highlight.calibrationNote}
        </p>
      ) : null}

      {highlight?.readingTips?.length && !highlight.stageAction ? (
        <ul className="mt-3 space-y-1.5 border-t border-[color:var(--hairline)] pt-3">
          {highlight.readingTips.slice(0, 2).map((tip) => (
            <li key={tip} className="text-[12px] leading-relaxed text-[color:var(--ink-3)]">
              · {tip}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-bold tabular-nums text-[color:var(--ink-1)]">
        {value}
      </div>
      {hint ? <div className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">{hint}</div> : null}
    </div>
  );
}
