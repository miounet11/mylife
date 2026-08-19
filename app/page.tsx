import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
import { HomeExplore } from '@/components/home/home-explore';
import { HomeHero } from '@/components/home/home-hero';
import LifeKlineShowcase from '@/components/kline/life-kline-showcase';
import { AppPage } from '@/components/layout/app-page';
import { FunnelPageView } from '@/components/funnel-tracker';
import { getKlineShowcaseSamples } from '@/lib/kline-showcase';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { withLocalePrefix } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { funnelCopy, funnelMeta } from '@/lib/i18n/funnel-copy';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

interface HomePageProps {
  searchParams?: Promise<{
    intent?: string;
    source?: string;
    from?: string;
    lang?: string;
  }>;
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const meta = funnelMeta('home', locale);
  const pack = getPageSeoGeoPack('/');
  return metadataFromPagePack('/', {
    title: pack?.title || meta.title,
    description: pack?.description || meta.description,
    path: withLocalePrefix('/', locale),
    locale,
  });
}

/**
 * Homepage = natal form first (astro.com pattern), then product education.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const stats = getSystemCapabilityStats();
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = funnelCopy(locale);
  const initialSource = sp.source || sp.from || 'home_workspace';
  const initialIntent = sp.intent || null;
  const klineSamples = getKlineShowcaseSamples();
  const seoPack = getPageSeoGeoPack('/');

  return (
    <AppPage
      header={{ ctaHref: '#analyze-workspace', ctaLabel: copy.ctaStart, compact: true }}
      mainClassName="page-frame pb-16 pt-0 md:pb-20"
    >
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="home_page_viewed"
        page="/"
        meta={{
          surface: 'workspace',
          intent: initialIntent,
          source: initialSource,
          locale,
          geoReady: true,
          layout: 'home_v2',
        }}
      />
      <FunnelPageView event="home_page_view" sourceFallback="home" />

      <HomeHero
        locale={locale}
        eyebrow={copy.prestigeEyebrow}
        title={copy.prestigeTitle}
        description={copy.prestigeDescription}
        seal={copy.prestigeSeal}
        ctaLabel={copy.ctaStart}
      />

      {/* Birth form is the homepage — astro.com natal pattern */}
      <Suspense
        fallback={
          <div className="page-content-wide py-6 md:py-8">
            <section className="mx-auto max-w-[40rem] rounded-[12px] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-5 py-6 shadow-[var(--shadow-card)]">
              <p className="text-[11px] font-medium tracking-[0.12em] text-[color:var(--ink-5)]">
                LIFE K-LINE
              </p>
              <h1 className="mt-2 text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-[color:var(--ink-1)]">
                免费看清结构、阶段与下一步
              </h1>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[color:var(--ink-4)]">
                填出生日期、时间和地点即可。不必先注册。
              </p>
            </section>
          </div>
        }
      >
        <div className="border-b border-[color:var(--hairline)]">
          <AnalyzeWorkspace
            stats={stats}
            activePath="/"
            source="home_workspace"
            initialIntent={initialIntent}
            initialSource={initialSource}
            layout="inline"
          />
        </div>
      </Suspense>

      {/* 3 · Product education: real V6 demo curves */}
      {klineSamples.length > 0 ? (
        <div className="page-content-wide py-8 md:py-10">
          <LifeKlineShowcase samples={klineSamples} ctaHref="#analyze-workspace" />
        </div>
      ) : null}

      {/* 4 · Secondary paths & tools */}
      <HomeExplore />

      {/* 5 · SEO / GEO */}
      <div className="page-content pb-10 pt-8 md:pb-12">
        <PageSeoGeoSection pathOrSlug="/" />
      </div>
    </AppPage>
  );
}
