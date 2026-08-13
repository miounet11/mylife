import Link from 'next/link';

export type EngineLockFact = {
  label: string;
  value?: string | null;
  mono?: boolean;
};

/**
 * Compact “this page cites the natal chain” chrome.
 * Use on chat / 十维 / 合婚 / 起名 — not a second Engine Surface.
 */
export function EngineLockStrip({
  facts,
  note = '同一套命盘主链，不另起算法',
  href = '/engines',
  hrefLabel = '引擎目录',
  extraHref,
  extraLabel,
  className = '',
}: {
  facts?: EngineLockFact[];
  note?: string;
  href?: string;
  hrefLabel?: string;
  extraHref?: string;
  extraLabel?: string;
  className?: string;
}) {
  const shown = (facts || []).filter((f) => `${f.value || ''}`.trim());

  return (
    <div
      className={`rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[11px] leading-[1.45] text-[color:var(--ink-4)]">{note}</p>
        <div className="flex flex-wrap gap-2 text-[12px]">
          {extraHref && extraLabel ? (
            <Link
              href={extraHref}
              className="font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {extraLabel}
            </Link>
          ) : null}
          <Link href={href} className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
            {hrefLabel}
          </Link>
        </div>
      </div>
      {shown.length ? (
        <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-2)]">
          {shown.map((fact) => (
            <div key={`${fact.label}:${fact.value}`} className="inline-flex items-baseline gap-1">
              <dt className="text-[color:var(--ink-5)]">{fact.label}</dt>
              <dd className={fact.mono ? 'font-mono font-semibold' : 'font-semibold'}>
                {`${fact.value}`.trim()}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
