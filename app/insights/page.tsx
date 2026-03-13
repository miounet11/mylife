import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getEntityInsightsByType,
  getEntityInsights,
} from '@/lib/content-store';
import { entityTypeLabels, getEntityInsightTypes, type EntityInsightType } from '@/lib/content';

export const metadata = {
  title: '行业与城市洞察 | 人生K线',
  description: '围绕行业、城市、组织节奏等具体场景建立高价值实体内容层，为搜索、传播与转化提供长期资产。',
};

export const dynamic = 'force-dynamic';

export default function InsightsPage() {
  const insightTypes = getEntityInsightTypes();
  const insights = getEntityInsights();

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="insights_page_viewed" page="/insights" meta={{ surfaceKey: 'insights_page', contentType: 'insight' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              实体内容层
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              真正能长期做大的站点，
              <span className="font-serif text-[color:var(--accent-strong)]">要把工具、结果和实体内容连起来。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里把行业、城市和组织节奏做成可索引、可内链、可持续扩展的内容页，服务搜索意图，也服务结果页后的继续阅读。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {insightTypes.map((type) => (
              <div key={type} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{entityTypeLabels[type]}</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {insights.filter((item) => item.type === type).length} 篇内容，围绕具体搜索场景建立公开内容资产。
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-10">
          {insightTypes.map((type) => (
            <TypeSection key={type} type={type} />
          ))}
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="洞察页转化"
            sourceKey="insights_page"
            contentMeta={{ contentType: 'insight', surfaceKey: 'insights_page' }}
            title="看完行业或城市节奏，直接测自己的时间窗口"
            description="公开洞察解决的是群体层理解，生日测算解决的是个人层决策。这里直接带入生日，下一步完成完整排盘。"
          />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="insights_page"
            title="订阅行业与城市洞察"
            description="适合希望持续跟踪职业、城市、组织节奏内容，以及公开结果页更新的人。"
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
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              查看洞察
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        ))}
      </div>
    </section>
  );
}
