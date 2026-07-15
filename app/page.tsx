import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
import { AppPage } from '@/components/layout/app-page';
import { FunnelPageView } from '@/components/funnel-tracker';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { funnelCopy, funnelMeta } from '@/lib/i18n/funnel-copy';

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
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: withLocalePrefix('/', locale),
    locale,
    keywords: ['免费八字', '人生K线', '十维度研判', '流年大运', 'bazi chart', 'Life K-Line'],
  });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const stats = getSystemCapabilityStats();
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = funnelCopy(locale);
  const initialSource = sp.source || sp.from || 'home_workspace';
  const initialIntent = sp.intent || null;

  return (
    <AppPage header={{ ctaHref: '#analyze-workspace', ctaLabel: copy.ctaStart, compact: true }}>
      <AnalyticsPageView
        eventName="home_page_viewed"
        page="/"
        meta={{ surface: 'workspace', intent: initialIntent, source: initialSource, locale }}
      />
      <FunnelPageView event="home_page_view" sourceFallback="home" />
      <Suspense fallback={<div className="fb-card p-4 text-sm text-[color:var(--ink-3)]">{copy.loadingWorkspace}</div>}>
        <AnalyzeWorkspace
          stats={stats}
          activePath="/"
          source="home_workspace"
          initialIntent={initialIntent}
          initialSource={initialSource}
        />
      </Suspense>
    </AppPage>
  );
}
