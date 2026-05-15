export const revalidate = 3600;

import Link from 'next/link';
import { ArrowRight, Compass, Layers, Sparkles, Wrench } from 'lucide-react';

import AnalyticsPageView from '@/components/analytics-page-view';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import PublicGrowthFeedPanel from '@/components/public-growth-feed-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolBundlePanel from '@/components/tool-bundle-panel';
import ToolCardLink from '@/components/tool-card-link';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Lede } from '@/components/ui/lede';
import { Stack } from '@/components/ui/stack';
import { Stat } from '@/components/ui/stat';
import { Tag } from '@/components/ui/tag';

import { createContentSignalMatcher } from '@/lib/content';
import { getCaseStudies, getEntityInsights, getKnowledgeArticles } from '@/lib/content-store';
import { toolEntryModes, toolProblemLineGuides } from '@/lib/product-experience';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import {
  getFeaturedTools,
  getPriorityGrowthTools,
  getToolGrowthProfile,
  listToolBundles,
  listToolCategories,
  listToolDefinitions,
} from '@/lib/tools';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '单项测试工具中心 | 人生K线',
    description:
      '把世界易综合报告拆成单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。',
    path: '/tools',
    type: 'website',
    languages: {
      'zh-CN': '/tools',
      'x-default': '/tools',
    },
  });
}

