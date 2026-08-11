import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
import { FeaturedToolsStrip } from '@/components/home/featured-tools-strip';
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const stats = getSystemCapabilityStats();
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = funnelCopy(locale);
  const initialSource = sp.source || sp.from || 'home_workspace';
  const initialIntent = sp.intent || null;
  // Real V6 demo curves for product education (not user data)
  const klineSamples = getKlineShowcaseSamples();

  const seoPack = getPageSeoGeoPack('/');
  return (
    <AppPage header={{ ctaHref: '#analyze-workspace', ctaLabel: copy.ctaStart, compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="home_page_viewed"
        page="/"
        meta={{ surface: 'workspace', intent: initialIntent, source: initialSource, locale, geoReady: true }}
      />
      <FunnelPageView event="home_page_view" sourceFallback="home" />
      <FeaturedToolsStrip />
            <Suspense
        fallback={
          <div className="page-content-wide space-y-4 py-6 md:py-8">
            <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                工作台
              </p>
              <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[color:var(--ink-1)]">
                填生辰，先出结构判断
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-4)]">
                免费生成人生 K 线报告：日主用神、阶段窗口与可执行下一步。加载交互表单中…
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {['事业节奏', '合婚匹配', '财富窗口'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-[12px] font-medium text-[color:var(--ink-3)]"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </section>
            <p className="text-center text-[12px] text-[color:var(--ink-5)]">{copy.loadingWorkspace}</p>
          </div>
        }
      >
        <AnalyzeWorkspace
          stats={stats}
          activePath="/"
          source="home_workspace"
          initialIntent={initialIntent}
          initialSource={initialSource}
        />
      </Suspense>
      {klineSamples.length > 0 ? (
        <div className="page-content-wide pb-8 pt-2 md:pb-10">
          <LifeKlineShowcase samples={klineSamples} ctaHref="#analyze-workspace" />
        </div>
      ) : null}
      <div className="page-content pb-16">
        <PageSeoGeoSection pathOrSlug="/" />
      </div>
    </AppPage>
  );
}
