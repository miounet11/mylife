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
import { WORLD_YI_LOGIC_AXIOMS, listWorldYiLayers } from '@/lib/world-yi-logic';
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
  const layers = listWorldYiLayers();

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
          description="先有定义，再解释处境：结构是种子，时位是田面或仓库，环境是土壤。先看张力与阶段，最后落到可验证动作。"
          actions={
            <>
              <Link href="/world-yi/logic" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                定义与处境
              </Link>
              <Link
                href="/knowledge/world-yi-v1-manifesto"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                阅读总论
              </Link>
              <Link href="/world-yi/cities" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                城市主题
              </Link>
              <Link href="/world-yi/era-timing" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                时代天时
              </Link>
              <Link href="/astro" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                星座百科
              </Link>
              <Link href="/almanac" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                万年历
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
                定义
              </p>
              <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
                六层逻辑，用来解释眼前的事
              </h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                结构是种子，时位是田面或仓库，环境是土壤。墓库是库存不是坟。先有定义，再谈换工作、存钱、关系和迁城。
              </p>
            </div>
            <Link
              href="/world-yi/logic"
              className="text-[12px] font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              打开定义与处境 →
            </Link>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer) => (
              <li key={layer.id} className="rounded-lg border border-[color:var(--hairline)] px-3 py-2.5">
                <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                  {layer.order}. {layer.name}
                </p>
                <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">{layer.oneLiner}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-3 space-y-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
            {WORLD_YI_LOGIC_AXIOMS.slice(0, 3).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

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

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
                城市主题
              </p>
              <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
                城市是环境层，不是吉凶名单
              </h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                短视频里的「城市气场」可以当话题入口；世界易把它落成可验证的压力测试：成本、行业密度、社交半径与节奏，会放大或削弱你的用神发挥方式。结构 → 时位 → 环境 → 动作 → 风险。
              </p>
            </div>
            <Link
              href="/world-yi/cities"
              className="text-[12px] font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              打开城市主题 →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              href="/world-yi/cities"
              className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand)] px-3 py-2.5 text-center text-[12px] font-semibold text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline"
            >
              国内 + 海外城市卡
            </Link>
            <Link
              href="/dimensions/living-environment"
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--ink-1)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              居家环境维度
            </Link>
            <Link
              href="/analyze?source=world_yi_cities&intent=yearly"
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--brand)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              接到个人报告
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
                时代天时
              </p>
              <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
                天时是环境层，不是命运开关
              </h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                外行星标时代拐点，土木标社会压力，火逆标摩擦窗口；四象阶段从车库到定规则。与城市主题一起，补全空间 + 时间双重环境——再对齐你的结构与大运。
              </p>
            </div>
            <Link
              href="/world-yi/era-timing"
              className="text-[12px] font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              打开时代天时 →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              href="/world-yi/era-timing"
              className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand)] px-3 py-2.5 text-center text-[12px] font-semibold text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline"
            >
              三层 + 四象
            </Link>
            <Link
              href="/knowledge/world-yi-era-uranus-cycle"
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--ink-1)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              天王星与技术阶段
            </Link>
            <Link
              href="/tools/zodiac?source=world_yi_era"
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--brand)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
            >
              个人星座（表达层）
            </Link>
          </div>
        </section>
        <PageSeoGeoSection pathOrSlug="/world-yi" />
      </div>
    </AppPage>
  );
}
