import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import AnalyticsPageView from '@/components/analytics-page-view';
import { FengshuiSimulatorForm } from '@/components/fengshui/fengshui-simulator-form';
import { buildPageMetadata } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';

export const metadata: Metadata = buildPageMetadata({
  title: '商铺风水模拟器｜五行方位匹配与结构化分析',
  description: '输入商铺信息，从行业五行、大门方位、店名、色彩、择时五维度给出结构化判断。只说五行生克结构，不说吉凶标签。',
  path: '/tools/fengshui-simulator',
  keywords: ['商铺风水', '行业五行', '大门朝向', '店名五行', '开业择时', '人生K线'],
});

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
      <AnalyticsPageView
        eventName="fengshui_simulator_page_viewed"
        page="/tools/fengshui-simulator"
        meta={{ surfaceKey: 'tools', tool: 'fengshui-simulator', source: sp.source || null }}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Shop Fengshui Simulator' : '商铺风水模拟器'}
          title={en ? 'Industry · Direction · Color · Timing' : '行业 · 方位 · 色彩 · 择时'}
          description={
            en
              ? 'Input your shop info and get structured wuxing analysis across five dimensions. Structural observations only — no "auspicious" labels.'
              : '输入商铺信息，从行业五行、大门方位、店名五行、色彩搭配、开业择时五个维度给出结构化判断。只说五行生克结构，不说吉凶标签。'
          }
          actions={
            <>
              <Link href="/knowledge/fengshui-industry-wuxing" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Industry wuxing guide' : '行业五行指南'}
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
      </div>
    </AppPage>
  );
}