export default function ToolsPage() {
  const categories = listToolCategories();
  const featured = getFeaturedTools(12);
  const priorityGrowthTools = getPriorityGrowthTools();
  const allTools = listToolDefinitions();
  const bundles = listToolBundles();
  const matchesCenterSignal = createContentSignalMatcher([
    ...categories.flatMap((category) => [category.title, category.headline]),
    ...featured.flatMap((tool) => [tool.shortTitle, tool.themeLabel, ...tool.hookKeywords]),
  ]);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) =>
      matchesCenterSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')),
    )
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) =>
      matchesCenterSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')),
    )
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) =>
      matchesCenterSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')),
    )
    .slice(0, 2);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易工具中心',
      description: `把世界易综合报告拆成 ${allTools.length} 个单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。`,
      path: '/tools',
      keywords: ['世界易工具', '单项测试工具', '职业测试', '财富测试', '关系测试'],
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '工具中心', path: '/tools' },
    ]),
    createItemListSchema(
      '工具分类入口',
      categories.map((category, index) => ({
        name: category.title,
        path: `/tools/category/${category.key}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '推荐工具',
      featured.map((tool, index) => ({
        name: tool.title,
        path: `/tools/${tool.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tool_center', toolCount: allTools.length }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="先做综合判断" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO + 工具矩阵指标 */}
        <section className="mb-8 md:mb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <Stack gap={3}>
              <Eyebrow icon={<Wrench className="h-3 w-3" />}>工具中心</Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                先选你最卡的<span className="text-[color:var(--brand-strong)]">一条问题线</span>
              </h1>
              <Lede>
                把世界易综合报告拆成单项测试工具，按六域、阶段窗口与生活应用组织的可复访工具矩阵。
              </Lede>
              <Inline gap={2} wrap className="pt-1">
                <Link
                  href="/analyze"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
                >
                  先建立个人底盘
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs/use-tools"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                >
                  使用方法
                </Link>
              </Inline>
            </Stack>

            <Card variant="default" padding="lg" className="bg-[color:var(--bg-elevated)]">
              <Eyebrow tone="muted" className="mb-4">工具矩阵</Eyebrow>
              <div className="grid grid-cols-3 gap-4">
                <Stat label="工具总数" value={String(allTools.length)} size="md" />
                <Stat label="问题线" value={String(categories.length)} size="md" />
                <Stat label="工具包" value={String(bundles.length)} size="md" />
              </div>
            </Card>
          </div>
        </section>

        {/* 高意图免费工具（金色铁律） */}
        {priorityGrowthTools.length > 0 && (
          <section className="mb-10 scroll-mt-28">
            <Inline justify="between" align="end" className="mb-5">
              <div>
                <Eyebrow tone="signal" icon={<Sparkles className="h-3 w-3" />}>
                  免费高意图工具
                </Eyebrow>
                <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
                  先免费给你一份结构结果
                </h2>
              </div>
              <Tag tone="signal" variant="solid" size="sm">
                免费
              </Tag>
            </Inline>

            <div className="grid gap-4 lg:grid-cols-2">
              {priorityGrowthTools.map((tool) => {
                const growthProfile = getToolGrowthProfile(tool.slug);
                return (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page="/tools"
                    className="group block rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--paper)] p-5 transition hover:-translate-y-px hover:shadow-[var(--shadow-pop)]"
                  >
                    <Eyebrow tone="signal" className="mb-3">
                      {growthProfile?.stageLabel || tool.category}
                    </Eyebrow>
                    <h3 className="text-lg font-black leading-tight text-[color:var(--ink-1)]">
                      {tool.shortTitle}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--ink-4)]">
                      {growthProfile?.heroSubtitle || tool.description}
                    </p>
                    <Stack gap={2} className="mt-4">
                      {(growthProfile?.freeValueBullets || tool.freeInsights)
                        .slice(0, 2)
                        .map((item) => (
                          <div
                            key={item}
                            className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]"
                          >
                            {item}
                          </div>
                        ))}
                    </Stack>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--signal-strong)] transition-all group-hover:gap-2">
                      {growthProfile?.primaryCtaLabel || '开始免费测算'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </ToolCardLink>
                );
              })}
            </div>
          </section>
        )}

        {/* 问题线（核心选择） */}
        <section id="problem-lines" className="mb-10 scroll-mt-28">
          <Inline justify="between" align="end" className="mb-5">
            <div>
              <Eyebrow icon={<Compass className="h-3 w-3" />}>问题线</Eyebrow>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
                按你最卡的方向选一条
              </h2>
            </div>
          </Inline>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/tools/category/${category.key}`}
                className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:shadow-[var(--shadow-card)]"
              >
                <Inline justify="between" align="center">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {category.count} TOOLS
                  </span>
                  <ArrowRight className="h-4 w-4 text-[color:var(--ink-5)] transition-all group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-strong)]" />
                </Inline>
                <h3 className="mt-3 text-base font-bold text-[color:var(--ink-1)]">
                  {category.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--ink-4)]">
                  {toolProblemLineGuides[category.key]?.prompt || category.description}
                </p>
                <div className="mt-3 rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] px-2.5 py-1.5 text-[11px] leading-4 text-[color:var(--brand-strong)]">
                  {toolProblemLineGuides[category.key]?.firstStep || category.headline}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 第二步：兜底工具 */}
        <section className="mb-10">
          <Inline justify="between" align="end" className="mb-5">
            <div>
              <Eyebrow icon={<Layers className="h-3 w-3" />}>没头绪？</Eyebrow>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
                先做这几个高价值工具
              </h2>
            </div>
          </Inline>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featured.slice(0, 6).map((tool) => (
              <ToolCardLink
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                toolSlug={tool.slug}
                category={tool.category}
                page="/tools"
                className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:border-[color:var(--brand)]"
              >
                <Eyebrow tone="muted" className="mb-2">
                  {tool.category}
                </Eyebrow>
                <h3 className="text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                  {tool.shortTitle}
                </h3>
                <Inline gap={1} wrap className="mt-3">
                  {tool.hookKeywords.slice(0, 3).map((keyword) => (
                    <Tag key={keyword} tone="default" variant="soft" size="xs">
                      {keyword}
                    </Tag>
                  ))}
                </Inline>
              </ToolCardLink>
            ))}
          </div>
        </section>

        {/* 其他进入方式（横排小卡） */}
        <section className="mb-10">
          <Eyebrow tone="muted" className="mb-4">其他进入方式</Eyebrow>
          <div className="grid gap-3 md:grid-cols-3">
            {toolEntryModes.map((mode) => (
              <Link
                key={mode.key}
                href={mode.href}
                className="group block rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                  {mode.action}
                </div>
                <h3 className="mt-2 text-sm font-bold text-[color:var(--ink-1)]">{mode.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--ink-4)]">
                  {mode.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <PublicGrowthFeedPanel
          title="工具相关公开查询"
          description="工具中心不只给入口，也展示匿名报告和公开追问；你可以顺着真实问题生成自己的判断。"
          signals={[
            ...categories.flatMap((category) => [category.title, category.headline]),
            ...featured.flatMap((tool) => [tool.shortTitle, tool.themeLabel, ...tool.hookKeywords]),
          ]}
          reportLimit={3}
          questionLimit={5}
        />

        {/* 内容证据层 */}
        <PublicEvidencePanel
          page="/tools"
          title="工具入口接到内容证据"
          description="先用分类和单项工具定位问题，再顺着知识解释、案例证据和实体洞察下钻。"
          surfaceKey="tool_center_content"
          knowledgeItems={knowledgeItems}
          caseItems={caseItems}
          insightItems={insightItems}
        />

        {bundles.length > 0 && (
          <section className="mt-10">
            <Eyebrow className="mb-4">同域工具组合</Eyebrow>
            <Stack gap={4}>
              {bundles.slice(0, 2).map((bundle) => (
                <ToolBundlePanel key={bundle.slug} bundle={bundle} page="/tools" />
              ))}
            </Stack>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
