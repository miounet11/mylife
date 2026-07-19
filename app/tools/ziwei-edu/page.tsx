import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { ZiweiEduClient } from '@/components/ziwei/ziwei-edu-client';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '紫微教育排盘｜命宫身宫、十四主星与生年四化',
  description:
    '人生K线紫微教育排盘：支持公历换算农历，推命宫/身宫、示意五行局与十四主星，标注生年四化。不含大限/飞星，不自动断事。',
  path: '/tools/ziwei-edu',
  keywords: ['紫微斗数', '教育排盘', '命宫', '十四主星', '生年四化', '人生K线'],
});

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
      <AnalyticsPageView
        eventName="ziwei_edu_page_viewed"
        page="/tools/ziwei-edu"
        meta={{ surfaceKey: 'tools', tool: 'ziwei-edu', source: sp.source || null }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Educational chart' : '教育排盘'}
          title={en ? 'Ziwei · structure layout' : '紫微 · 结构示意盘'}
          description={
            en
              ? 'Solar or lunar birth input; life/body palace, simplified bureau, 14 main stars, year sihua labels. No decade luck / flying stars; no auto judgment.'
              : '公历或农历输入；命宫/身宫、示意五行局、十四主星与生年四化标注。不含大限/飞星，不自动断事。'
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

        <section className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-4 py-3 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          {en
            ? 'Boundary: educational structure only. Serious decisions use full Bazi report, ten dimensions, and real-world judgment.'
            : '产品边界：本页用于结构识读。重要决策请以八字完整报告、十维度与现实条件为准；深入讨论见紫微社区。'}
        </section>
      </div>
    </AppPage>
  );
}
