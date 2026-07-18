import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getEntityInsights } from '@/lib/content-store';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';

export const metadata: Metadata = {
  title: '系统洞察｜城市与环境观察',
  description: '世界易城市观察、环境层洞察与跨文化判断样例。',
  alternates: { canonical: '/insights' },
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const illustLocale = toIllustLocale(uiLocale);
  const insights = getEntityInsights();

  return (
    <AppPage header={{ ctaHref: '/world-yi', ctaLabel: '世界易', compact: true }}>
      <AnalyticsPageView
        eventName="insights_page_viewed"
        page="/insights"
        meta={{ surfaceKey: 'insights', total: insights.length }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="洞察"
          title="环境层观察"
          description="城市与环境下的成本结构、角色密度与节奏差异，用于迁移与选址参考。"
          actions={
            <>
              <Link href="/world-yi" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                世界易
              </Link>
              <Link href="/dimensions/migration" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                迁移维度
              </Link>
            </>
          }
        />
        <PageIllustrationStrip
          surface="insights/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '城市环境层',
            'zh-Hant': '城市環境層',
            en: 'City environment lens',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />
        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">
            {insights.length} 篇
          </h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {insights.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/insights/city/${item.slug}`}
                  className="block py-3 no-underline hover:no-underline"
                >
                  <div className="text-[11px] text-[color:var(--ink-5)]">城市观察</div>
                  <h2 className="mt-0.5 text-[14px] font-medium text-[color:var(--ink-1)] hover:underline">
                    {item.title}
                  </h2>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppPage>
  );
}
