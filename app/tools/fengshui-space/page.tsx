import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import AnalyticsPageView from '@/components/analytics-page-view';
import { SpaceLabApp } from '@/components/fengshui/space-lab/space-lab-app';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';

const pack = getToolSeoGeoPack('fengshui-space')!;

export const metadata: Metadata = buildToolPageMetadata('fengshui-space');

export default function FengshuiSpacePage() {
  return (
    <AppPage header={{ ctaHref: '/tools', ctaLabel: '工具中心', compact: true }}>
      <ToolJsonLd pack={pack} />
      <AnalyticsPageView
        eventName="fengshui_space_lab_viewed"
        page="/tools/fengshui-space"
        meta={{ surfaceKey: 'tools', tool: 'fengshui-space', geoReady: true }}
      />
      <div className="mx-auto max-w-[1400px] px-3 py-5 pb-16 md:px-4 md:py-7">
        <SpaceLabApp />
        <div className="mx-auto mt-8 max-w-3xl">
          <ToolSeoGeoSection pack={pack} />
        </div>
      </div>
    </AppPage>
  );
}
