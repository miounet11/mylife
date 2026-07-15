'use client';

import { useLocale } from '@/components/i18n/locale-provider';
import {
  type SiteLocale,
  LOCALE_FULL_LABELS,
  LOCALE_LABELS,
  SITE_LOCALES,
} from '@/lib/i18n/site-locale';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher({
  compact = false,
  className = '',
  variant = 'chrome',
}: {
  compact?: boolean;
  className?: string;
  /** chrome = blue header; light = white/footer surfaces */
  variant?: 'chrome' | 'light';
}) {
  const { locale, setLocale, t } = useLocale();

  const onPick = (next: SiteLocale) => {
    if (next === locale) return;
    setLocale(next, { persist: true });
    // Prefer path prefix for SEO (/en, /zh-hant); keep ?lang= as fallback.
    // Reload so SSR copy re-renders cleanly.
    try {
      const url = new URL(window.location.href);
      let path = url.pathname.replace(/^\/(en|zh-hant|zh-tw|zh-hk)(?=\/|$)/i, '') || '/';
      if (!path.startsWith('/')) path = `/${path}`;
      if (next === 'en') path = path === '/' ? '/en' : `/en${path}`;
      else if (next === 'zh-Hant') path = path === '/' ? '/zh-hant' : `/zh-hant${path}`;
      url.pathname = path;
      url.searchParams.delete('lang');
      window.location.assign(url.toString());
    } catch {
      window.location.reload();
    }
  };

  const shell =
    variant === 'light'
      ? 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]'
      : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius)] border p-0.5',
        shell,
        className
      )}
      role="group"
      aria-label={t('language')}
      data-no-i18n
    >
      {SITE_LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onPick(code)}
            className={cn(
              'rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold leading-none transition',
              active
                ? 'bg-[color:var(--brand)] text-white shadow-sm'
                : 'text-[color:var(--ink-3)] hover:bg-[color:var(--paper)] hover:text-[color:var(--ink-1)]'
            )}
            aria-pressed={active}
            title={LOCALE_FULL_LABELS[code]}
          >
            {compact ? LOCALE_LABELS[code] : LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
