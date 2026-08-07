import type { Metadata } from 'next';
import Link from 'next/link';
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
    '查公历农历与通书宜忌、冲煞、十二时辰黄道黑道；绑定生辰后叠加日主结构，看今日宜推进还是守成、哪些时辰更顺。',
});

export default async function AlmanacPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; year?: string; month?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const today = todayDateString();
  const date = `${sp.date || today}`.trim();
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const year = Number(sp.year) || (m ? Number(m[1]) : new Date().getFullYear());
  const month = Number(sp.month) || (m ? Number(m[2]) : new Date().getMonth() + 1);
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
          eyebrow="万年历 · 通书 + 结构"
          title="看见今天的公共黄历，也看见你的结构日运"
          description="月历点选每一天：宜忌、冲煞、十二时辰黄道黑道一目了然。绑定生辰后，用日主与用神叠流日，给出推进/守成倾向与较顺时辰——通书不替代判断，结构不制造恐吓。"
          actions={
            <>
              <Link href="/dimensions/timing-selection" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                择时办事
              </Link>
              <Link href="/world-yi/era-timing" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                时代天时
              </Link>
              <Link href="/analyze?source=almanac" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                完整报告
              </Link>
            </>
          }
        />
        <AlmanacApp initialYear={year} initialMonth={month} initialDate={m ? date : today} />
        <PageSeoGeoSection pathOrSlug="/almanac" />
      </div>
    </AppPage>
  );
}
