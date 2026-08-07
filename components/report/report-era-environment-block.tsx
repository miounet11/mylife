import Link from 'next/link';
import { buildEraEnvironmentSnapshot } from '@/lib/world-yi-era-snapshot';

/**
 * Year-scoped era environment strip for report / annual review.
 * Server-safe (no client hooks).
 */
export default function ReportEraEnvironmentBlock({
  year,
  locale = 'zh-CN',
  compact = false,
  className = '',
}: {
  year?: number;
  locale?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const snap = buildEraEnvironmentSnapshot(year);
  const actions = en ? snap.actionsEn : snap.actions;

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] ${
        compact ? 'p-3' : 'p-4 md:p-5'
      } ${className}`}
      data-era-environment="1"
      data-year={snap.year}
      aria-label={en ? 'Era environment' : '时代环境'}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            {en ? 'World Yi · Era environment' : '世界易 · 时代环境'}
          </p>
          <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
            {en
              ? `${snap.year} macro weather · ${snap.phase.titleEn}`
              : `${snap.year} 年宏观天气 · ${snap.phase.title}`}
          </h3>
        </div>
        <Link
          href={snap.hubHref}
          className="shrink-0 text-[12px] font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          {en ? 'Era timing hub →' : '时代天时 →'}
        </Link>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
        {en ? snap.phaseNoteEn : snap.phaseNote}
      </p>

      {!compact ? (
        <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <li>
            <strong className="text-[color:var(--ink-2)]">{en ? 'Outer' : '外行星层'}</strong>
            {' — '}
            {en ? snap.outerEn : snap.outer}
          </li>
          <li>
            <strong className="text-[color:var(--ink-2)]">{en ? 'Social' : '土木/社会压力'}</strong>
            {' — '}
            {en ? snap.socialEn : snap.social}
          </li>
          <li>
            <strong className="text-[color:var(--ink-2)]">{en ? 'Friction' : '摩擦窗口'}</strong>
            {' — '}
            {en ? snap.frictionEn : snap.friction}
          </li>
          <li>
            <strong className="text-[color:var(--ink-2)]">{en ? 'Personal align' : '个人对齐'}</strong>
            {' — '}
            {en ? snap.personalAskEn : snap.personalAsk}
          </li>
        </ul>
      ) : null}

      <ol className={`mt-3 space-y-1.5 text-[12px] leading-relaxed text-[color:var(--ink-3)] ${compact ? '' : ''}`}>
        {actions.map((item, index) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 font-semibold text-[color:var(--ink-5)]">{index + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
        {en ? snap.disclaimerEn : snap.disclaimer}
      </p>
    </section>
  );
}
