import { ArrowRight, BookOpen, Layers3, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiExecutionBatches, worldYiRoadmapSummary } from '@/lib/world-yi';

export const metadata = createPublicContentMetadata({
  title: '世界易内容矩阵 | 人生K线',
  description: '世界易从十卷主书映射到 2000 篇内容矩阵的执行入口，展示首批 120 篇批次和扩写顺序。',
  path: '/world-yi/matrix',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/matrix',
    'x-default': '/world-yi/matrix',
  },
});

export const dynamic = 'force-dynamic';

export default function WorldYiMatrixPage() {
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易内容矩阵',
      description: '世界易从十卷主书映射到 2000 篇内容矩阵的执行入口，展示首批 120 篇批次和扩写顺序。',
      path: '/world-yi/matrix',
      keywords: ['世界易', '内容矩阵', '主书', '批次', '专题', '案例'],
    }),
    createItemListSchema(
      '世界易执行批次',
      worldYiExecutionBatches.map((batch, index) => ({
        name: `${batch.phase} ${batch.title}`,
        path: '/world-yi/matrix',
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/matrix"
        meta={{ surfaceKey: 'world_yi_matrix_page', contentType: 'knowledge', series: 'world-yi-matrix' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Layers3 className="h-3.5 w-3.5" />
              世界易内容矩阵
            </>
          )}
          title="内容矩阵"
          description="这里展示世界易如何从十卷主书继续拆成专题、案例和入口内容，让整套内容工程有清晰扩写顺序。"
          hint="如果你关心体系扩写和内容覆盖范围，可以从这里看结构；如果你是来解决自己的问题，优先进入分析。"
          actions={[
            { href: '/world-yi/book', label: '回到主书工程', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/domains', label: '六域入口' },
            { href: '/world-yi/applications', label: '应用入口' },
          ]}
          highlights={worldYiRoadmapSummary.tracks.map((track) => ({
            title: String(track.targetCount),
            body: track.label,
          }))}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/book"
            page="/world-yi/matrix"
            meta={{ surfaceKey: 'world_yi_matrix_page_network', targetSurfaceKey: 'world_yi_book_page', contentType: 'knowledge', series: 'world-yi-book' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <BookOpen className="h-3.5 w-3.5" />
              回到主书
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">主书工程</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/network"
            page="/world-yi/matrix"
            meta={{ surfaceKey: 'world_yi_matrix_page_network', targetSurfaceKey: 'world_yi_network_page', contentType: 'knowledge', series: 'world-yi-network' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Network className="h-3.5 w-3.5" />
              网络图
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">结构关系图</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/knowledge/topics"
            page="/world-yi/matrix"
            meta={{ surfaceKey: 'world_yi_matrix_page_network', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge', series: 'world-yi-matrix' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              专题层
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">知识主题入口</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            首批 120 篇
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">批次列表</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {worldYiExecutionBatches.map((batch) => (
              <div key={batch.phase} className="rounded-[1.75rem] bg-white/80 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {batch.phase}
                  </span>
                  <span className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                    {batch.targetCount} 篇
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{batch.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {batch.focus.map((item) => (
                    <span key={item} className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-xs tracking-[0.16em] text-[color:var(--muted)]">
                  对应主书：{batch.relatedVolumes.join('、')}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
