import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { loginPageCopy } from '@/lib/i18n/login-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface LoginPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: LoginPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = loginPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/login', locale),
    locale,
    noIndex: true,
  });
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = loginPageCopy(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/membership', ctaLabel: copy.headerCta, compact: true }} showFooter={false}>
      <div className="mx-auto max-w-md space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/membership" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkMembership}
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkAnalyze}
              </Link>
            </>
          }
        />
        <Suspense fallback={<div className="py-4 text-sm text-[color:var(--ink-5)]">{copy.loading}</div>}>
          <LoginForm locale={uiLocale} />
        </Suspense>
      </div>
    </AppPage>
  );
}
