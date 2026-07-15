'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type SiteLocale,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  htmlLangAttr,
  normalizeSiteLocale,
  resolveSiteLocale,
} from '@/lib/i18n/site-locale';
import { uiMessage } from '@/lib/i18n/ui-messages';

type LocaleContextValue = {
  locale: SiteLocale;
  setLocale: (next: SiteLocale, opts?: { persist?: boolean }) => void;
  t: (key: string) => string;
  /** Free-text localize (SC→TC); English returns original. */
  L: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(locale: SiteLocale) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

function readClientHints(): SiteLocale | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const fromStorage = normalizeSiteLocale(stored);
    if (fromStorage) return fromStorage;
  } catch {
    // ignore
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language || (navigator as { userLanguage?: string }).userLanguage : null;
  const langs = typeof navigator !== 'undefined' && Array.isArray(navigator.languages)
    ? navigator.languages.join(',')
    : nav;
  return resolveSiteLocale({
    navigatorLanguage: nav,
    acceptLanguage: langs,
  });
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: SiteLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<SiteLocale>(initialLocale);

  // First client paint: honor stored preference or system language if cookie not set yet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeSiteLocale(params.get('lang'));
    if (fromQuery) {
      setLocaleState(fromQuery);
      writeCookie(fromQuery);
      return;
    }
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
    const fromCookie = normalizeSiteLocale(cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null);
    if (fromCookie) {
      setLocaleState(fromCookie);
      return;
    }
    const fromSystem = readClientHints();
    if (fromSystem && fromSystem !== initialLocale) {
      setLocaleState(fromSystem);
      writeCookie(fromSystem);
    } else if (fromSystem) {
      writeCookie(fromSystem);
    }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = htmlLangAttr(locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((next: SiteLocale, opts?: { persist?: boolean }) => {
    setLocaleState(next);
    if (opts?.persist !== false) writeCookie(next);
  }, []);

  const t = useCallback((key: string) => uiMessage(key, locale), [locale]);

  const L = useCallback(
    (text: string) => {
      if (!text) return text;
      if (locale === 'zh-Hant') {
        try {
          // sync path for simple calls — AutoLocalize handles bulk DOM
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { tify } = require('chinese-conv') as { tify: (s: string) => string };
          return tify(text);
        } catch {
          return text;
        }
      }
      return text;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, L }),
    [locale, setLocale, t, L]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback for components outside provider
    return {
      locale: 'zh-CN' as SiteLocale,
      setLocale: () => undefined,
      t: (key: string) => uiMessage(key, 'zh-CN'),
      L: (text: string) => text,
    };
  }
  return ctx;
}
