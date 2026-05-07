export const revalidate = 3600;

import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolBundlePanel from '@/components/tool-bundle-panel';
import ToolCardLink from '@/components/tool-card-link';
import VisualAssetFeature from '@/components/visual-asset-feature';
import { createContentSignalMatcher } from '@/lib/content';
import { getCaseStudies, getEntityInsights, getKnowledgeArticles } from '@/lib/content-store';
import { toolEntryModes, toolProblemLineGuides } from '@/lib/product-experience';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools, getPriorityGrowthTools, getToolGrowthProfile, listToolBundles, listToolCategories, listToolDefinitions } from '@/lib/tools';
import { getVisualAssetById } from '@/lib/visual-asset-library';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '单项测试工具中心 | 人生K线',
    description: '把世界易综合报告拆成单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。',
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
  const toolMatrixImage = getVisualAssetById('PWY01-005');
  const matchesCenterSignal = createContentSignalMatcher([
    ...categories.flatMap((category) => [category.title, category.headline]),
    ...featured.flatMap((tool) => [tool.shortTitle, tool.themeLabel, ...tool.hookKeywords]),
  ]);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesCenterSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesCenterSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesCenterSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surfaceKey: 'tool_center', toolCount: allTools.length }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="先做综合判断" />

      <main className="page-frame py-4 pb-16 md:py-6 md:pb-20">
        {priorityGrowthTools.length > 0 ? (
          <section className="scroll-mt-28 rounded-[2rem] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/70 p-5 md:p-7">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              SEO/GEO 冷启动工具
            </div>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
                  先把高意图用户带进一次免费测算
                </h1>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] md:text-base">
                  第一阶段优先用年度窗口和手相上传承接搜索、AI 回答页和社交流量：免费给结构结果，再引导保存、复访、深测报告或人工复核。
                </p>
              </div>
              <Link href="/analyze" className="action-secondary shrink-0">
                先建立个人底盘
              </Link>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {priorityGrowthTools.map((tool) => {
                const growthProfile = getToolGrowthProfile(tool.slug);
                return (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page="/tools"
                    className="block rounded-[1.5rem] border border-[color:var(--accent)] bg-white/86 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                      {growthProfile?.stageLabel || tool.category}
                    </div>
                    <h2 className="mt-3 text-2xl font-black leading-tight text-[color:var(--ink)]">
                      {tool.shortTitle}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[color:var(--muted)]">
                      {growthProfile?.heroSubtitle || tool.description}
                    </p>
                    <div className="mt-4 grid gap-2 text-xs leading-6 text-[color:var(--ink)]">
                      {(growthProfile?.freeValueBullets || tool.freeInsights).slice(0, 2).map((item) => (
                        <div key={item} className="rounded-xl bg-[color:var(--accent-soft)] px-3 py-2">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="action-guide mt-4 inline-flex items-center gap-2">
                      {growthProfile?.primaryCtaLabel || '开始免费测算'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </ToolCardLink>
                );
              })}
            </div>
          </section>
        ) : null}

        <section id="problem-lines" className="mt-8 scroll-mt-28">
          <div className="section-label">
            <Compass className="h-3.5 w-3.5" />
            世界易工具中心
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
                先选你最卡的一条问题线
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/analyze" className="action-primary action-main shrink-0">
                先建立个人底盘
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/docs/use-tools" className="action-secondary shrink-0">
                使用方法
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/tools/category/${category.key}`}
                className="interactive-card rounded-xl p-4"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{category.count} 个工具 · 一条问题线</div>
                <h2 className="mt-2 text-xl font-bold text-[color:var(--ink)]">{category.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--muted)]">
                  {toolProblemLineGuides[category.key]?.prompt || category.description}
                </p>
                <div className="mt-3 rounded-lg bg-[color:var(--accent-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--accent-strong)]">
                  {toolProblemLineGuides[category.key]?.firstStep || category.headline}
                </div>
                <div className="action-guide mt-3 inline-flex items-center gap-2">
                  进入这一条线
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="其他进入方式"
            title="已经有明确路径时再展开"
            description="这些入口保留给老用户和带来源任务的用户，不默认挤占问题线选择。"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {toolEntryModes.map((mode) => (
                <Link key={mode.key} href={mode.href} className="interactive-card rounded-[1.4rem] p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{mode.action}</div>
                  <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{mode.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{mode.description}</p>
                </Link>
              ))}
            </div>
          </PriorityDisclosure>
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label={(
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                第二步
              </span>
            )}
            title="如果没有头绪，先做这几个"
            description="默认先选问题线；这些工具作为兜底入口，不再平铺抢首屏。"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featured.slice(0, 6).map((tool) => (
                <ToolCardLink
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  toolSlug={tool.slug}
                  category={tool.category}
                  page="/tools"
                  className="block rounded-xl border border-[color:var(--line)] bg-white/82 p-4 transition hover:border-[color:var(--accent)]"
                >
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.category}</div>
                  <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">{tool.shortTitle}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tool.hookKeywords.slice(0, 3).map((keyword) => (
                      <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </ToolCardLink>
              ))}
            </div>
          </PriorityDisclosure>
        </section>

        <ProductSurfaceRolePanel
          surface="tools"
          className="mt-8"
          title="工具中心先收敛问题线，再推荐少量首轮工具"
          compact
        />

        {toolMatrixImage ? (
          <section className="mt-10">
            <PriorityDisclosure
              label="工具矩阵说明"
              title={`${allTools.length} 个工具的完整结构`}
              description="需要理解工具体系时再展开，默认不打断选问题线。"
            >
              <VisualAssetFeature asset={toolMatrixImage} label="工具矩阵说明图" />
            </PriorityDisclosure>
          </section>
        ) : null}

        <PublicEvidencePanel
          page="/tools"
          title="从工具入口继续走到内容证据层"
          description="工具中心不该只是入口清单。先用分类和单项工具定位问题，再顺着知识解释、案例证据和实体洞察继续下钻，搜索和问答引擎也更容易理解这个站点到底能解决什么问题。"
          surfaceKey="tool_center_content"
          knowledgeItems={knowledgeItems}
          caseItems={caseItems}
          insightItems={insightItems}
        />

        {bundles.length > 0 ? (
          <section className="mt-10">
            <PriorityDisclosure
              label="工具包"
              title="同域工具组合"
              description="问题线选定后再看工具包，不默认展开完整矩阵。"
            >
              <div className="space-y-6">
                {bundles.slice(0, 2).map((bundle) => (
                  <ToolBundlePanel key={bundle.slug} bundle={bundle} page="/tools" />
                ))}
              </div>
            </PriorityDisclosure>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
