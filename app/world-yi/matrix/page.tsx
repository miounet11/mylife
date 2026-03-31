import Link from 'next/link';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { worldYiExecutionBatches, worldYiRoadmapSummary } from '@/lib/world-yi';

export const metadata = {
  title: '世界易内容矩阵 | 人生K线',
  description: '世界易从十卷主书映射到 2000 篇内容矩阵的执行入口，展示首批 120 篇批次和扩写顺序。',
};

export const dynamic = 'force-dynamic';

export default function WorldYiMatrixPage() {
  return (
    <div className="page-shell">
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
          title={(
            <>
              十卷主书之后，
              <span className="font-serif text-[color:var(--accent-strong)]">内容矩阵开始进入执行层。</span>
            </>
          )}
          description={`世界易不是写完十卷就结束。主书负责定宪法，内容矩阵负责占领现实问题。这一页展示的是从十卷主书映射到首批 120 篇，再走向 ${worldYiRoadmapSummary.targetArticleCount} 篇的执行顺序。`}
          hint="先看主书工程，再看矩阵批次，最后进入具体域或应用入口。"
          actions={[
            { href: '/world-yi/book', label: '回到主书工程', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/domains', label: '六域入口' },
            { href: '/world-yi/applications', label: '应用入口' },
          ]}
          highlights={worldYiRoadmapSummary.tracks.map((track) => ({
            title: track.targetCount,
            body: track.label,
          }))}
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            首批 120 篇
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">先用六个批次把母语、六域、应用、全球、案例和治理稳定下来</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {worldYiExecutionBatches.map((batch) => (
              <div key={batch.phase} className="rounded-[1.75rem] bg-white/80 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {batch.phase}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                    {batch.targetCount} 篇
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{batch.title}</h3>
                <p className="intro-copy mt-3">{batch.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {batch.focus.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
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
