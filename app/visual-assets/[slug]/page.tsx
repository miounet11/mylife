import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Compass,
  FileText,
  Image as ImageIcon,
  LibraryBig,
  MousePointer2,
  Network,
  Route,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import VisualAssetCard from '@/components/visual-asset-card';
import { getApprovedVisualAssetBySlug, getApprovedVisualAssets, getRelatedVisualAssets } from '@/lib/visual-asset-library';
import { createArticleSchema, createBreadcrumbSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { buildJourneyForVisualAsset } from '@/lib/surface-journeys';
import { getToolDefinition, inferCategoryFromText, listToolsByCategory, type ToolDefinition } from '@/lib/tools';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const moduleLabels: Record<string, string> = {
  PRODUCT_WORLD_YI: '产品说明图',
  REPORT: '报告路径图',
  TOOLS: '工具矩阵图',
  CONTENT: '内容体系图',
  WORLD_YI: '世界易方法图',
  MINGLI: '命理教材图',
  SOCIAL: '传播分享图',
};

const worldYiSteps = [
  { key: '结构', body: '先确认这张图讲的是哪一类结构：产品、报告、工具、知识、案例，还是命理概念。' },
  { key: '时位', body: '再判断用户处在什么阶段：初次了解、刚测完、想深挖、准备使用工具，还是准备分享。' },
  { key: '环境', body: '把图放回站内环境：它应该连接测算、报告、工具、文章和案例，而不是孤立展示。' },
  { key: '动作', body: '页面必须给出下一步动作：开始测算、进入工具、阅读相关文章，或回到世界易方法。' },
  { key: '复盘', body: '最后用点击、工具使用和报告复访验证这张图是否真的帮助用户理解和行动。' },
];

function buildVisualAssetReading(asset: NonNullable<ReturnType<typeof getApprovedVisualAssetBySlug>>) {
  if (asset.slug === 'content-system-map') {
    return {
      headline: '这张图要表达的是：内容不是信息流，而是判断路径',
      description: '在当前人生K线 / 世界易体系里，知识、案例、洞察、图片文章和工具不应该各自为政。它们共同服务一个目标：把用户从“看懂一个概念”，继续带回到自己的测算、报告和可执行工具。',
      modules: [
        { title: '知识', body: '解释概念和方法，让用户知道问题为什么要这样判断。' },
        { title: '案例', body: '把抽象方法放进真实场景，降低理解门槛。' },
        { title: '洞察', body: '补充时代、城市、行业和环境信号。' },
        { title: '图片文章', body: '用视觉图谱把复杂结构变成可收藏、可分享、可继续阅读的入口。' },
        { title: '工具', body: '把综合报告里的大问题拆成单项判断和下一步动作。' },
        { title: '测算', body: '所有内容最后都要回到个人结构，而不是停在泛知识消费。' },
      ],
    };
  }

  if (asset.module === 'MINGLI') {
    return {
      headline: '这张图把传统概念翻译成现代判断语言',
      description: '命理和易学图片的价值不是制造神秘感，而是帮助用户看懂结构、关系、边界和行动方向。它应该先解释概念，再把用户带回自己的报告和工具。',
      modules: [
        { title: '概念', body: '先说明这个命理或易学概念的基本含义。' },
        { title: '关系', body: '再看它和其他元素、阶段、环境之间的关系。' },
        { title: '边界', body: '避免恐吓和宿命论，不给确定性结果承诺。' },
        { title: '行动', body: '把概念转成用户可以复盘的现实动作。' },
      ],
    };
  }

  if (asset.module === 'TOOLS') {
    return {
      headline: '这张图说明工具如何把大报告拆成小问题',
      description: '工具不是替代综合测算，而是承接报告中的具体问题。用户先建立底盘，再用单项工具拆事业、关系、财富、恢复、迁移和生活应用。',
      modules: [
        { title: '综合底盘', body: '先用测算确认主结构和阶段。' },
        { title: '单项工具', body: '再把一个具体问题拆到工具里。' },
        { title: '结果复访', body: '工具结果要能回到报告和用户档案。' },
      ],
    };
  }

  return {
    headline: `这张图在世界易里的角色：${moduleLabels[asset.module] || '视觉说明图'}`,
    description: '每张图片都不是单纯装饰，而是一个可阅读的结构入口。用户先看图理解关系，再读解释，最后进入测算、工具、知识或案例继续行动。',
    modules: [
      { title: '看图', body: '先完整理解画面里的结构、路径和关键词。' },
      { title: '读文', body: '再通过配套解读把图转成判断语言。' },
      { title: '行动', body: '最后进入测算、工具或相关文章验证。' },
    ],
  };
}

function getRelatedTools(asset: NonNullable<ReturnType<typeof getApprovedVisualAssetBySlug>>) {
  const directTools = asset.relatedToolSlugs
    .map((slug) => getToolDefinition(slug))
    .filter((tool): tool is ToolDefinition => !!tool);
  const inferredCategory = inferCategoryFromText([
    asset.title,
    asset.description,
    asset.narrativeExcerpt,
    asset.module,
    ...asset.relatedReportThemes,
  ].join(' '));
  const fallbackTools = inferredCategory ? listToolsByCategory(inferredCategory).slice(0, 4) : [];
  return [...directTools, ...fallbackTools]
    .filter((tool, index, array) => array.findIndex((candidate) => candidate.slug === tool.slug) === index)
    .slice(0, 4);
}

export async function generateStaticParams() {
  return getApprovedVisualAssets().map((asset) => ({ slug: asset.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const asset = getApprovedVisualAssetBySlug(slug);
  if (!asset) {
    return {
      title: '图片未找到 | 人生K线',
    };
  }

  return createPublicContentMetadata({
    title: `${asset.title} | 世界易图片说明库`,
    description: asset.narrativeExcerpt,
    path: `/visual-assets/${asset.slug}`,
    type: 'article',
    keywords: [asset.title, asset.module, ...asset.relatedReportThemes, '世界易图片', '人生K线'],
    images: [{
      url: asset.publicUrl,
      alt: asset.altText,
      width: asset.ratio === '4:5' ? 1280 : 2048,
      height: asset.ratio === '4:5' ? 1600 : 1152,
    }],
    section: '视觉说明图',
    tags: [asset.module, ...asset.relatedReportThemes],
    answerSummary: asset.narrativeExcerpt,
    searchIntents: [
      `${asset.title} 怎么看`,
      '世界易图片说明',
      '人生K线图片说明库',
      ...asset.relatedReportThemes,
    ],
    entityKeywords: [asset.title, asset.module, '世界易', '人生K线', ...asset.relatedReportThemes],
  });
}

export default async function VisualAssetDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const asset = getApprovedVisualAssetBySlug(slug);
  if (!asset) notFound();
  const reading = buildVisualAssetReading(asset);
  const relatedTools = getRelatedTools(asset);
  const relatedVisualAssets = getRelatedVisualAssets(asset, 3);
  const journey = buildJourneyForVisualAsset({
    title: asset.title,
    description: asset.description,
    narrativeExcerpt: asset.narrativeExcerpt,
    module: asset.module,
    slug: asset.slug,
    relatedToolSlugs: asset.relatedToolSlugs,
    relatedReportThemes: asset.relatedReportThemes,
    targetRoutes: asset.targetRoutes,
    source: `visual_asset:${asset.slug}`,
  });

  const schemas = [
    createArticleSchema({
      headline: asset.narrativeTitle,
      description: asset.narrativeExcerpt,
      path: `/visual-assets/${asset.slug}`,
      articleSection: '视觉说明图',
      keywords: [asset.title, asset.module, '世界易', '人生K线', ...asset.relatedReportThemes],
      image: [{
        url: asset.publicUrl,
        alt: asset.altText,
        width: asset.ratio === '4:5' ? 1280 : 2048,
        height: asset.ratio === '4:5' ? 1600 : 1152,
      }],
      abstract: asset.narrativeExcerpt,
      about: [asset.title, asset.module, ...asset.relatedReportThemes],
      mentions: asset.targetRoutes,
      audience: '希望通过图片快速理解人生K线和世界易的用户',
      mainEntityName: asset.title,
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '图片说明库', path: '/visual-assets' },
      { name: asset.title, path: `/visual-assets/${asset.slug}` },
    ]),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="visual_asset_viewed" page={`/visual-assets/${asset.slug}`} meta={{ surfaceKey: 'visual_asset_detail', assetId: asset.id, slug: asset.slug }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <Link href="/visual-assets" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mb-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          返回图片库
        </Link>

        <article className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-stretch">
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md overflow-hidden rounded-[var(--radius-md)] p-3 md:p-5">
              <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[rgba(139,115,70,0.14)] bg-[radial-gradient(circle_at_20%_12%,rgba(178,149,93,0.18),transparent_34%),linear-gradient(135deg,#fffaf2,#efe2cf)] p-3 md:p-5">
                <Image
                  src={asset.publicUrl}
                  alt={asset.altText}
                  width={asset.ratio === '4:5' ? 1280 : 2048}
                  height={asset.ratio === '4:5' ? 1600 : 1152}
                  sizes={asset.ratio === '4:5' ? '(min-width: 1024px) 58vw, 92vw' : '(min-width: 1024px) 58vw, 92vw'}
                  priority
                  className={asset.ratio === '4:5'
                    ? 'mx-auto max-h-[82vh] w-auto max-w-full rounded-[var(--radius)] object-contain shadow-[0_28px_70px_rgba(47,32,14,0.14)]'
                    : 'h-auto w-full rounded-[var(--radius)] object-contain shadow-[0_28px_70px_rgba(47,32,14,0.14)]'}
                />
              </div>
            </div>

            <aside className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <ImageIcon className="h-3.5 w-3.5" />
                {asset.id} · {moduleLabels[asset.module] || asset.module}
              </div>
              <h1 className="mt-4 text-4xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                {asset.title}
              </h1>
              <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">{asset.narrativeExcerpt}</p>

              <div className="mt-6 grid gap-3">
                {[
                  { label: '图片比例', value: asset.ratio },
                  { label: '核心用途', value: moduleLabels[asset.module] || asset.module },
                  { label: '推荐入口', value: asset.targetRoutes.slice(0, 3).join(' / ') || '/analyze' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">{item.label}</div>
                    <div className="mt-2 text-sm font-bold leading-6 text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/analyze" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">
                  用自己的信息验证
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/world-yi" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">理解世界易</Link>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Compass className="h-3.5 w-3.5" />
                世界易解释
              </div>
              <h2 className="mt-4 text-3xl font-black leading-tight text-[color:var(--ink)]">{reading.headline}</h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{reading.description}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {reading.modules.map((item) => (
                  <div key={item.title} className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-[color:var(--ink)]">
                      <Boxes className="h-4 w-4 text-[color:var(--accent-strong)]" />
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Route className="h-3.5 w-3.5" />
                世界易五步读图
              </div>
              <div className="mt-6 grid gap-3">
                {worldYiSteps.map((step, index) => (
                  <div key={step.key} className="grid gap-3 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 sm:grid-cols-[4.5rem_1fr]">
                    <div className="flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-xs">{index + 1}</span>
                      {step.key}
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--muted)]">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Wrench className="h-3.5 w-3.5" />
                对应工具
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">看完这张图，下一步可以直接用工具拆问题</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                工具负责把图片里的结构落到个人问题上。先看综合测算，再用单项工具验证一个具体方向，会比只收藏图片更有价值。
              </p>
              <div className="mt-5 grid gap-3">
                {relatedTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}?source=visual_asset:${asset.slug}`}
                    className="block cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)] rounded-[var(--radius)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">{tool.category} · {tool.themeLabel}</div>
                        <h3 className="mt-2 text-lg font-black text-[color:var(--ink)]">{tool.shortTitle}</h3>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{tool.hook}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <BookOpen className="h-3.5 w-3.5" />
                配套解读文章
              </div>
              <div className="mt-5 space-y-4">
                {asset.narrativeSections.map((section) => (
                  <section key={section.heading} className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
                    <h2 className="text-xl font-black text-[color:var(--ink)]">{section.heading}</h2>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{section.body}</p>
                  </section>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <Target className="h-5 w-5" />, title: '先建立个人底盘', body: '如果还没测算，先用出生信息建立综合报告，再看这张图会更准确。', href: '/analyze', cta: '开始测算' },
              { icon: <LibraryBig className="h-5 w-5" />, title: '回到知识体系', body: '把图片中的概念接回知识库，继续阅读世界易和命理基础。', href: '/knowledge', cta: '看知识库' },
              { icon: <MousePointer2 className="h-5 w-5" />, title: '进入工具动作', body: '选择一个相关工具，把图里的结构转成一次单项判断。', href: relatedTools[0] ? `/tools/${relatedTools[0].slug}?source=visual_asset:${asset.slug}` : '/tools', cta: '进入工具' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="block cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-xl font-black text-[color:var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.body}</p>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </section>

          <SurfaceJourneyPanel
            journey={journey}
            title="这张图对应的站内协同路径"
            description="图片页不只展示视觉资产，还要继续接回综合测算、工具、知识和案例，让用户从理解画面进入自己的判断链路。"
            badge={`视觉资产 · ${asset.id}`}
          />

          {relatedVisualAssets.length > 0 ? (
            <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <LibraryBig className="h-3.5 w-3.5" />
                同主题继续看
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">把这张图放回同一组结构里理解</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                单张图适合理解一个主题，同模块图片适合形成系统认知。继续看同主题图片，可以避免只记住一个符号，却没有看懂完整关系。
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {relatedVisualAssets.map((item) => (
                  <VisualAssetCard key={item.id} asset={item} compact />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">图片链接</div>
                <code className="mt-2 block break-all text-sm font-semibold text-[color:var(--ink)]">{asset.publicUrl}</code>
              </div>
              <div className="flex gap-2 text-[color:var(--accent-strong)]">
                <FileText className="h-5 w-5" />
                <Network className="h-5 w-5" />
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
