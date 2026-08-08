import type { ExperienceQualityReceipt } from '@/lib/experience-kernel/types';

type Props = {
  receipt: ExperienceQualityReceipt;
  compact?: boolean;
  locale?: string | null;
};

/**
 * Quality Receipt — single authoritative trust card for report/chat.
 * Data from buildExperienceQualityReceipt (status + seven-day + usable-deep).
 */
export default function ReportQualityReceipt({ receipt, compact = false }: Props) {
  const score =
    typeof receipt.confidenceScore === 'number' ? `${receipt.confidenceScore}` : '—';
  const tierBadge = receipt.usableDeep
    ? '可用深度版'
    : receipt.editionLabel || receipt.badge;

  return (
    <section
      id="quality-receipt"
      className={`scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
      aria-label="报告质量回执"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-strong)]">
            QUALITY RECEIPT
          </div>
          <h3
            className={`mt-1 font-bold leading-snug text-[color:var(--ink-1)] ${
              compact ? 'text-[14px]' : 'text-[16px] md:text-[17px]'
            }`}
          >
            {receipt.title}
          </h3>
          {!compact ? (
            <p className="mt-1 max-w-2xl text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
              {receipt.summary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[rgba(47,125,82,0.10)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--data-up)]">
            {receipt.badge}
          </span>
          <span className="rounded-full bg-[color:var(--bg-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ink-2)]">
            {tierBadge}
          </span>
          <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-[color:var(--ink-1)]">
            {score}
            {receipt.grade ? ` · ${receipt.grade}` : ''}
          </span>
        </div>
      </div>

      <div className={`mt-3 grid gap-2 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'}`}>
        <div className="rounded-[var(--radius)] border border-[rgba(47,125,82,0.15)] bg-[rgba(47,125,82,0.04)] px-3 py-2.5">
          <div className="text-[11px] font-semibold text-[color:var(--data-up)]">可以信</div>
          <ul className="mt-1.5 space-y-1">
            {(receipt.trustPoints.length ? receipt.trustPoints : ['命盘结构底座已生成']).map(
              (p, i) => (
                <li
                  key={`t-${i}`}
                  className="text-[12px] leading-[1.5] text-[color:var(--ink-2)]"
                >
                  · {p}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/50 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-[color:var(--ink-3)]">需要留意</div>
          <ul className="mt-1.5 space-y-1">
            {(receipt.cautionPoints.length
              ? receipt.cautionPoints
              : [receipt.hasSevenDayActions ? '主结论可直接用，细节可再校准' : '近 7 天行动清单待补齐']
            ).map((p, i) => (
              <li
                key={`c-${i}`}
                className="text-[12px] leading-[1.5] text-[color:var(--ink-3)]"
              >
                · {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[color:var(--ink-4)]">
          {receipt.hasSevenDayActions ? (
            <span className="rounded-full bg-[rgba(47,125,82,0.08)] px-2.5 py-1 font-semibold text-[color:var(--data-up)]">
              近 7 天行动已就绪
            </span>
          ) : (
            <span className="rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-1">
              近 7 天行动待生成
            </span>
          )}
          {receipt.usableDeep ? (
            <span className="rounded-full bg-[rgba(47,125,82,0.08)] px-2.5 py-1 font-semibold text-[color:var(--data-up)]">
              已达可用深度档 (≥83)
            </span>
          ) : null}
          {receipt.progressLabel ? (
            <span className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1">
              {receipt.progressLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
