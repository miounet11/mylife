/**
 * Backward-compatible helpers used by community pages.
 * Prefer `@/lib/i18n/site-locale` for new code (includes English).
 */

import {
  type SiteLocale,
  resolveSiteLocale,
  toSiteLocaleText,
} from '@/lib/i18n/site-locale';

/** @deprecated use SiteLocale — kept for community imports */
export type Locale = SiteLocale;

export function detectLocaleFromQuery(lang?: string | null): Locale {
  return resolveSiteLocale({ queryLang: lang });
}

export function toLocale(text: string, locale: Locale): string {
  return toSiteLocaleText(text || '', locale);
}

export function localizeFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  locale: Locale
): T {
  if (locale === 'zh-CN' || locale === 'en') return obj;
  const out = { ...obj };
  for (const f of fields) {
    const v = out[f];
    if (typeof v === 'string') {
      (out as Record<string, unknown>)[f as string] = toSiteLocaleText(v, locale);
    }
  }
  return out;
}

export { resolveSiteLocale, toSiteLocaleText };
