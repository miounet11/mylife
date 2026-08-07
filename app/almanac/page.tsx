import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AlmanacApp from '@/components/almanac/almanac-app';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { todayDateString } from '@/lib/almanac/day-pack';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = metadataFromPagePack('/almanac', {
  title: '万年历黄历｜每日宜忌·十二时辰·个人日运｜人生K线',
  description:
    '查公历农历与通书宜忌、冲煞、十二时辰黄道黑道；绑定生辰后叠加日主结构，看今日宜推进还是守成、哪些时辰更顺。每日独立 URL 可分享可收录。',
});

export default async function AlmanacPage({
  searchParams,
}: {
  searchParams?: Promise<{
    date?: string;
    year?: string;
    month?: string;
    stay?: string;
    skin?: string;
    region?: string;
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const today = todayDateString();

  // ?date=YYYY-MM-DD → canonical day URL
  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.stay !== '1') {
    const q = new URLSearchParams();
    if (sp.skin) q.set('skin', sp.skin);
    if (sp.region) q.set('region', sp.region);
    const qs = q.toString();
    redirect(`/almanac/${sp.date}${qs ? `?${qs}` : ''}`);
  }

  const date = today;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const year = m ? Number(m[1]) : new Date().getFullYear();
  const month = m ? Number(m[2]) : new Date().getMonth() + 1;
  const seoPack = getPageSeoGeoPack('/almanac');

  return (
    <AppPage header={{ ctaHref: '/analyze?source=almanac', ctaLabel: '接到报告', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="almanac_page_viewed"
        page="/almanac"
        meta={{ surfaceKey: 'almanac', date, geoReady: true }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="全球黄历落地页"
          title="今天，对你意味着什么？"
          description="通书撕页 · 现代卡片 · 个人日运 · 时辰宫格 · 全球对照——多种展示一键切换。支持中国/台湾/香港/新加坡/日本六曜/韩国/越南/北美等文化侧重；绑定生辰后看专属匹配。"
          actions={
            <>
              <Link
                href={`/almanac/${today}?skin=tear`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                撕页通书
              </Link>
              <Link
                href={`/almanac/${today}?skin=personal`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                个人日运
              </Link>
              <Link
                href={`/almanac/${today}?region=global&skin=global`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                全球对照
              </Link>
              <Link
                href="/analyze?source=almanac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                完整报告
              </Link>
            </>
          }
          footer={
            <span className="text-[12px] text-[color:var(--ink-5)]">
              今日 URL：/almanac/{today}
            </span>
          }
        />
        <AlmanacApp
          initialYear={year}
          initialMonth={month}
          initialDate={date}
          navigateOnSelect
          initialSkin={sp.skin}
          initialRegion={sp.region}
        />
        <PageSeoGeoSection pathOrSlug="/almanac" />
      </div>
    </AppPage>
  );
}
