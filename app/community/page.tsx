import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FeatureImmersionHero } from '@/components/brand/feature-immersion-hero';
import {
  communityPageCopy,
  presentCommunityCategories,
} from '@/lib/i18n/community-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { toIllustLocale } from '@/lib/page-illustrations/locale';
import { COMMUNITY_CATEGORIES } from '@/lib/portal-nav';
import { withLocalePrefix } from '@/lib/seo';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

interface CommunityPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: CommunityPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = communityPageCopy(locale);
  const pack = getPageSeoGeoPack('/community');
  return metadataFromPagePack('/community', {
    title: pack?.title || copy.metaTitle,
    description: pack?.description || copy.metaDescription,
    path: withLocalePrefix('/community', locale),
    locale,
  });
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = communityPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const categories = presentCommunityCategories(COMMUNITY_CATEGORIES, uiLocale);
  const seoPack = getPageSeoGeoPack('/community');

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FeatureImmersionHero
          surfaceKey="community"
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          compact
          actions={
            <>
              <Link href="/community/search" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkSearch}
              </Link>
              <Link href="/chat" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkChat}
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkTeachers}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="community/hub"
          title={copy.stripTitle}
          compact
          limit={1}
          locale={illustLocale}
        />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">{copy.sectionsTitle}</h2>
          <EntryLinkGrid items={categories} />
        </section>
        <PageSeoGeoSection pathOrSlug="/community" />
        <p className="border-t border-[color:var(--hairline)] pt-4 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
          {copy.footerBefore}{' '}
          <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkLearn}
          </Link>{' '}
          {copy.footerOr}{' '}
          <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkKnowledge}
          </Link>{' '}
          {copy.footerAfter}
        </p>
      </div>
    </AppPage>
  );
}
