export const revalidate = 3600;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import PublicGrowthFeedPanel from '@/components/public-growth-feed-panel';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import { createContentSignalMatcher } from '@/lib/content';
import { getEntityInsights, getKnowledgeArticles, getCaseStudies } from '@/lib/content-store';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { toolProblemLineGuides } from '@/lib/product-experience';
import { listToolCategories, listToolsByCategory, type ToolCategoryKey } from '@/lib/tools';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = listToolCategories().find((item) => item.key === category);

  if (!categoryInfo) {
    return createPublicContentMetadata({
      title: '工具分类 | 人生K线',
      description: '围绕高频问题组织的单项工具分类页。',
      path: `/tools/category/${category}`,
      type: 'website',
    });
  }

  return createPublicContentMetadata({
    title: `${categoryInfo.title} | 人生K线工具中心`,
    description: categoryInfo.description,
    path: `/tools/category/${categoryInfo.key}`,
    type: 'website',
  });
}

export async function generateStaticParams() {
  return listToolCategories().map((item) => ({
    category: item.key,
  }));
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryInfo = listToolCategories().find((item) => item.key === category);
  if (!categoryInfo) {
    notFound();
  }

  const tools = listToolsByCategory(category as ToolCategoryKey);
  const problemLineGuide = toolProblemLineGuides[categoryInfo.key as keyof typeof toolProblemLineGuides];
  const matchesCategorySignal = createContentSignalMatcher([
    categoryInfo.title,
    categoryInfo.headline,
    ...tools.flatMap((tool) => [tool.shortTitle, tool.themeLabel, ...tool.hookKeywords]),
  ]);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesCategorySignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesCategorySignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesCategorySignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
  const schemas = [
    createCollectionPageSchema({
      headline: categoryInfo.headline,
      description: categoryInfo.description,
      path: `/tools/category/${categoryInfo.key}`,
      keywords: [categoryInfo.title, categoryInfo.headline, ...tools.slice(0, 6).map((tool) => tool.shortTitle)],
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '工具中心', path: '/tools' },
      { name: categoryInfo.title, path: `/tools/category/${categoryInfo.key}` },
    ]),
    createItemListSchema(
      `${categoryInfo.title}清单`,
      tools.map((tool, index) => ({
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
        page={`/tools/category/${categoryInfo.key}`}
        meta={{ surfaceKey: 'tool_category', category: categoryInfo.key, toolCount: tools.length }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="回到工具中心" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3 w-3" />
              {categoryInfo.title}
            </>
          )}
          title={categoryInfo.headline}
          description={categoryInfo.description}
          hint={problemLineGuide
            ? `${problemLineGuide.firstStep} ${problemLineGuide.nextStep}`
            : '这一组工具适合在完成综合判断后继续细分问题；如果还没有个人底盘，建议先做综合判断。'}
          actions={[
            <Link
              key="tools"
              href="/tools"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              回到工具中心
              <ArrowRight className="h-4 w-4" />
            </Link>,
            <Link
              key="analyze"
              href="/analyze"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              先做综合判断
            </Link>,
            <Link
              key="docs"
              href="/docs/use-tools"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              <BookOpenText className="h-4 w-4" />
              使用方法
            </Link>,
          ]}
          highlights={[
            { title: '工具数', body: `${tools.length} 个` },
            { title: '前置', body: '综合判断' },
            { title: '后续', body: '单项复测' },
          ]}
          highlightsColumns="md:grid-cols-3"
        />

        {problemLineGuide ? (
          <section className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  问题线规则
                </div>
                <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">
                  先确认问题线，再选择一个工具
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    01 第一步
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-[color:var(--ink-2)]">
                    {problemLineGuide.firstStep}
                  </div>
                </div>
                <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                    02 下一步
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-[color:var(--brand-strong)]">
                    {problemLineGuide.nextStep}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCardLink
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              toolSlug={tool.slug}
              category={tool.category}
              page={`/tools/category/${categoryInfo.key}`}
              className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                {tool.themeLabel}
              </div>
              <h2 className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
                {tool.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.hookKeywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 text-[10px] font-semibold text-[color:var(--ink-4)]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </ToolCardLink>
          ))}
        </section>

        <PublicGrowthFeedPanel
          title={`${categoryInfo.title}相关公开查询`}
          description="分类页直接露出同类匿名报告和用户追问，避免工具页只有静态入口，搜索引擎和用户都能继续顺着问题走。"
          signals={[
            categoryInfo.title,
            categoryInfo.headline,
            categoryInfo.description,
            ...tools.flatMap((tool) => [tool.shortTitle, tool.themeLabel, ...tool.hookKeywords]),
          ]}
          reportLimit={2}
          questionLimit={4}
        />

        <PublicEvidencePanel
          page={`/tools/category/${categoryInfo.key}`}
          title="把这组工具接到内容证据层"
          description="这类问题不该只停留在工具列表里。先用工具做判断，再顺着知识解释、案例证据和实体洞察继续下钻，信息密度会更高，也更适合搜索与问答引擎理解。"
          surfaceKey="tool_category_content"
          knowledgeItems={knowledgeItems}
          caseItems={caseItems}
          insightItems={insightItems}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
