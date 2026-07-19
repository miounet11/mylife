import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LiuyaoCastClient } from '@/components/liuyao/liuyao-cast-client';
import { buildPageMetadata } from '@/lib/seo';
import { getRequestLocale } from '@/lib/i18n/server-locale';

export const metadata: Metadata = buildPageMetadata({
  title: '六爻教育起卦｜三枚铜钱排本卦变卦',
  description:
    '人生K线六爻教育起卦：模拟三枚铜钱得到六爻、本卦与变卦名称。仅结构演示，不自动断事。',
  path: '/tools/liuyao-cast',
  keywords: ['六爻', '起卦', '本卦', '变卦', '教育排卦', '人生K线'],
});

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
      <AnalyticsPageView
        eventName="liuyao_cast_page_viewed"
        page="/tools/liuyao-cast"
        meta={{ surfaceKey: 'tools', tool: 'liuyao-cast', source: sp.source || null }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'Educational cast' : '教育排卦'}
          title={en ? 'Six Lines · coin method' : '六爻 · 三枚铜钱起卦'}
          description={
            en
              ? 'Simulate three coins for six lines, then read 本卦 / 变卦 structure only. No automatic fortune text.'
              : '模拟三枚铜钱得六爻，只给出本卦 / 变卦结构。不自动断事、不承诺吉凶。'
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

        <section className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-4 py-3 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          {en
            ? 'Product boundary: this is a learning cast for structure literacy. Serious decisions still need report context, dimensions, and human judgment.'
            : '产品边界：本页用于结构识读与学习起卦。重要决策仍需完整报告、十维度与现实判断；社区讨论见六爻板块。'}
        </section>
      </div>
    </AppPage>
  );
}
