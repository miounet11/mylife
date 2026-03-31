import Link from 'next/link';
import { ArrowRight, Building2, MapPinned, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getEntityInsightsByType } from '@/lib/content-store';
import { entityTypeLabels, type EntityInsightType } from '@/lib/content';

export const metadata = {
  title: '世界易环境洞察 | 人生K线',
  description: '把城市、行业、组织观察纳入世界易的环境判断系统，形成公开的环境观察层。',
};

export const dynamic = 'force-dynamic';

const typeIcons: Record<EntityInsightType, typeof MapPinned> = {
  city: MapPinned,
  industry: Building2,
  company: Sparkles,
};

const typeDescriptions: Record<EntityInsightType, string> = {
  city: '城市会放大人的某些结构，也会压缩另一些结构，所以地点从来不是背景板。',
  industry: '行业不是赛道标签，而是节奏、边界、协作模式和风险结构的集合。',
  company: '组织观察的重点，不是名头，而是岗位密度、接口成本和现实承载边界。',
};

export default function WorldYiInsightsPage() {
  const insightTypes: EntityInsightType[] = ['city', 'industry', 'company'];

  return (
    <div className="page-shell">
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
          title={(
            <>
              世界易不只看人，
              <span className="font-serif text-[color:var(--accent-strong)]">也把环境本身变成可阅读的系统。</span>
            </>
          )}
          description="城市、行业、组织不是外部背景，而是和结构、阶段并列的环境变量。世界易的洞察层，就是把这些变量重新拉回判断秩序里。"
          hint="建议先选一种环境类型（城市/行业/组织）再深入，不要并行阅读。"
          actions={[
            { href: '/insights', label: '全部洞察中心', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi', label: '回到世界易总入口' },
            { href: '/analyze', label: '进入判断' },
          ]}
          highlights={[
            { body: '城市会改变你的恢复速度和推进成本。' },
            { body: '行业会决定你每天以什么节奏被消耗或放大。' },
            { body: '组织会让同样的人在不同密度里呈现出完全不同的状态。' },
            { body: '环境变量看不见时，用户最容易把所有问题都归到自己身上。' },
          ]}
        />

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
                    <p className="intro-copy mt-3 max-w-3xl">{typeDescriptions[type]}</p>
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
                      <p className="intro-copy mt-3">{item.excerpt}</p>
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
      </main>

      <SiteFooter />
    </div>
  );
}
