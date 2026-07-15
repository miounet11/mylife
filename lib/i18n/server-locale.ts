import { cookies, headers } from 'next/headers';
import {
  type SiteLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  resolveSiteLocale,
} from '@/lib/i18n/site-locale';

/** Resolve locale for RSC / server pages (middleware + cookie + Accept-Language). */
export async function getRequestLocale(queryLang?: string | null): Promise<SiteLocale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveSiteLocale({
    queryLang,
    cookieLang: cookieStore.get(LOCALE_COOKIE)?.value || headerStore.get(LOCALE_HEADER),
    acceptLanguage: headerStore.get('accept-language'),
  });
}
