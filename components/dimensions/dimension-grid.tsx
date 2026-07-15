import Link from 'next/link';
import { listDimensionsSorted } from '@/lib/dimensions/config';
import type { DimensionMaturity } from '@/lib/dimensions/types';

const MATURITY_LABEL: Record<DimensionMaturity, string> = {
  mvp: '',
  preview: '即将上线',
  planned: '规划中',
};

export default function DimensionGrid() {
  const items = listDimensionsSorted();
  const ready = items.filter((item) => item.maturity === 'mvp');
  const rest = items.filter((item) => item.maturity !== 'mvp');

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 text-[12px] font-medium text-[color:var(--ink-5)]">可用</div>
        <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
          {ready.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/dimensions/${item.slug}`}
                className="group flex flex-col gap-0.5 py-3 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                  {item.title}
                </span>
                <span className="min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right">
                  {item.question}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {rest.length ? (
        <section>
          <div className="mb-2 text-[12px] font-medium text-[color:var(--ink-5)]">更多</div>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {rest.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/dimensions/${item.slug}`}
                  className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
                >
                  <span className="text-[13px] text-[color:var(--ink-2)] hover:underline">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">
                    {MATURITY_LABEL[item.maturity]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
