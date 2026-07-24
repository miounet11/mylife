import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import { NamingLabApp } from '@/components/naming/naming-lab-app';
import { ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { buildPageMetadata } from '@/lib/seo';
import { getToolSeoGeoPack } from '@/lib/tools/tool-seo-geo';

export const metadata: Metadata = buildPageMetadata({
  title: '起名中心 · 个人/公司/产品起名',
  description:
    '人生K线起名中心：个人起名绑定八字用神，公司起名结合行业五行，产品起名兼顾音义与传播感。透明打分，可公开发布短名单。',
  path: '/tools/naming',
  keywords: [
    '起名',
    '宝宝起名',
    '公司起名',
    '产品起名',
    '姓名学',
    '八字起名',
    '品牌命名',
  ],
});

export default function NamingToolPage() {
  const pack = getToolSeoGeoPack('naming');
  return (
    <AppPage header={{ ctaHref: '/tools/fengshui-space', ctaLabel: '空间场', compact: true }}>
      <NamingLabApp />
      {pack ? (
        <div className="mx-auto max-w-5xl px-3 pb-12 sm:px-4">
          <ToolSeoGeoSection pack={pack} />
        </div>
      ) : null}
    </AppPage>
  );
}
