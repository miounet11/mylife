import type { Metadata } from 'next';
import Link from 'next/link';
import ProfileSettingsPanel from '@/components/profile-settings-panel';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getAuthSession } from '@/lib/auth';
import { profileSettingsPageCopy } from '@/lib/i18n/profile-settings-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface ProfileSettingsPageProps {
  searchParams: Promise<{ fortuneId?: string; tab?: string; highlight?: string; lang?: string }>;
}

export async function generateMetadata({ searchParams }: ProfileSettingsPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const locale = await getRequestLocale(sp.lang);
  const copy = profileSettingsPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/profile/settings', locale),
    locale,
    noIndex: true,
  });
}

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  // Guest cookie identity is created by API routes / client session, not RSC page render.
  // Next.js 15 forbids cookie writes during Server Component render.
  const session = await getAuthSession();
  const params = await searchParams;
  const uiLocale = await getRequestLocale(params.lang);
  const copy = profileSettingsPageCopy(uiLocale);

  return (
    <AppPage
      header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}
      showFooter={false}
      mainClassName="page-frame max-w-3xl py-6 pb-20 md:py-8 md:pb-24"
    >
      <div className="space-y-5 px-4 md:px-0">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={
            session.authenticated
              ? copy.descriptionAuthed
              : copy.descriptionGuest
          }
          actions={
            <>
              <Link href="/profile" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.backToProfile}
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.askTeachers}
              </Link>
            </>
          }
        />
        <ProfileSettingsPanel
          locale={uiLocale}
          initialFortuneId={params.fortuneId || ''}
          initialTab={params.tab || ''}
          initialHighlight={params.highlight || ''}
        />
      </div>
    </AppPage>
  );
}
