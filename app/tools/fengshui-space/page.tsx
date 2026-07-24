import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import AnalyticsPageView from '@/components/analytics-page-view';
import { SpaceLabApp } from '@/components/fengshui/space-lab/space-lab-app';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';
import { getRequestLocale } from '@/lib/i18n/server-locale';

const pack = getToolSeoGeoPack('fengshui-space')!;

export const metadata: Metadata = buildToolPageMetadata('fengshui-space');

export default async function FengshuiSpacePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const en = `${locale}`.toLowerCase().startsWith('en');

  return (
    <AppPage
      header={{
        ctaHref: '/tools',
        ctaLabel: en ? 'Tools' : '工具中心',
        compact: true,
      }}
      showFooter={false}
      mainClassName="page-frame !py-2 !pb-2 md:!py-2"
    >
      <ToolJsonLd pack={pack} />
      <AnalyticsPageView
        eventName="fengshui_space_lab_viewed"
        page="/tools/fengshui-space"
        meta={{ surfaceKey: 'tools', tool: 'fengshui-space', geoReady: true, locale }}
      />
      <div className="mx-auto max-w-[1680px] px-2 md:px-3">
        <SpaceLabApp locale={locale} />
      </div>
      <div className="mx-auto mt-8 max-w-3xl px-3 pb-12">
        <ToolSeoGeoSection pack={pack} compact />
      </div>
    </AppPage>
  );
}
