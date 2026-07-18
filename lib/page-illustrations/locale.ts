import type { PageIllustLocale } from '@/lib/page-illustrations/catalog';
import type { SiteLocale } from '@/lib/i18n/site-locale';

/** Map product UI locale → illustration on-image language. */
export function toIllustLocale(locale?: SiteLocale | string | null): PageIllustLocale {
  const v = `${locale || 'zh-CN'}`.toLowerCase();
  if (v.startsWith('en')) return 'en';
  if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh-Hant';
  return 'zh-CN';
}

export function illustStripTitle(
  locale: SiteLocale | string | null | undefined,
  titles: { 'zh-CN': string; 'zh-Hant'?: string; en?: string },
): string {
  const loc = toIllustLocale(locale);
  if (loc === 'en') return titles.en || titles['zh-CN'];
  if (loc === 'zh-Hant') return titles['zh-Hant'] || titles['zh-CN'];
  return titles['zh-CN'];
}
