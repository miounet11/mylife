export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import { listToolCategories, listToolsByCategory, type ToolCategoryKey } from '@/lib/tools';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = listToolCategories().find((item) => item.key === category);

  return {
    title: categoryInfo ? `${categoryInfo.title} | 人生K线工具中心` : '工具分类 | 人生K线',
    description: categoryInfo?.description || '围绕高频问题组织的单项工具分类页。',
  };
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

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page={`/tools/category/${categoryInfo.key}`}
        meta={{ surface: 'tool_category', category: categoryInfo.key, toolCount: tools.length }}
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
          hint="先确定分类，再进入具体工具，能显著减少误点与重复测试。"
          actions={[
            <Link key="tools" href="/tools" className="action-primary action-main">
              回到工具中心
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="analyze" href="/analyze" className="action-secondary">先做综合判断</Link>,
          ]}
          highlights={[
            { body: `${tools.length} 个工具已归入这一分类。` },
            { body: '优先先完成综合判断，再做单项复测。' },
            { body: '同类工具放在一起，适合连续缩窄问题。' },
          ]}
          highlightsColumns="md:grid-cols-3"
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
              <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{tool.hook}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tool.hookKeywords.slice(0, 3).map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
                适合：{tool.targetUser}
              </div>
              <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                示例：{tool.caseStories[0]?.persona}用它后，{tool.caseStories[0]?.outcome}
              </div>
            </ToolCardLink>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
