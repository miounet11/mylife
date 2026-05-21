import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Boxes, Route, Share2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import VisualAssetCard from '@/components/visual-asset-card';
import VisualAssetFeature from '@/components/visual-asset-feature';
import { getApprovedVisualAssetBySlug, getApprovedVisualAssets, type VisualAssetLibraryItem } from '@/lib/visual-asset-library';
import { createCollectionPageSchema, createPublicContentMetadata } from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易图片说明库 | 人生K线',
  description: '人生K线与世界易的产品说明图、命理易学结构图、报告路径图、工具矩阵图和传播图。',
  path: '/visual-assets',
  type: 'website',
});

const moduleGroups: Array<{
  key: VisualAssetLibraryItem['module'];
  title: string;
  description: string;
  href: string;
}> = [
  {
    key: 'PRODUCT_WORLD_YI',
    title: '产品与世界易',
    description: '先看人生K线如何把测算、报告、工具、知识、案例和复访连成完整路径。',
    href: '#module-product-world-yi',
  },
  {
    key: 'REPORT',
    title: '报告阅读路径',
    description: '说明用户从生辰输入到第一份报告、深入报告和细分报告的分层关系。',
    href: '#module-report',
  },
  {
    key: 'MINGLI',
    title: '命理易学基础',
    description: '五行、阴阳、八卦、天干地支、八字、起名、风水、奇门、相学边界等教材图。',
    href: '#module-mingli',
  },
  {
    key: 'SOCIAL',
    title: '传播分享主题',
    description: '流年太岁、本命年、五行传播卡等适合收藏和分享的内容入口。',
    href: '#module-social',
  },
  {
    key: 'TOOLS',
    title: '工具矩阵',
    description: '把综合报告中的大问题拆成单项工具和可执行动作。',
    href: '#module-tools',
  },
  {
    key: 'CONTENT',
    title: '内容体系',
    description: '说明知识、案例、洞察、图片文章如何回到测算、工具和复访。',
    href: '#module-content',
  },
  {
    key: 'WORLD_YI',
    title: '判断边界',
    description: '把世界易方法、非宿命论边界和现代判断语言做成可理解结构。',
    href: '#module-world-yi',
  },
];

const recommendedPaths = [
  {
    icon: <Route className="h-5 w-5" />,
    title: '新用户先看',
    description: '从产品宇宙、世界易六步、第一份报告路径开始，快速知道该怎么用。',
    slugs: ['life-kline-product-universe', 'world-yi-six-step-method', 'first-report-reading-path'],
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: '学习命理先看',
    description: '先建立阴阳、八卦、五行、天干地支和八字基础，再进入细分主题。',
    slugs: ['mingli-yixue-knowledge-map', 'yin-yang-not-good-bad', 'five-elements-generating-cycle', 'ten-heavenly-stems-overview'],
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: '传播主题先看',
    description: '用太岁、本命年和五行传播卡解释年度节奏，但避免恐吓式表达。',
    slugs: ['tai-sui-not-fear', 'ben-ming-nian-review-rhythm', 'five-elements-generating-control-share-card'],
  },
];

function moduleDomId(module: string) {
  return `module-${module.toLowerCase().replace(/_/g, '-')}`;
}

function getModuleAssets(assets: VisualAssetLibraryItem[], module: VisualAssetLibraryItem['module']) {
  return assets.filter((asset) => asset.module === module);
}

