import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import AnalyticsPageView from '@/components/analytics-page-view';
import { FengshuiSimulatorForm } from '@/components/fengshui/fengshui-simulator-form';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';

const pack = getToolSeoGeoPack('fengshui-simulator')!;

export const metadata: Metadata = buildToolPageMetadata('fengshui-simulator');

export default async function FengshuiSimulatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string; source?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const en = `${locale}`.toLowerCase().startsWith('en');

  return (
    <AppPage header={{ ctaHref: '/tools', ctaLabel: en ? 'Tools' : '工具中心', compact: true }}>
      <ToolJsonLd pack={pack} />
      <AnalyticsPageView
        eventName="fengshui_simulator_page_viewed"
        page="/tools/fengshui-simulator"
        meta={{ surfaceKey: 'tools', tool: 'fengshui-simulator', source: sp.source || null, geoReady: true }}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Shop Fengshui Simulator' : '商铺风水模拟器'}
          title={en ? 'Industry · Direction · Color · Timing' : '行业 · 方位 · 色彩 · 择时'}
          description={
            en
              ? 'Input your shop info and get structured wuxing analysis across five dimensions. Structural observations only — no "auspicious" labels.'
              : pack.answerSummary
          }
          actions={
            <>
              <Link href="/tools/fengshui-space" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Space Field Lab' : '空间场工作台'}
              </Link>
              <Link href="/dimensions/living-environment" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Living environment' : '居家环境研判'}
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'All tools' : '全部工具'}
              </Link>
            </>
          }
        />
        <FengshuiSimulatorForm />
        <ToolSeoGeoSection pack={pack} />
      </div>
    </AppPage>
  );
}
