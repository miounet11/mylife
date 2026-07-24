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
      <div className="mx-auto max-w-[1600px] px-2 py-3 pb-16 md:px-3 md:py-4">
        <SpaceLabApp />
        <div className="mx-auto mt-10 max-w-3xl px-2">
          <ToolSeoGeoSection pack={pack} />
        </div>
      </div>
    </AppPage>
  );
}
