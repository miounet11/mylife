import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import PredictionsListPage from '@/components/predictions/predictions-list-page';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { predictionsPageCopy } from '@/lib/i18n/predictions-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface PredictionsPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: PredictionsPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = predictionsPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/predictions', locale),
    locale,
    noIndex: true,
  });
}

export default async function PredictionsPage({ searchParams }: PredictionsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = predictionsPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: copy.headerCta, compact: true }}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkDimensions}
              </Link>
              <Link href="/annual-review" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkAnnualReview}
              </Link>
              <Link href="/history" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkHistory}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="predictions/revisit"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '回访闭环',
            'zh-Hant': '回訪閉環',
            en: 'Check-in loop',
          })}
          compact
          limit={1}
          locale={illustLocale}
        />
        <Suspense
          fallback={
            <div className="py-8 text-center text-[13px] text-[color:var(--ink-5)]">{copy.loadingList}</div>
          }
        >
          <PredictionsListPage locale={uiLocale} />
        </Suspense>
      </div>
    </AppPage>
  );
}
