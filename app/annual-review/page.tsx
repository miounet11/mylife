import type { Metadata } from 'next';
import Link from 'next/link';
import AnnualReviewPageBody from '@/components/annual-review/annual-review-page-body';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { annualReviewPageCopy } from '@/lib/i18n/annual-review-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface AnnualReviewPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: AnnualReviewPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = annualReviewPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/annual-review', locale),
    locale,
    noIndex: true,
  });
}

export default async function AnnualReviewPage({ searchParams }: AnnualReviewPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = annualReviewPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);

  return (
    <AppPage header={{ ctaHref: '/profile', ctaLabel: copy.headerCta, compact: true }}>
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
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkDimensions}
              </Link>
              <Link href="/profile/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkEvents}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="annual-review/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '复盘闭环',
            'zh-Hant': '復盤閉環',
            en: 'Review loop',
          })}
          compact
          limit={1}
          locale={illustLocale}
        />

        <AnnualReviewPageBody locale={uiLocale} />

        <section className="border-t border-[color:var(--hairline)] pt-4">
          <h2 className="text-[13px] font-medium text-[color:var(--ink-1)]">{copy.footerTitle}</h2>
          <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{copy.footerBody}</p>
          <Link
            href="/analyze"
            className="mt-2 inline-block text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            {copy.footerCta}
          </Link>
        </section>
      </div>
    </AppPage>
  );
}
