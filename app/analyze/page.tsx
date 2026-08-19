import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
import { PrestigeBanner } from '@/components/brand/prestige-banner';
import { AppPage } from '@/components/layout/app-page';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { withLocalePrefix } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { funnelCopy, funnelMeta } from '@/lib/i18n/funnel-copy';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

interface AnalyzePageProps {
  searchParams?: Promise<{
    intent?: string;
    source?: string;
    from?: string;
    birthDate?: string;
    birthPlace?: string;
    name?: string;
    lang?: string;
  }>;
}

export async function generateMetadata({ searchParams }: AnalyzePageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const meta = funnelMeta('analyze', locale);
  const pack = getPageSeoGeoPack('/analyze');
  return metadataFromPagePack('/analyze', {
    title: pack?.title || meta.title,
    description: pack?.description || meta.description,
    path: withLocalePrefix('/analyze', locale),
    locale,
  });
}

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const stats = getSystemCapabilityStats();
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = funnelCopy(locale);
  const initialSource = sp.source || sp.from || 'analyze_workspace';
  const initialIntent = sp.intent || null;

  const seoPack = getPageSeoGeoPack('/analyze');
  return (
    <AppPage header={{ ctaHref: '#analyze-workspace', ctaLabel: copy.ctaStart, compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="analyze_page_viewed"
        page="/analyze"
        meta={{
          surface: 'workspace',
          intent: initialIntent,
          source: initialSource,
          locale,
          geoReady: true,
        }}
      />
      <div className="page-content-wide pt-5 md:pt-6">
        <PrestigeBanner
          compact
          headingAs="p"
          priority
          eyebrow={copy.prestigeEyebrow}
          title={copy.heroTitle}
          description={copy.heroDescription}
          seal={copy.prestigeSeal}
        />
      </div>
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
        <AnalyzeWorkspace
          stats={stats}
          activePath="/analyze"
          source="analyze_workspace"
          initialIntent={initialIntent}
          initialSource={initialSource}
          layout="inline"
        />
      </Suspense>
      <div className="page-content pb-16">
        <PageSeoGeoSection pathOrSlug="/analyze" />
      </div>
    </AppPage>
  );
}
