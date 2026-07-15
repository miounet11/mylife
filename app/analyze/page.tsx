import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze/analyze-workspace';
import { AppPage } from '@/components/layout/app-page';
import { getSystemCapabilityStats } from '@/lib/system-capability-stats';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { funnelCopy, funnelMeta } from '@/lib/i18n/funnel-copy';

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
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: withLocalePrefix('/analyze', locale),
    locale,
    keywords: ['免费八字测算', '八字工作台', '判断报告', '十维度', 'bazi workbench', 'Life K-Line'],
  });
}

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const stats = getSystemCapabilityStats();
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = funnelCopy(locale);
  const initialSource = sp.source || sp.from || 'analyze_workspace';
  const initialIntent = sp.intent || null;

  return (
    <AppPage header={{ ctaHref: '#analyze-workspace', ctaLabel: copy.ctaStart, compact: true }}>
      <AnalyticsPageView
        eventName="analyze_page_viewed"
        page="/analyze"
        meta={{
          surface: 'workspace',
          intent: initialIntent,
          source: initialSource,
          locale,
        }}
      />
      <Suspense fallback={<div className="fb-card p-5 text-[13px] font-medium text-[color:var(--ink-3)]">{copy.loadingWorkspace}</div>}>
        <AnalyzeWorkspace
          stats={stats}
          activePath="/analyze"
          source="analyze_workspace"
          initialIntent={initialIntent}
          initialSource={initialSource}
        />
      </Suspense>
    </AppPage>
  );
}
