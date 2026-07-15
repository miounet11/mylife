import Link from 'next/link';
import { listFeaturedDimensions } from '@/lib/content-crosslinks';

/** Compact ten-dimension list for hubs — text links only. */
export default function DimensionsShowcase({
  title = '十维度',
  description = '先选你最关心的问题。',
  limit = 6,
  compact = false,
  source = 'showcase',
}: {
  title?: string;
  description?: string;
  limit?: number;
  compact?: boolean;
  source?: string;
}) {
  const items = listFeaturedDimensions(limit);

  return (
    <section className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 max-w-xl text-[12px] leading-[1.45] text-[color:var(--ink-5)]">
              {description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/dimensions?source=${encodeURIComponent(source)}`}
          className="shrink-0 text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          全部
        </Link>
      </div>

      <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={`${item.href}${item.href.includes('?') ? '&' : '?'}source=${encodeURIComponent(source)}`}
              className="group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                {item.title}
                {item.badge ? (
                  <span className="ml-2 text-[11px] font-normal text-[color:var(--ink-5)]">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
