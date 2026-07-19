import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

function pageHref(basePath: string, page: number) {
  if (page <= 1) {
    if (!basePath.includes('?')) return basePath;
    const [path, qs] = basePath.split('?');
    const params = new URLSearchParams(qs);
    params.delete('page');
    const next = params.toString();
    return next ? `${path}?${next}` : path;
  }

  if (!basePath.includes('?')) {
    return `${basePath}?page=${page}`;
  }
  const [path, qs] = basePath.split('?');
  const params = new URLSearchParams(qs);
  params.set('page', String(page));
  return `${path}?${params.toString()}`;
}

function paginationCopy(locale?: SiteLocale | string | null) {
  const isEn = locale === 'en' || `${locale || ''}`.toLowerCase().startsWith('en');
  if (isEn) {
    return { nav: 'Pagination', prev: 'Previous', next: 'Next' };
  }
  const base = { nav: '分页', prev: '上一页', next: '下一页' };
  if (locale === 'zh-Hant') {
    return {
      nav: toSiteLocaleText(base.nav, 'zh-Hant'),
      prev: toSiteLocaleText(base.prev, 'zh-Hant'),
      next: toSiteLocaleText(base.next, 'zh-Hant'),
    };
  }
  return base;
}

export default function ContentListPagination({
  basePath,
  page,
  totalPages,
  locale,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  locale?: SiteLocale | string | null;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const copy = paginationCopy(locale);

  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-[13px]" aria-label={copy.nav}>
      {prev ? (
        <Link
          href={pageHref(basePath, prev)}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          {copy.prev}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[12px] text-[color:var(--ink-5)]">
        {page} / {totalPages}
      </span>
      {next ? (
        <Link
          href={pageHref(basePath, next)}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          {copy.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
