import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AlmanacApp from '@/components/almanac/almanac-app';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FeatureImmersionHero } from '@/components/brand/feature-immersion-hero';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { todayDateString } from '@/lib/almanac/day-pack';
import { almanacHubCopy } from '@/lib/i18n/almanac-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import { buildPageMetadata, buildProductLanguageAlternates, withLocalePrefix } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = (await getRequestLocale(sp.lang)) as SiteLocale;
  const copy = almanacHubCopy(locale);
  const pack = getPageSeoGeoPack('/almanac');
  const base = buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription.slice(0, 160),
    path: withLocalePrefix('/almanac', locale === 'en' ? 'en' : locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN'),
    locale: locale === 'en' ? 'en' : locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN',
    keywords: pack?.keywords,
    multiLanguage: true,
    languages: buildProductLanguageAlternates('/almanac'),
  });
  return {
    ...base,
    other: {
      ...((base.other as Record<string, string>) || {}),
      ...(pack?.answerSummary ? { 'ai-answer-summary': pack.answerSummary.slice(0, 400) } : {}),
      'geo-ready': '1',
    },
  };
}

export default async function AlmanacPage({
  searchParams,
}: {
  searchParams?: Promise<{
    date?: string;
    year?: string;
    month?: string;
    stay?: string;
    skin?: string;
    region?: string;
    lang?: string;
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = (await getRequestLocale(sp.lang)) as SiteLocale;
  const copy = almanacHubCopy(locale);
  const today = todayDateString();

  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.stay !== '1') {
    const q = new URLSearchParams();
    if (sp.skin) q.set('skin', sp.skin);
    if (sp.region) q.set('region', sp.region);
    if (sp.lang) q.set('lang', sp.lang);
    const qs = q.toString();
    redirect(`/almanac/${sp.date}${qs ? `?${qs}` : ''}`);
  }

  const date = today;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const year = m ? Number(m[1]) : new Date().getFullYear();
  const month = m ? Number(m[2]) : new Date().getMonth() + 1;
  const seoPack = getPageSeoGeoPack('/almanac');

  return (
    <AppPage header={{ ctaHref: '/analyze?source=almanac', ctaLabel: copy.ctaReport, compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="almanac_page_viewed"
        page="/almanac"
        meta={{ surfaceKey: 'almanac', date, locale, geoReady: true }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FeatureImmersionHero
          surfaceKey="almanac"
          compact
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link
                href={`/almanac/${today}?skin=tear${sp.lang ? `&lang=${sp.lang}` : ''}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.linkTear}
              </Link>
              <Link
                href={`/almanac/${today}?skin=personal${sp.lang ? `&lang=${sp.lang}` : ''}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.linkPersonal}
              </Link>
              <Link
                href={`/almanac/${today}?region=global&skin=global${sp.lang ? `&lang=${sp.lang}` : ''}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.linkGlobal}
              </Link>
              <Link
                href="/analyze?source=almanac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.linkReport}
              </Link>
            </>
          }
          footer={<span className="text-[12px] text-[color:var(--ink-5)]">{copy.todayUrl(today)}</span>}
        />
        <PageIllustrationStrip
          surface="almanac/hub"
          title="通书 × 日运"
          compact
          limit={1}
          priority
        />
        <AlmanacApp
          initialYear={year}
          initialMonth={month}
          initialDate={date}
          navigateOnSelect
          initialSkin={sp.skin || 'tear'}
          initialRegion={sp.region}
          locale={locale}
        />
        <PageSeoGeoSection pathOrSlug="/almanac" />
      </div>
    </AppPage>
  );
}
