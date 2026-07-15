import Link from 'next/link';
import type { ContentLocaleGroupKey } from '@/lib/content-locale';

export type LocaleFilterOption = {
  key: ContentLocaleGroupKey | 'all';
  label: string;
  count: number;
};

export default function ContentLocaleFilter({
  basePath,
  active,
  options,
  hint,
  pageParam = 'page',
  localeParam = 'locale',
}: {
  basePath: string;
  active: ContentLocaleGroupKey | 'all';
  options: LocaleFilterOption[];
  hint?: string;
  pageParam?: string;
  localeParam?: string;
}) {
  return (
    <div className="mb-4 border-b border-[color:var(--hairline)] pb-3">
      {hint ? (
        <p className="mb-2 text-[11px] leading-snug text-[color:var(--ink-5)]">{hint}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {options.map((opt) => {
          const isActive = opt.key === active;
          const href =
            opt.key === 'all'
              ? basePath
              : `${basePath}?${localeParam}=${encodeURIComponent(opt.key)}`;
          return (
            <Link
              key={opt.key}
              href={href}
              className={
                isActive
                  ? 'font-medium text-[color:var(--ink-1)] no-underline'
                  : 'text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline'
              }
              scroll={false}
              aria-current={isActive ? 'page' : undefined}
            >
              {opt.label}
              <span className="ml-1 text-[11px] text-[color:var(--ink-5)]">{opt.count}</span>
            </Link>
          );
        })}
      </div>
      <span className="sr-only" data-page-param={pageParam} />
    </div>
  );
}

export function ContentLocaleBadge({
  groupLabel,
  localeLabel,
  geoReady,
  geoReadyLabel = '可引用',
}: {
  groupLabel: string;
  localeLabel?: string;
  geoReady?: boolean;
  geoReadyLabel?: string;
}) {
  const parts = [groupLabel, localeLabel, geoReady ? geoReadyLabel : null].filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="mt-1 text-[11px] text-[color:var(--ink-5)]">{parts.join(' · ')}</div>
  );
}
