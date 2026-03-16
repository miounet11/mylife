import { ArrowRight, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';

export const metadata = {
  title: '命理专题地图 | 人生K线',
  description: '自动聚合真太阳时、命盘结构、关系节奏、书单路径等知识专题，形成可持续扩写的命理主题网络。',
};

export const dynamic = 'force-dynamic';

export default function KnowledgeTopicsPage() {
  const topicHubs = listKnowledgeTopicHubs({ limit: 24 });

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/knowledge/topics"
        meta={{ surfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              自动专题地图
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              不只是一篇篇文章，
              <span className="font-serif text-[color:var(--accent-strong)]">而是一张能继续长大的专题网络。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              系统会自动把同一主题下的专题总览、概念词汇表、问题地图和书单路径聚合起来，形成真正可索引、可扩写、可互链的知识入口。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {topicHubs.length > 0 ? topicHubs.slice(0, 4).map((hub) => (
              <div key={hub.topicKey} className="soft-card rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                  <Network className="h-3.5 w-3.5" />
                  {hub.entryCount} 篇专题内容
                </div>
                <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{hub.topicName}</div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  涵盖 {hub.synthesisTypes.join('、')}，适合作为站内长期流量入口。
                </p>
              </div>
            )) : (
              <div className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--muted)] md:col-span-2">
                当前专题网络正在做公开层清洗，只保留通过质量门槛的专题页。整理完成前，知识库首页会继续承接基础内容。
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {topicHubs.length > 0 ? topicHubs.map((hub) => (
            <ContentCardLink
              key={hub.topicKey}
              href={`/knowledge/topics/${hub.topicSlug}`}
              page="/knowledge/topics"
              meta={{
                surfaceKey: 'knowledge_topics_page',
                targetSurfaceKey: `knowledge_topic:${hub.topicSlug}`,
                contentType: 'knowledge',
                topicName: hub.topicName,
                synthesisTypes: hub.synthesisTypes,
              }}
              className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                {hub.entryCount} 篇内容 · {hub.synthesisTypes.join('、')}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{hub.topicName}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                {hub.leadEntry.entry.excerpt}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hub.relatedTopicNames.slice(0, 4).map((item) => (
                  <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                进入专题
                <ArrowRight className="h-4 w-4" />
              </div>
            </ContentCardLink>
          )) : null}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
