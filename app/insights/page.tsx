import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getEntityInsightsByType,
  getEntityInsights,
} from '@/lib/content-store';
import { entityTypeLabels, getEntityInsightTypes, type EntityInsightType } from '@/lib/content';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '行业与城市洞察 | 人生K线',
  description: '围绕行业、城市、组织节奏等具体场景建立高价值实体内容层，为搜索、传播与转化提供长期资产。',
  path: '/insights',
  type: 'website',
});

export const dynamic = 'force-dynamic';

export default function InsightsPage() {
  const insightTypes = getEntityInsightTypes();
  const insights = getEntityInsights();
  const schemas = [
    createCollectionPageSchema({
      headline: '行业与城市洞察',
      description: '围绕行业、城市、组织节奏等具体场景建立高价值实体内容层，为搜索、传播与转化提供长期资产。',
      path: '/insights',
      keywords: ['行业洞察', '城市洞察', '组织洞察', '环境节奏'],
    }),
    createItemListSchema(
      '实体洞察内容',
      insights.slice(0, 15).map((item, index) => ({
        name: item.title,
        path: `/insights/${item.type}/${item.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="insights_page_viewed" page="/insights" meta={{ surfaceKey: 'insights_page', contentType: 'insight' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              实体内容层
            </>
          )}
          title={(
            <>
              真正能长期做大的站点，
              <span className="font-serif text-[color:var(--accent-strong)]">要把工具、结果和实体内容连起来。</span>
            </>
          )}
          description="这里把行业、城市和组织节奏做成可索引、可内链、可持续扩展的内容页，服务搜索意图，也服务结果页后的继续阅读。"
          hint="先选一个类型进入，再决定是否回到分析页。"
          actions={[
            <ContentCardLink
              key="world-yi-insights"
              href="/world-yi/insights"
              page="/insights"
              meta={{ surfaceKey: 'insights_page', targetSurfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
              className="action-primary action-main"
            >
              进入环境主轴
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>,
            <ContentCardLink
              key="analyze"
              href="/analyze"
              page="/insights"
              meta={{ surfaceKey: 'insights_page', targetSurfaceKey: 'analyze_page', contentType: 'insight' }}
              className="action-secondary"
            >
              开始分析
            </ContentCardLink>,
          ]}
          highlights={insightTypes.map((type) => ({
            title: entityTypeLabels[type],
            body: `${insights.filter((item) => item.type === type).length} 篇内容，围绕具体搜索场景建立公开内容资产。`,
          }))}
          highlightsColumns="md:grid-cols-3"
        />

        <section className="mt-8">
          <ContentCardLink
            href="/world-yi/insights"
            page="/insights"
            meta={{
              surfaceKey: 'insights_page',
              targetSurfaceKey: 'world_yi_insights_page',
              contentType: 'insight',
              series: 'world-yi-insights',
              version: 'v1.0.0.1',
            }}
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              世界易环境观
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">城市、行业和组织，不是背景板，而是判断的一部分</h2>
                <p className="intro-copy mt-4">
                  世界易不只看个人结构，也看地点、行业、团队密度、文化语境和技术环境。洞察层存在的意义，就是把这些外部变量放回同一套判断结构里。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入世界易环境洞察
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['天时', '地利', '人和', '环境会放大代价或优势'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-10 space-y-10">
          {insightTypes.map((type) => (
            <TypeSection key={type} type={type} />
          ))}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge"
            page="/insights"
            meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到原理层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">环境看完，回知识库补判断语言</h2>
            <p className="intro-copy mt-3">环境变化要放回知识库里的结构、阶段和阅读框架里理解。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看知识库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/insights"
            meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到证据层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">环境看完，回案例库看真实落地</h2>
            <p className="intro-copy mt-3">行业和城市是外部变量，真正落地还要回案例里看。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看案例库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi/insights"
            page="/insights"
            meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母路径</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">洞察页最终要回到世界易环境层</h2>
            <p className="intro-copy mt-3">每篇洞察最终都要回到世界易的环境判断主轴。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              进入环境主轴
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="洞察页转化"
            sourceKey="insights_page"
            contentMeta={{ contentType: 'insight', surfaceKey: 'insights_page' }}
            title="看完行业或城市节奏，直接测自己的时间窗口"
            description="公开洞察解决群体层理解，下一步直接测个人时间窗口。"
          />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="insights_page"
            title="订阅行业与城市洞察"
            description="适合持续跟踪职业、城市、组织节奏内容。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function TypeSection({ type }: { type: EntityInsightType }) {
  const items = getEntityInsightsByType(type);

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="section-label">{entityTypeLabels[type]}</div>
          <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">{entityTypeLabels[type]}内容</h2>
        </div>
        <div className="text-sm text-[color:var(--muted)]">{items.length} 篇</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ContentCardLink
            key={item.slug}
            href={`/insights/${item.type}/${item.slug}`}
            page="/insights"
            meta={{
              surfaceKey: 'insights_page',
              contentType: 'insight',
              subtype: item.type,
              slug: item.slug,
              title: item.title,
              name: item.name,
              category: entityTypeLabels[type],
              tags: item.tags,
            }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
            <h3 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h3>
            <p className="intro-copy mt-3">{item.excerpt}</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看洞察
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        ))}
      </div>
    </section>
  );
}
