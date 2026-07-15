import Link from 'next/link';
import type { DimensionRecommendation } from '@/lib/dimensions/recommendations';

export default function DimensionRecommendationsPanel({
  items,
  title = '推荐',
  description,
  compact = false,
}: {
  items: DimensionRecommendation[];
  intentLabel?: string;
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  if (!items.length) return null;

  return (
    <section className={compact ? 'space-y-1' : 'space-y-2'}>
      {title ? (
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{title}</h2>
          <Link
            href="/dimensions"
            className="text-[12px] text-[color:var(--ink-4)] underline-offset-2 hover:underline"
          >
            全部
          </Link>
        </div>
      ) : null}
      {description ? (
        <p className="text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{description}</p>
      ) : null}
      <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/dimensions/${item.slug}`}
              className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
            >
              <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">{item.title}</span>
              <span className="truncate text-[12px] text-[color:var(--ink-5)]">{item.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
