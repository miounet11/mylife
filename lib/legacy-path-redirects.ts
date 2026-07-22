/**
 * Legacy marketing / product paths that no longer have App Router pages.
 * Keep 308 permanent so SEO equity and old bookmarks land on current hubs.
 *
 * Paths are bare (no locale prefix). Middleware strips /en|/zh-hant first.
 */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  // Old free-entry / chart marketing URLs → analyze workspace
  '/bazi': '/analyze',
  '/free-bazi': '/analyze',
  '/bazipan': '/analyze',
  '/paipan': '/analyze',
  '/suanming': '/analyze',
  '/mingpan': '/analyze',

  // Old product naming → current hubs
  '/life-kline': '/',
  '/kline': '/',
  '/fortune': '/dimensions/fortune-rhythm',
  '/yunshi': '/dimensions/fortune-rhythm',
  '/liunian': '/tools/timing-yearly-window',
  '/liunian-report': '/tools/timing-yearly-window',
  '/dayun': '/dimensions/fortune-rhythm',

  // Old member / report entry
  '/member-report': '/membership',
};

/** Normalize trailing slash and case for lookup. */
export function normalizeLegacyPath(pathname: string): string {
  if (!pathname) return '/';
  let p = pathname.split('?')[0] || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.toLowerCase();
}

export function resolveLegacyRedirect(pathname: string): string | null {
  const key = normalizeLegacyPath(pathname);
  return LEGACY_PATH_REDIRECTS[key] || null;
}
