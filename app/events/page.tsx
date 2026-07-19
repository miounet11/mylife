import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import EventsHub from '@/components/events/events-hub';
import { FocusHero } from '@/components/layout/focus-hero';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { eventsPageCopy } from '@/lib/i18n/events-copy';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface EventsPageProps {
  searchParams?: Promise<{ reportId?: string; lang?: string }>;
}

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = eventsPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/events', locale),
    locale,
    noIndex: true,
  });
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = eventsPageCopy(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/predictions', ctaLabel: copy.headerCta, compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkPredictions}
              </Link>
              <Link href="/profile/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkProfileEvents}
              </Link>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkHistory}
              </Link>
            </>
          }
        />
        <EventsHub reportId={sp.reportId} locale={uiLocale} />
      </div>
    </AppPage>
  );
}
