export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Compass, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolBundlePanel from '@/components/tool-bundle-panel';
import ToolCardLink from '@/components/tool-card-link';
import { getFeaturedTools, listToolBundles, listToolCategories, listToolDefinitions } from '@/lib/tools';

export const metadata = {
  title: '单项测试工具中心 | 人生K线',
  description: '把世界易综合报告拆成 120 个单项测试工具，围绕六域、阶段窗口和生活应用建立可复访的个人化工具矩阵。',
};

export default function ToolsPage() {
  const categories = listToolCategories();
  const featured = getFeaturedTools(12);
  const allTools = listToolDefinitions();
  const bundles = listToolBundles();

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page="/tools"
        meta={{ surface: 'tool_center', toolCount: allTools.length }}
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
          title={(
            <>
              不是只给一份综合报告，
              <span className="font-serif text-[color:var(--accent-strong)]">而是把高频问题拆成 120 个单项工具。</span>
            </>
          )}
          description="这些工具默认读取你的综合判断、结构结论和历史记录，把事业、财富、关系、健康、家庭、迁移、阶段窗口和生活应用拆成更容易复访的入口。"
          hint="先完成一次综合判断，再进单项工具，结果会更稳定。"
          actions={[
            <Link key="analyze" href="/analyze" className="action-primary action-main">
              先建立个人底盘
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="profile" href="/profile" className="action-secondary">查看我的档案</Link>,
            <Link key="applications" href="/world-yi/applications" className="action-secondary">世界易应用层</Link>,
          ]}
          highlights={[
            { title: '120 个工具', body: '首批按六域、窗口与应用层组织，不再是零散页面。' },
            { title: '统一底盘', body: '所有工具优先复用综合报告、档案、聊天和专项服务。' },
            { title: '免费初测', body: '先给摘要结论，再引导深测、专项或订阅。' },
            { title: '可复访', body: '每个工具结果都会沉淀到你的个人工作台。' },
          ]}
        />

        <section className="mt-10">
          <div className="section-label">
            <Compass className="h-3.5 w-3.5" />
            分类入口
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/tools/category/${category.key}`}
                className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{category.count} 个工具</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{category.title}</h2>
                <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{category.description}</p>
                <div className="action-guide mt-4 inline-flex items-center gap-2">
                  进入这一组
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            推荐先做
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => (
              <ToolCardLink
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                toolSlug={tool.slug}
                category={tool.category}
                page="/tools"
                className="block rounded-[1.75rem] border border-[color:var(--line)] bg-white/82 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.category}</div>
                <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{tool.shortTitle}</h3>
                <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{tool.hook}</p>
                <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                  示例：{tool.caseStories[0]?.persona}做了 {tool.shortTitle}，{tool.caseStories[0]?.payoff}
                </div>
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
