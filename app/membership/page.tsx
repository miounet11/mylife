import type { Metadata } from 'next';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { membershipPageCopy } from '@/lib/i18n/membership-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';
import MembershipClient from './membership-client';

interface MembershipPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: MembershipPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = membershipPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/membership', locale),
    locale,
    keywords: copy.metaKeywords,
    multiLanguage: true,
  });
}

export default async function MembershipPage({ searchParams }: MembershipPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = membershipPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);

  const membershipJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.life-kline.com/membership#webpage',
        url: 'https://www.life-kline.com/membership',
        name: copy.jsonLdPageName,
        description: copy.jsonLdPageDescription,
        inLanguage: copy.jsonLdInLanguage,
        isPartOf: { '@id': 'https://www.life-kline.com/#website' },
      },
      {
        '@type': 'Product',
        name: copy.jsonLdProductName,
        description: copy.jsonLdProductDescription,
        brand: { '@type': 'Brand', name: 'Life K-Line' },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY',
          availability: 'https://schema.org/InStock',
          url: 'https://www.life-kline.com/membership?source=seo_offer',
          priceValidUntil: '2026-12-31',
          description: copy.jsonLdOfferDescription,
        },
      },
    ],
  };

  return (
    <AppPage header={{ ctaHref: '/login?next=%2Fmembership', ctaLabel: copy.headerCta, compact: true }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(membershipJsonLd) }}
      />
      <AnalyticsPageView eventName="membership_page_viewed" page="/membership" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />
        <PageIllustrationStrip
          surface="membership/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '会员能做什么',
            'zh-Hant': '會員能做什麼',
            en: 'What membership unlocks',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />
        <MembershipClient locale={uiLocale} />
      </div>
    </AppPage>
  );
}
