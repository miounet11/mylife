/**
 * Site-wide locale: 简体中文 / 繁體中文 / English
 * Auto-detect from: ?lang= → cookie (user choice) → Accept-Language → zh-CN
 */

export type SiteLocale = 'zh-CN' | 'zh-Hant' | 'en';

export const SITE_LOCALES: SiteLocale[] = ['zh-CN', 'zh-Hant', 'en'];

export const LOCALE_COOKIE = 'lk_locale';
export const LOCALE_STORAGE_KEY = 'lk_locale';
export const LOCALE_HEADER = 'x-lk-locale';

export const LOCALE_LABELS: Record<SiteLocale, string> = {
  'zh-CN': '简体',
  'zh-Hant': '繁體',
  en: 'EN',
};

export const LOCALE_FULL_LABELS: Record<SiteLocale, string> = {
  'zh-CN': '简体中文',
  'zh-Hant': '繁體中文',
  en: 'English',
};

const TRADITIONAL_HINT =
  /zh[-_]?(tw|hk|mo|hant)|chinese[-_]?trad|繁體|繁体|台灣|台湾|香港|澳門|澳门/i;
const ENGLISH_HINT = /^en\b|english/i;
const SIMPLIFIED_HINT = /zh[-_]?(cn|sg|hans)|chinese[-_]?simp|简体|簡體/i;

export function normalizeSiteLocale(raw?: string | null): SiteLocale | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!v) return null;
  if (v === 'en' || v.startsWith('en-') || ENGLISH_HINT.test(v)) return 'en';
  if (
    v === 'zh-hant'
    || v === 'zh-tw'
    || v === 'zh-hk'
    || v === 'zh-mo'
    || v === 'hant'
    || TRADITIONAL_HINT.test(v)
  ) {
    return 'zh-Hant';
  }
  if (
    v === 'zh'
    || v === 'zh-cn'
    || v === 'zh-sg'
    || v === 'zh-hans'
    || v === 'cn'
    || SIMPLIFIED_HINT.test(v)
  ) {
    return 'zh-CN';
  }
  if (v.startsWith('zh')) return 'zh-CN';
  return null;
}

function fromAcceptLanguage(header?: string | null): SiteLocale | null {
  if (!header) return null;
  const parts = header.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';');
    const q = params.find((p) => p.trim().startsWith('q='));
    const quality = q ? Number(q.split('=')[1]) || 0 : 1;
    return { tag: tag.trim(), quality };
  });
  parts.sort((a, b) => b.quality - a.quality);
  for (const { tag } of parts) {
    const hit = normalizeSiteLocale(tag);
    if (hit) return hit;
  }
  return null;
}

/**
 * Resolve site locale.
 * Priority: explicit query/manual → cookie (user choice) → Accept-Language / navigator → zh-CN
 */
export function resolveSiteLocale(input: {
  queryLang?: string | null;
  cookieLang?: string | null;
  acceptLanguage?: string | null;
  navigatorLanguage?: string | null;
  /** When true, cookie wins over accept-language even if empty skip */
  preferCookie?: boolean;
} = {}): SiteLocale {
  return (
    normalizeSiteLocale(input.queryLang)
    || normalizeSiteLocale(input.cookieLang)
    || fromAcceptLanguage(input.acceptLanguage)
    || normalizeSiteLocale(input.navigatorLanguage)
    || 'zh-CN'
  );
}

export function htmlLangAttr(locale: SiteLocale): string {
  if (locale === 'en') return 'en';
  if (locale === 'zh-Hant') return 'zh-Hant';
  return 'zh-CN';
}

/** Convert Simplified → Traditional when locale is zh-Hant. */
export function toSiteLocaleText(text: string, locale: SiteLocale): string {
  if (!text || locale === 'zh-CN' || locale === 'en') return text;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('chinese-conv') as { tify?: (s: string) => string };
    if (typeof mod.tify === 'function') return mod.tify(text);
  } catch {
    // fall through
  }
  return text;
}

/** Browser-safe traditional conversion (dynamic import friendly). */
export async function toTraditionalAsync(text: string): Promise<string> {
  if (!text) return text;
  try {
    const mod = await import('chinese-conv');
    const tify = (mod as { tify?: (s: string) => string }).tify
      || (mod as { default?: { tify?: (s: string) => string } }).default?.tify;
    if (typeof tify === 'function') return tify(text);
  } catch {
    // ignore
  }
  return text;
}
