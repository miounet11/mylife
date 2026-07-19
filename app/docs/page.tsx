import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import { docsPageCopy, presentDocEntries } from '@/lib/i18n/docs-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { toIllustLocale } from '@/lib/page-illustrations/locale';
import { DOC_ENTRIES } from '@/lib/portal-nav';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface DocsPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: DocsPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = docsPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/docs', locale),
    locale,
  });
}

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = docsPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const entries = presentDocEntries(DOC_ENTRIES, uiLocale);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}>
      <AnalyticsPageView
        eventName="docs_page_viewed"
        page="/docs"
        meta={{ surfaceKey: 'docs' }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkAnalyze}
              </Link>
              <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkLearn}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="docs/hub"
          title={copy.stripTitle}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">{copy.sectionsTitle}</h2>
          <EntryLinkGrid items={entries} />
        </section>
      </div>
    </AppPage>
  );
}
