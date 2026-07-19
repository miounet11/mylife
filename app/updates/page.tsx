import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import DailyWindowStrip from '@/components/daily/daily-window-strip';
import SubscriptionSettingsPanel from '@/components/subscription-settings-panel';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import PwaInstallHint from '@/components/pwa/install-hint';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { updatesPageCopy } from '@/lib/i18n/updates-copy';
import { toIllustLocale } from '@/lib/page-illustrations/locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface UpdatesPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: UpdatesPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = updatesPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/updates', locale),
    locale,
    noIndex: true,
  });
}

export default async function UpdatesPage({ searchParams }: UpdatesPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = updatesPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta }}>
      <div className="mx-auto max-w-3xl px-4 pt-5 md:pt-6">
        <DailyWindowStrip compact source="updates_daily_strip" locale={uiLocale} />
      </div>
      <FocusHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <Link href="/updates/messages" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            {copy.linkMailCenter}
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <PageIllustrationStrip
          surface="updates/hub"
          title={copy.stripTitle}
          compact
          limit={1}
          locale={illustLocale}
        />
      </div>
      <div id="my-updates-center">
        <SubscriptionSettingsPanel locale={uiLocale} />
      </div>
      <PwaInstallHint />
    </AppPage>
  );
}
