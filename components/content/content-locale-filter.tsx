import Link from 'next/link';
import type { ContentLocaleGroupKey } from '@/lib/content-locale';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

export type LocaleFilterOption = {
  key: ContentLocaleGroupKey | 'all';
  label: string;
  count: number;
};

function defaultGeoReadyLabel(locale?: SiteLocale | string | null): string {
  if (locale === 'en' || `${locale || ''}`.toLowerCase().startsWith('en')) {
    return 'AI-citable';
  }
  const zh = 'AI 可引用';
  if (locale === 'zh-Hant') return toSiteLocaleText(zh, 'zh-Hant');
  return zh;
}

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
  geoReadyLabel,
  locale,
}: {
  groupLabel: string;
  localeLabel?: string;
  geoReady?: boolean;
  geoReadyLabel?: string;
  /** UI / content locale for default geoReadyLabel when not passed */
  locale?: SiteLocale | string | null;
}) {
  const readyLabel = geoReadyLabel ?? defaultGeoReadyLabel(locale);
  const parts = [groupLabel, localeLabel, geoReady ? readyLabel : null].filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="mt-1 text-[11px] text-[color:var(--ink-5)]">{parts.join(' · ')}</div>
  );
}
