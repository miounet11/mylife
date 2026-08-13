import Link from 'next/link';
import {
  getEngineDisplay,
  type EngineDisplaySurface,
} from '@/lib/engine-surface/display-policy';

export type EngineLockFact = {
  label: string;
  value?: string | null;
  mono?: boolean;
};

/**
 * Lock layer: compact natal facts + link to desk or /engines.
 * Do not use on a page that already mounts EngineSurfaceMount.
 */
export function EngineLockStrip({
  surface,
  facts,
  note,
  href = '/engines',
  hrefLabel = '引擎目录',
  extraHref,
  extraLabel,
  className = '',
}: {
  surface?: EngineDisplaySurface;
  facts?: EngineLockFact[];
  note?: string;
  href?: string;
  hrefLabel?: string;
  extraHref?: string;
  extraLabel?: string;
  className?: string;
}) {
  const policy = surface ? getEngineDisplay(surface) : null;
  const resolvedNote = note || policy?.note || '同一套命盘主链，不另起算法';
  const resolvedExtraLabel = extraLabel || policy?.extraLabel;
  const resolvedExtraHref = extraHref || policy?.extraHrefFallback;
  const shown = (facts || []).filter((f) => `${f.value || ''}`.trim());

  return (
    <div
      className={`rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--brand-strong)]">
            引擎锁定
          </p>
          <p className="mt-0.5 text-[11px] leading-[1.45] text-[color:var(--ink-4)]">{resolvedNote}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          {resolvedExtraHref && resolvedExtraLabel ? (
            <Link
              href={resolvedExtraHref}
              className="font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {resolvedExtraLabel}
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