export default function VisualAssetsPage() {
  const visualAssets = getApprovedVisualAssets();
  const featuredAsset = getApprovedVisualAssetBySlug('content-system-map') || visualAssets[0] || null;
  const groupedAssets = moduleGroups
    .map((group) => ({
      ...group,
      assets: getModuleAssets(visualAssets, group.key),
    }))
    .filter((group) => group.assets.length > 0);
  const pathCards = recommendedPaths.map((path) => ({
    ...path,
    assets: path.slugs
      .map((slug) => getApprovedVisualAssetBySlug(slug))
      .filter((asset): asset is VisualAssetLibraryItem => !!asset),
  }));
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易图片说明库',
      description: '人生K线与世界易的产品说明图、命理易学结构图、报告路径图、工具矩阵图和传播图。',
      path: '/visual-assets',
      keywords: ['世界易图片', '人生K线图片', '命理说明图', '易学结构图', '产品说明图'],
    }),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="knowledge_page_viewed" page="/visual-assets" meta={{ surfaceKey: 'visual_assets', count: visualAssets.length }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            图片说明库 · 命理/易学门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              世界易图片说明库
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              用图片看懂人生K线 / 世界易的判断路径。每张图都配有深度解读、相关工具和测算入口。
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">精选 {visualAssets.length} 张</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">主题 {groupedAssets.length} 组</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">深度解读</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/analyze"
                className="inline-flex h-8 items-center gap-1.5 bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]"
              >
                回到测算入口
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/world-yi"
                className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]"
              >
                理解世界易
              </Link>
            </div>
          </div>
        </section>

        {featuredAsset ? (
          <div className="mt-8">
            <VisualAssetFeature
              asset={featuredAsset}
              label="推荐先看 · 内容体系总图"
            />
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {moduleGroups.map((group) => {
            const count = getModuleAssets(visualAssets, group.key).length;
            return (
              <Link
                key={group.key}
                href={group.href}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">{group.title}</div>
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-black text-[color:var(--accent-strong)]">{count} 张</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{group.description}</p>
              </Link>
            );
          })}
        </section>

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Route className="h-3.5 w-3.5" />
            推荐阅读路径
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {pathCards.map((path) => (
              <div key={path.title} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  {path.icon}
                </div>
                <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)]">{path.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{path.description}</p>
                <div className="mt-5 space-y-3">
                  {path.assets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/visual-assets/${asset.slug}`}
                      className="grid grid-cols-[5.75rem_1fr] gap-3 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-3 transition hover:border-[color:var(--accent)]"
                    >
                      <div className="aspect-video overflow-hidden rounded-[var(--radius)] bg-[#f7efe2]">
                        <Image
                          src={asset.publicUrl}
                          alt={asset.altText}
                          width={320}
                          height={180}
                          sizes="5.75rem"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">{asset.id}</div>
                        <div className="mt-1 text-sm font-black leading-5 text-[color:var(--ink)]">{asset.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                看图之后
              </div>
              <h2 className="mt-2 text-2xl font-black text-[color:var(--ink)]">继续把结构落到问题里</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                图片负责建立直觉，真正判断还要回到知识解释、公开案例、单项工具和你自己的信息。
              </p>
            </div>
            <Link href="/analyze" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">
              生成我的判断
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { href: '/knowledge', title: '读知识解释', body: '把图里的概念拆成可理解的方法。' },
              { href: '/cases', title: '看公开案例', body: '用真实场景对照结构怎么落地。' },
              { href: '/tools', title: '进入工具中心', body: '把职业、关系、财富等问题单独验证。' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <div className="flex items-center justify-between gap-3 text-sm font-black text-[color:var(--ink)] group-hover:text-[color:var(--brand-strong)]">
                  {item.title}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Boxes className="h-3.5 w-3.5" />
            分模块图片库
          </div>
          <div className="mt-6 space-y-10">
            {groupedAssets.map((group) => (
              <section key={group.key} id={moduleDomId(group.key)} className="scroll-mt-24">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                      <Sparkles className="h-3.5 w-3.5" />
                      {group.title}
                    </div>
                    <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">{group.title} · {group.assets.length} 张</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">{group.description}</p>
                  </div>
                  <Link href="/analyze" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] md:mb-1">用自己的信息验证</Link>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {group.assets.map((asset) => (
                    <VisualAssetCard key={asset.id} asset={asset} compact={group.assets.length > 9} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
