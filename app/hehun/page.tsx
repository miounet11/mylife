import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import HehunWorkspace from '@/components/hehun/hehun-workspace';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

export const metadata: Metadata = metadataFromPagePack('/hehun');

export default async function HehunPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const seoPack = getPageSeoGeoPack('/hehun');
  const en = locale === 'en';

  return (
    <AppPage
      header={{
        ctaHref: '/dimensions/marriage',
        ctaLabel: en ? 'Single-chart marriage' : '单盘婚恋',
        compact: true,
      }}
    >
      <AnalyticsPageView
        eventName="hehun_page_viewed"
        page="/hehun"
        meta={{ surfaceKey: 'hehun', funnel: 'hehun_hub' }}
      />
      <AnalyticsPageView
        eventName="hehun_workspace_viewed"
        page="/hehun"
        meta={{ surfaceKey: 'hehun', kind: 'workspace' }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Compatibility' : '合婚'}
          title={en ? 'Dual-chart compare' : '双盘对照'}
          description={
            en
              ? 'Day Master interaction, spouse palace, and favorable/unfavorable balance. Fill both birthdays for an instant compare, or prefill from a report/profile.'
              : '日主互动、夫妻宫、用忌互补。可双方填生日即时对盘，或从报告/档案一键预填。'
          }
          actions={
            <>
              <Link
                href="/dimensions/marriage"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Single-chart marriage' : '单盘谈婚论嫁'}
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Tools' : '工具中心'}
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Full report' : '完整报告'}
              </Link>
              <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'Teachers' : '请老师'}
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="hehun/hub"
          title={en ? 'Dual-chart compare' : '双盘对照'}
          compact
          limit={1}
        />
        <Suspense
          fallback={
            <div className="py-6 text-[13px] text-[color:var(--ink-5)]">
              {en ? 'Loading…' : '加载中…'}
            </div>
          }
        >
          <HehunWorkspace locale={locale} />
        </Suspense>
        {seoPack ? <PageJsonLd pack={seoPack} /> : null}
        <PageSeoGeoSection pathOrSlug="/hehun" />
      </div>
    </AppPage>
  );
}
