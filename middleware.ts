import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveLegacyRedirect } from '@/lib/legacy-path-redirects';
import { TOOL_SLUG_ALIASES } from '@/lib/tool-slug-aliases';
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
  resolveSiteLocale,
} from '@/lib/i18n/site-locale';

// Bots to block at the Next.js level (complements nginx rate limiting).
// These bots cause SSR compilation storms. Blocking here prevents any
// Next.js processing cost for bot requests.
const AGGRESSIVE_BOT_PATTERNS = [
  /ClaudeBot/i,
  /SemrushBot/i,
  /Amazonbot/i,
  /GPTBot/i,
  /PerplexityBot/i,
  /Bytespider/i,
  /AhrefsBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /PetalBot/i,
  /YandexBot/i,
  /DataForSeoBot/i,
  /meta-externalagent/i,
  /facebookexternalhit/i,
];

function isAggressiveBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return AGGRESSIVE_BOT_PATTERNS.some((p) => p.test(userAgent));
}

/** Permanent redirect preserving query string (utm / source). */
function permanentRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // English content entities use their own public slug (for example `foo-en`).
  // Resolve their server rendering in English without changing the canonical URL.
  const contentEntityMatch = pathname.match(
    /^\/(?:knowledge|cases)\/([^/]+)$|^\/insights\/[^/]+\/([^/]+)$/i,
  );
  const contentSlug = contentEntityMatch?.[1] || contentEntityMatch?.[2] || '';
  if (!request.nextUrl.searchParams.has('lang')
    && (/-en$/i.test(contentSlug) || /^world-yi-en-/i.test(contentSlug))) {
    const url = request.nextUrl.clone();
    url.searchParams.set('lang', 'en');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, 'en');
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.headers.set(LOCALE_HEADER, 'en');
    response.headers.set('Vary', 'Accept-Language, Cookie');
    return response;
  }

  // Locale path prefixes: /en/..., /zh-hant/... → rewrite to bare path + lang
  // (hreflang-safe; Next Metadata keeps path segments, drops ?query)
  const localePrefixMatch = pathname.match(/^\/(en|zh-hant|zh-tw|zh-hk)(\/.*)?$/i);
  if (localePrefixMatch) {
    const prefix = localePrefixMatch[1].toLowerCase();
    const rest = localePrefixMatch[2] || '/';
    const restPath = rest === '' ? '/' : rest;

    // Legacy product paths under locale prefix → 308 to canonical hub
    // (keep locale via rewrite path after redirect lands on bare target).
    const legacyTarget = resolveLegacyRedirect(restPath);
    if (legacyTarget) {
      return permanentRedirect(request, legacyTarget);
    }

    const mappedLocale =
      prefix === 'en' ? 'en' : 'zh-Hant';
    const url = request.nextUrl.clone();
    url.pathname = restPath;
    url.searchParams.set('lang', mappedLocale);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, mappedLocale);
    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE, mappedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    response.headers.set(LOCALE_HEADER, mappedLocale);
    response.headers.set('Vary', 'Accept-Language, Cookie');
    return response;
  }

  // Bare legacy marketing paths (empty app/* dirs or retired SEO URLs)
  const bareLegacy = resolveLegacyRedirect(pathname);
  if (bareLegacy) {
    return permanentRedirect(request, bareLegacy);
  }

  const toolMatch = pathname.match(/^\/tools\/([^/]+)\/?$/);
  if (toolMatch) {
    const canonical = TOOL_SLUG_ALIASES[toolMatch[1]];
    if (canonical) {
      return permanentRedirect(request, `/tools/${canonical}`);
    }
  }

  // Early bot rejection — return 429 before any SSR work
  const ua = request.headers.get('user-agent');
  if (isAggressiveBot(ua)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '3600',
        'Content-Type': 'text/plain',
      },
    });
  }

  const queryLang = request.nextUrl.searchParams.get('lang');
  const cookieLang = request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = request.headers.get('accept-language');
  const locale = resolveSiteLocale({
    queryLang,
    cookieLang,
    acceptLanguage,
  });

  // Expose locale to server components via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Persist auto-detected / query locale so subsequent navigations stay consistent
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (queryLang || !existing || existing !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  response.headers.set(LOCALE_HEADER, locale);
  // Ensure CDN/browser variants by language preference
  response.headers.set('Vary', 'Accept-Language, Cookie');

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|icon.svg|.*\\..*).*)',
  ],
};
