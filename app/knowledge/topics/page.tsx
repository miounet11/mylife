import { ArrowRight, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '判断专题地图 | 人生K线',
  description: '自动聚合真太阳时、结构判断、关系节奏、书单路径等知识专题，形成可持续扩写的判断主题网络。',
  path: '/knowledge/topics',
  type: 'website',
});

export const dynamic = 'force-dynamic';

export default function KnowledgeTopicsPage() {
  const topicHubs = listKnowledgeTopicHubs({ limit: 24 });
  const schemas = [
    createCollectionPageSchema({
      headline: '判断专题地图',
      description: '自动聚合真太阳时、结构判断、关系节奏、书单路径等知识专题，形成可持续扩写的判断主题网络。',
      path: '/knowledge/topics',
      keywords: ['专题地图', '主题网络', '判断专题', '世界易专题'],
    }),
    createItemListSchema(
      '专题地图节点',
      topicHubs.map((hub, index) => ({
        name: hub.topicName,
        path: `/knowledge/topics/${hub.topicSlug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/knowledge/topics"
        meta={{ surfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              自动专题地图
            </>
          )}
          title={(
            <>
              不只是一篇篇文章，
              <span className="font-serif text-[color:var(--accent-strong)]">而是一张能继续长大的专题网络。</span>
            </>
          )}
          description="系统会自动把同一主题下的专题总览、概念词汇表、问题地图和书单路径聚合起来，形成真正可索引、可扩写、可互链的知识入口。"
          hint="首次进入建议先打开一个专题，再回到分析页验证与你的实际问题是否匹配。"
          actions={[
            <ContentCardLink
              key="analyze"
              href="/analyze"
              page="/knowledge/topics"
              meta={{ surfaceKey: 'knowledge_topics_page', targetSurfaceKey: 'analyze_page', contentType: 'knowledge' }}
              className="action-primary action-main"
            >
              开始分析
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>,
            <ContentCardLink
              key="knowledge"
              href="/knowledge"
              page="/knowledge/topics"
              meta={{ surfaceKey: 'knowledge_topics_page', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
              className="action-secondary"
            >
              回到知识库
            </ContentCardLink>,
          ]}
          highlights={topicHubs.length > 0 ? topicHubs.slice(0, 4).map((hub) => ({
            title: (
              <>
                <span className="mr-2 inline-flex align-middle">
                  <Network className="h-3.5 w-3.5" />
                </span>
                {hub.entryCount} 篇专题内容
              </>
            ),
            body: `${hub.topicName} · 涵盖 ${hub.synthesisTypes.join('、')}，适合作为站内长期流量入口。`,
          })) : [
            { body: '当前专题网络正在做公开层清洗，只保留通过质量门槛的专题页。整理完成前，知识库首页会继续承接基础内容。' },
          ]}
        />

        <section className="mt-8">
          <ContentCardLink
            href="/world-yi/network"
            page="/knowledge/topics"
            meta={{
              surfaceKey: 'knowledge_topics_page',
              targetSurfaceKey: 'world_yi_network_page',
              contentType: 'knowledge',
              series: 'world-yi-network',
              version: 'v1.0.0.1',
            }}
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              世界易主轴
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">专题地图之外，还需要一条真正统一的母路径</h2>
                <p className="intro-copy mt-4">
                  世界易不是散落专题的集合，而是把时代、科技、环境、结构、时位与动作重新组织起来的高维判断系统。它应该成为所有专题之上的母体系。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入世界易专题地图
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['四句母命题', '六层引力模型', '五大学理基础', '主书与2000篇内容工程'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
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
              <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                {hub.leadEntry.entry.excerpt}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hub.relatedTopicNames.slice(0, 4).map((item) => (
                  <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {item}
                  </span>
                ))}
              </div>
              <div className="action-guide mt-5 inline-flex items-center gap-2">
                进入专题
                <ArrowRight className="h-4 w-4" />
              </div>
            </ContentCardLink>
          )) : null}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge"
            page="/knowledge/topics"
            meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到文章层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">专题地图之外，回知识库找基础文章</h2>
            <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
              专题页适合做主干导航，但用户仍然需要回到知识库，按语言、市场和基础主题逐篇补足理解。
            </p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              返回知识库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/knowledge/topics"
            meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到证据层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">专题地图之后，去案例库看现实问题</h2>
            <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
              当专题概念形成后，下一步最自然的去向就是案例库，因为案例会把概念转成用户能感知的具体情境。
            </p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看案例库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi/network"
            page="/knowledge/topics"
            meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'world_yi_network_page', contentType: 'knowledge', series: 'world-yi-network' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母网络</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">专题网络最终仍然要回到世界易主轴</h2>
            <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
              判断专题如果没有母路径，很容易重新碎片化。把它们挂回世界易主轴，才能持续形成更大的主题网络。
            </p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看世界易网络
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
