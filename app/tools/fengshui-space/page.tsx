import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import AnalyticsPageView from '@/components/analytics-page-view';
import { SpaceLabApp } from '@/components/fengshui/space-lab/space-lab-app';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '空间场模拟工作台｜热力·立体·户型上传',
  description:
    '风水空间场可视化：能量/风速/采光/九星热力层，立体示意，风口控制台，上传户型图底板。结构化观察，不说吉凶标签。',
  path: '/tools/fengshui-space',
  keywords: ['空间场模拟', '风水热力图', '户型图分析', '九宫', '采光', '人生K线'],
});

export default function FengshuiSpacePage() {
  return (
    <AppPage header={{ ctaHref: '/tools', ctaLabel: '工具中心', compact: true }}>
      <AnalyticsPageView
        eventName="fengshui_space_lab_viewed"
        page="/tools/fengshui-space"
        meta={{ surfaceKey: 'tools', tool: 'fengshui-space' }}
      />
      <div className="mx-auto max-w-[1400px] px-3 py-5 pb-16 md:px-4 md:py-7">
        <SpaceLabApp />
      </div>
    </AppPage>
  );
}
