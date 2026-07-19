import Link from 'next/link';
import { listDimensionsSorted } from '@/lib/dimensions/config';
import type { DimensionSlug } from '@/lib/dimensions/types';
import {
  INTENT_PRIORITY_SLUGS,
  type FunnelIntent,
} from '@/lib/dimensions/intent-source';
import {
  dimensionGridCopy,
  dimensionMaturityLabel,
  dimensionUiCopy,
} from '@/lib/i18n/dimensions-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { cn } from '@/lib/utils';

export default function DimensionGrid({
  intent = 'general',
  source = '',
  locale = 'zh-CN',
}: {
  intent?: FunnelIntent;
  source?: string;
  locale?: SiteLocale;
}) {
  const items = listDimensionsSorted();
  const boost = INTENT_PRIORITY_SLUGS[intent] || [];
  const boostSet = new Set(boost);
  const grid = dimensionGridCopy(locale);

  const ready = items
    .filter((item) => item.maturity === 'mvp')
    .slice()
    .sort((a, b) => {
      const ai = boost.indexOf(a.slug as DimensionSlug);
      const bi = boost.indexOf(b.slug as DimensionSlug);
      const aRank = ai >= 0 ? ai : 100 + a.order;
      const bRank = bi >= 0 ? bi : 100 + b.order;
      return aRank - bRank;
    });

  const rest = items.filter((item) => item.maturity !== 'mvp');
  const qs = source ? `?source=${encodeURIComponent(source)}` : '';

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">
            {boost.length ? grid.recommendedFirst : grid.available}
          </div>
          {boost.length ? (
            <span className="text-[11px] text-[color:var(--ink-5)]">{grid.sortedForYou}</span>
          ) : null}
        </div>
        <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
          {ready.map((item) => {
            const highlighted = boostSet.has(item.slug as DimensionSlug);
            const ui = dimensionUiCopy(locale, item.slug as DimensionSlug);
            return (
              <li key={item.slug}>
                <Link
                  href={`/dimensions/${item.slug}${qs}`}
                  className={cn(
                    'group flex flex-col gap-1 py-3 no-underline hover:no-underline sm:flex-row sm:items-start sm:justify-between sm:gap-6',
                    highlighted ? 'bg-[color:var(--bg-sunken)]/40 -mx-2 px-2 sm:-mx-3 sm:px-3 rounded-[var(--radius)]' : '',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                        {ui.title}
                      </span>
                      {highlighted ? (
                        <span className="rounded-[var(--radius-sm)] bg-[color:var(--paper)] px-1.5 py-0.5 text-[11px] font-medium text-[color:var(--ink-4)]">
                          {grid.moreRelevant}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)] sm:hidden">
                      {ui.question}
                    </p>
                  </div>
                  <span className="hidden min-w-0 max-w-[52%] text-right text-[12px] leading-[1.5] text-[color:var(--ink-5)] sm:block">
                    {ui.question}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {rest.length ? (
        <section>
          <div className="mb-2 text-[12px] font-medium text-[color:var(--ink-5)]">{grid.more}</div>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {rest.map((item) => {
              const ui = dimensionUiCopy(locale, item.slug as DimensionSlug);
              return (
                <li key={item.slug}>
                  <Link
                    href={`/dimensions/${item.slug}${qs}`}
                    className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
                  >
                    <span className="text-[13px] text-[color:var(--ink-2)] hover:underline">{ui.title}</span>
                    <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">
                      {dimensionMaturityLabel(locale, item.maturity)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
