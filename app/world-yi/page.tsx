import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import EncyclopediaWorldYiSidebar from '@/components/encyclopedia-world-yi-sidebar';
import { getEncyclopediaWorldYiLens } from '@/lib/encyclopedia-world-yi-lens';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { WORLD_YI_DOMAINS } from '@/lib/portal-nav';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';

export const metadata: Metadata = metadataFromPagePack('/world-yi');

export default async function WorldYiPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const illustLocale = toIllustLocale(uiLocale);
  const lens = getEncyclopediaWorldYiLens({ slug: 'gua-qian', category: '64 卦百科', source: 'world-yi-hub' });
  const stats = getWorldYiPublicStats();
  const seoPack = getPageSeoGeoPack('/world-yi');

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '接到我的报告', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <AnalyticsPageView
        eventName="world_yi_page_viewed"
        page="/world-yi"
        meta={{ surfaceKey: 'world_yi' }}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="世界易"
          title="结构、时位与动作"
          description="把传统命理翻译成现代判断语言：先看结构张力，再看阶段匹配，最后落到可验证动作。"
          actions={
            <>
              <Link
                href="/knowledge/world-yi-v1-manifesto"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                阅读总论
              </Link>
              <Link href="/learn/intro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                入门专题
              </Link>
              <Link
                href="/analyze?source=world_yi_hub"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                接到报告
              </Link>
            </>
          }
          footer={
            <span>
              公开知识 {stats.publicKnowledgeCount} · 公开案例 {stats.publicCaseCount}
            </span>
          }
        />
        <LightBirthBridge
          source="world_yi_hub"
          page="/world-yi"
          title="先建你的结构底座"
          description="世界易讲方法；结构报告把方法接到你的生辰、节奏与可验证动作。"
        />
        <PageIllustrationStrip
          surface="world-yi/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '方法路径',
            'zh-Hant': '方法路徑',
            en: 'Method path',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />

        {lens ? <EncyclopediaWorldYiSidebar lens={lens} /> : null}

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
                易学矩阵
              </p>
              <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">按人生主题</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                事业 · 财富 · 关系 · 健康 · 家庭 · 迁移 — 方法接到结构报告与数据底座。
              </p>
            </div>
            <Link
              href="/world-yi/matrix"
              className="text-[12px] font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              打开完整矩阵 →
            </Link>
          </div>
          <EntryLinkGrid items={WORLD_YI_DOMAINS} />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link
              href="/analyze?intent=career&source=world_yi_matrix"
              className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand)] px-3 py-2.5 text-center text-[12px] font-semibold text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline"
            >
              事业节奏研判
            </Link>
            <Link
              href="/hehun?source=world_yi_matrix"
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--ink-1)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              合婚双盘
            </Link>
            <Link
              href="/profile/foundation?source=world_yi_matrix"
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--brand)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              完善数据底座
            </Link>
          </div>
        </section>
        <PageSeoGeoSection pathOrSlug="/world-yi" />
      </div>
    </AppPage>
  );
}
