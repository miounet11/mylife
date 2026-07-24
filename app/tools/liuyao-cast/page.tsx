import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LiuyaoCastClient } from '@/components/liuyao/liuyao-cast-client';
import { ToolJsonLd, ToolSeoGeoSection } from '@/components/tools/tool-seo-geo-section';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import {
  buildToolPageMetadata,
  getToolSeoGeoPack,
} from '@/lib/tools/tool-seo-geo';

const pack = getToolSeoGeoPack('liuyao-cast')!;

export const metadata: Metadata = buildToolPageMetadata('liuyao-cast');

export default async function LiuyaoCastPage({
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
        eventName="liuyao_cast_page_viewed"
        page="/tools/liuyao-cast"
        meta={{ surfaceKey: 'tools', tool: 'liuyao-cast', source: sp.source || null, geoReady: true }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Educational cast' : '教育排卦'}
          title={en ? 'Six Lines · coin method' : '六爻 · 三枚铜钱起卦'}
          description={
            en
              ? 'Simulate three coins for six lines, then read 本卦 / 变卦 structure only. No automatic fortune text.'
              : pack.answerSummary
          }
          actions={
            <>
              <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Compatibility chart' : '合婚双盘'}
              </Link>
              <Link
                href="/community/category/liuyao"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Liuyao community' : '六爻讨论区'}
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'All tools' : '全部工具'}
              </Link>
            </>
          }
        />

        <LiuyaoCastClient locale={en ? 'en' : 'zh-CN'} />
        <ToolSeoGeoSection pack={pack} />
      </div>
    </AppPage>
  );
}
