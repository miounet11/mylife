export const revalidate = 3600;

import Link from 'next/link';
import { ArrowRight, Compass, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import PublicSurfaceHero from '@/components/public-surface-hero';
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
import { getFeaturedTools, listToolBundles, listToolCategories, listToolDefinitions } from '@/lib/tools';
import { getVisualAssetById } from '@/lib/visual-asset-library';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '单项测试工具中心 | 人生K线',
    description: '把世界易综合报告拆成 120 个单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。',
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
      description: '把世界易综合报告拆成 120 个单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。',
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

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Layers3 className="h-3.5 w-3.5" />
              世界易工具中心
            </>
          )}
          title="先选问题线，再进工具"
          description="工具中心不再让用户从 120 个工具里乱点。先按当前最卡的一条问题线进入，再由系统推荐少量下一步。"
          hint="如果你还没有做过综合判断，建议先建立个人底盘；如果已经有报告，就直接选下面最接近的问题线。"
          actions={[
            <Link key="analyze" href="/analyze" className="action-primary action-main">
              先建立个人底盘
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="categories" href="#problem-lines" className="action-secondary">按问题线选择</Link>,
          ]}
          highlights={[
            { body: '先分流' },
            { body: '少量推荐' },
            { body: '承接报告' },
            { body: '可复访' },
          ]}
        />

        <ProductSurfaceRolePanel
          surface="tools"
          className="mt-8"
          title="工具中心先收敛问题线，再推荐少量首轮工具"
          compact
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {toolEntryModes.map((mode) => (
            <Link key={mode.key} href={mode.href} className="soft-card rounded-[1.4rem] p-5 transition hover:border-[color:var(--accent)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{mode.action}</div>
              <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{mode.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{mode.description}</p>
            </Link>
          ))}
        </section>

        <section id="problem-lines" className="mt-10 scroll-mt-28">
          <div className="section-label">
            <Compass className="h-3.5 w-3.5" />
            第一步
          </div>
          <div className="mt-3 max-w-3xl">
            <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">你现在最想解决哪一类问题？</h2>
            <p className="intro-copy mt-3">
              先选一条主线。不要同时点很多工具，主线确定后再进入对应工具组，系统会继续给出下一步。
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/tools/category/${category.key}`}
	                className="glass-panel rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]"
	              >
	                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{category.count} 个工具 · 一条问题线</div>
	                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{category.title}</h2>
	                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
	                  {toolProblemLineGuides[category.key]?.prompt || category.description}
	                </p>
	                <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
	                  {toolProblemLineGuides[category.key]?.firstStep || category.headline}
	                </div>
	                {toolProblemLineGuides[category.key]?.nextStep ? (
	                  <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
	                    {toolProblemLineGuides[category.key].nextStep}
	                  </div>
	                ) : null}
                <div className="action-guide mt-4 inline-flex items-center gap-2">
                  进入这一条线
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            第二步
          </div>
          <div className="mt-3 max-w-3xl">
            <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">如果没有头绪，先做这几个</h2>
            <p className="intro-copy mt-3">
              这里不展示全部工具，只放最容易承接主报告、最适合作为第一轮细分判断的工具。
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.slice(0, 6).map((tool) => (
              <ToolCardLink
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                toolSlug={tool.slug}
                category={tool.category}
                page="/tools"
	                className="block rounded-[1.5rem] border border-[color:var(--line)] bg-white/82 p-5 transition hover:border-[color:var(--accent)]"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.category}</div>
                <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{tool.shortTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{tool.valuePromise}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tool.hookKeywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {keyword}
                    </span>
                  ))}
                </div>
              </ToolCardLink>
            ))}
          </div>
        </section>

        {toolMatrixImage ? (
          <section className="mt-10">
            <VisualAssetFeature asset={toolMatrixImage} label="工具矩阵说明图" />
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

        <section className="mt-10 space-y-6">
          {bundles.slice(0, 2).map((bundle) => (
            <ToolBundlePanel key={bundle.slug} bundle={bundle} page="/tools" />
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
