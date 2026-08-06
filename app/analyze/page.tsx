import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
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
            <Suspense
        fallback={
          <div className="page-content-wide space-y-4 py-6 md:py-8">
            <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-sm">
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
                {['事业节奏', '财富窗口', '关系边界'].map((label) => (
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
          activePath="/analyze"
          source="analyze_workspace"
          initialIntent={initialIntent}
          initialSource={initialSource}
        />
      </Suspense>
      <div className="page-content pb-16">
        <PageSeoGeoSection pathOrSlug="/analyze" />
      </div>
    </AppPage>
  );
}
