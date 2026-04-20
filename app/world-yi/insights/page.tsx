import { ArrowRight, BookOpenText, Building2, Compass, LibraryBig, MapPinned, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getCaseStudies, getEntityInsightsByType, getKnowledgeArticles } from '@/lib/content-store';
import { entityTypeLabels, type EntityInsightType } from '@/lib/content';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';

export const metadata = createPublicContentMetadata({
  title: '世界易环境洞察 | 人生K线',
  description: '把城市、行业、组织观察纳入世界易的环境判断系统，形成公开的环境观察层。',
  path: '/world-yi/insights',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/insights',
    'x-default': '/world-yi/insights',
  },
});

export const dynamic = 'force-dynamic';

const typeIcons: Record<EntityInsightType, typeof MapPinned> = {
  city: MapPinned,
  industry: Building2,
  company: Sparkles,
};

export default function WorldYiInsightsPage() {
  const insightTypes: EntityInsightType[] = ['city', 'industry', 'company'];
  const allInsights = insightTypes.flatMap((type) => getEntityInsightsByType(type));
  const insightSignals = allInsights.flatMap((item) => [item.title, item.excerpt, item.name, ...item.tags]);
  const matchesInsightSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return insightSignals.some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesInsightSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesInsightSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesInsightSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易环境洞察',
      description: '把城市、行业、组织观察纳入世界易的环境判断系统，形成公开的环境观察层。',
      path: '/world-yi/insights',
      keywords: ['世界易', '环境洞察', '城市', '行业', '组织'],
    }),
    createItemListSchema(
      '世界易环境洞察列表',
      allInsights.map((item, index) => ({
        name: item.title,
        path: `/insights/${item.type}/${item.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '环境洞察关联知识',
      knowledgeItems.map((item, index) => ({
        name: item.title,
        path: `/knowledge/${item.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="insights_page_viewed"
        page="/world-yi/insights"
        meta={{ surfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              世界易环境洞察
            </>
          )}
          title="环境洞察"
          description="把城市、行业和组织放进同一套环境观察框架里，帮助你在个人底盘之外补上外部变量。"
          hint="适合已经有个人判断、想继续看环境匹配度的人；如果还没有个人结果，先去分析入口。"
          actions={[
            { href: '/insights', label: '全部洞察中心', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi', label: '回到世界易总入口' },
            { href: '/analyze', label: '进入判断' },
          ]}
          highlights={[
            { body: '城市' },
            { body: '行业' },
            { body: '组织' },
          ]}
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <div className="section-label">
                <Compass className="h-3.5 w-3.5" />
                环境入口
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">把环境层接回主判断路径</h2>
              <div className="mt-4 text-sm text-[color:var(--ink)]">环境洞察不是孤立内容，它需要和工具、知识、案例一起形成完整入口。</div>
            </div>
            <ToolCardLink
              href={`/tools/${toolItems[0]?.slug || 'bazi'}`}
              toolSlug={toolItems[0]?.slug || 'bazi'}
              category={toolItems[0]?.category || 'analysis'}
              page="/world-yi/insights"
              className="block rounded-[1.75rem] bg-[color:var(--accent-soft)]/75 p-6 transition hover:bg-[color:var(--accent-soft)]"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">优先工具</div>
              <div className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{toolItems[0]?.shortTitle || '进入分析工具'}</div>
            </ToolCardLink>
            <ContentCardLink
              href={knowledgeItems[0] ? `/knowledge/${knowledgeItems[0].slug}` : '/knowledge'}
              page="/world-yi/insights"
              meta={{
                surfaceKey: 'world_yi_insights_page_network',
                targetSurfaceKey: knowledgeItems[0] ? `knowledge_article:${knowledgeItems[0].slug}` : 'knowledge_page',
                contentType: 'knowledge',
                series: 'world-yi-insights',
              }}
              className="block rounded-[1.75rem] bg-white/82 p-6 transition hover:bg-white"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">优先知识</div>
              <div className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{knowledgeItems[0]?.title || '进入知识中心'}</div>
            </ContentCardLink>
          </div>
        </section>

        <section className="mt-10 space-y-10">
          {insightTypes.map((type) => {
            const items = getEntityInsightsByType(type);
            const Icon = typeIcons[type];

            return (
              <section key={type}>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="section-label">
                      <Icon className="h-3.5 w-3.5" />
                      {entityTypeLabels[type]}
                    </div>
                    <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">{entityTypeLabels[type]}观察</h2>
                  </div>
                  <div className="text-sm text-[color:var(--muted)]">{items.length} 篇</div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <ContentCardLink
                      key={item.slug}
                      href={`/insights/${item.type}/${item.slug}`}
                      page="/world-yi/insights"
                      meta={{
                        surfaceKey: 'world_yi_insights_page',
                        targetSurfaceKey: `insight_article:${item.type}:${item.slug}`,
                        contentType: 'insight',
                        subtype: item.type,
                        slug: item.slug,
                        title: item.title,
                        name: item.name,
                        category: entityTypeLabels[type],
                        tags: item.tags,
                        series: 'world-yi-insights',
                      }}
                      className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
                    >
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
                      <h3 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h3>
                      <div className="action-guide mt-5 inline-flex items-center gap-2">
                        查看环境洞察
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </ContentCardLink>
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <BookOpenText className="h-3.5 w-3.5" />
              洞察相关知识
            </div>
            <div className="mt-5 space-y-3">
              {knowledgeItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/knowledge/${item.slug}`}
                  page="/world-yi/insights"
                  meta={{
                    surfaceKey: 'world_yi_insights_page',
                    targetSurfaceKey: `knowledge_article:${item.slug}`,
                    contentType: 'knowledge',
                    slug: item.slug,
                    title: item.title,
                    category: item.category,
                    tags: item.tags,
                    series: 'world-yi-insights',
                  }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <LibraryBig className="h-3.5 w-3.5" />
              洞察相关案例
            </div>
            <div className="mt-5 space-y-3">
              {caseItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page="/world-yi/insights"
                  meta={{
                    surfaceKey: 'world_yi_insights_page',
                    targetSurfaceKey: `case_article:${item.slug}`,
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                    series: 'world-yi-insights',
                  }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
