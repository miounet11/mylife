import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ZiweiEduClient } from '@/components/ziwei/ziwei-edu-client';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';

const pack = getToolSeoGeoPack('ziwei-edu')!;

export const metadata: Metadata = buildToolPageMetadata('ziwei-edu');

export default async function ZiweiEduPage({
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
        eventName="ziwei_edu_page_viewed"
        page="/tools/ziwei-edu"
        meta={{ surfaceKey: 'tools', tool: 'ziwei-edu', source: sp.source || null, geoReady: true }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Educational chart' : '教育排盘'}
          title={en ? 'Ziwei · structure layout' : '紫微 · 结构示意盘'}
          description={
            en
              ? 'Solar or lunar birth input; optional true solar time via longitude; life/body palace, simplified bureau, 14 main stars, year sihua labels. No decade luck / flying stars; no auto judgment.'
              : pack.answerSummary
          }
          actions={
            <>
              <Link
                href="/tools/liuyao-cast"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Six-line cast' : '六爻起卦'}
              </Link>
              <Link
                href="/community/category/ziwei"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Ziwei forum' : '紫微讨论区'}
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Bazi report' : '八字报告'}
              </Link>
            </>
          }
        />

        <ZiweiEduClient locale={en ? 'en' : 'zh-CN'} />
        <ToolSeoGeoSection pack={pack} />
      </div>
    </AppPage>
  );
}
