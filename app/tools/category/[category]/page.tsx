export const revalidate = 3600;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicEvidencePanel from '@/components/public-evidence-panel';
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

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {categoryInfo.title}
            </>
          )}
          title={categoryInfo.headline}
          description={categoryInfo.description}
          hint="这一组工具适合在完成综合判断后继续细分问题；如果还没有个人底盘，建议先做综合判断。"
          actions={[
            <Link key="tools" href="/tools" className="action-primary action-main">
              回到工具中心
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="analyze" href="/analyze" className="action-secondary">先做综合判断</Link>,
          ]}
          highlights={[
            { body: `${tools.length} 个工具` },
            { body: '综合判断' },
            { body: '单项复测' },
          ]}
          highlightsColumns="md:grid-cols-3"
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

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCardLink
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              toolSlug={tool.slug}
              category={tool.category}
              page={`/tools/category/${categoryInfo.key}`}
              className="block rounded-[1.75rem] border border-[color:var(--line)] bg-white/82 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.themeLabel}</div>
              <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{tool.title}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tool.hookKeywords.slice(0, 3).map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                {tool.caseStories[0]?.outcome || tool.shortTitle}
              </div>
            </ToolCardLink>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
