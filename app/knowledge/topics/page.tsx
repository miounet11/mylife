import { ArrowRight, Compass, LibraryBig, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import PriorityDisclosure from '@/components/priority-disclosure';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import { getCaseStudies, getEntityInsights } from '@/lib/content-store';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';

export const metadata = createPublicContentMetadata({
  title: '判断专题地图 | 人生K线',
  description: '自动聚合真太阳时、结构判断、关系节奏、书单路径等知识专题，形成可持续扩写的判断主题网络。',
  path: '/knowledge/topics',
  type: 'website',
  languages: {
    'zh-CN': '/knowledge/topics',
    'x-default': '/knowledge/topics',
  },
});

export const revalidate = 3600;

export default function KnowledgeTopicsPage() {
  const topicHubs = listKnowledgeTopicHubs({ limit: 24 });
  const topicSignals = new Set(topicHubs.flatMap((hub) => [hub.topicName, ...hub.relatedTopicNames]));
  const matchesTopicSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return [...topicSignals].some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesTopicSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesTopicSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesTopicSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
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

      <main className="page-frame py-4 pb-16 md:py-6 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              自动专题地图
            </>
          )}
          title="专题地图"
          description="把知识库按主题重新组织，帮助你从零散文章进入一条可连续阅读的判断路径。"
          hint="如果你的目标不是学习方法，而是得到自己的结果，可以直接回到分析入口。"
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
          highlights={topicHubs.slice(0, 4).map((hub) => ({
            title: (
              <>
                <span className="mr-2 inline-flex align-middle">
                  <Network className="h-3.5 w-3.5" />
                </span>
                {hub.entryCount} 篇
              </>
            ),
            body: hub.topicName,
          }))}
        />

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topicHubs.map((hub) => (
            <ContentCardLink
              key={hub.topicKey}
              href={`/knowledge/topics/${hub.topicSlug}`}
              page="/knowledge/topics"
              meta={{ surfaceKey: 'knowledge_topics_page', targetSurfaceKey: `knowledge_topic:${hub.topicSlug}`, contentType: 'knowledge', topicName: hub.topicName }}
              className="glass-panel rounded-xl p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                <Network className="h-3.5 w-3.5" />
                {hub.entryCount} 篇
              </div>
              <h2 className="mt-3 text-xl font-bold leading-snug text-[color:var(--ink)]">{hub.topicName}</h2>
              {hub.relatedTopicNames.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hub.relatedTopicNames.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </ContentCardLink>
          ))}
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="世界易主轴"
            title="主轴入口与专题结构"
            description="专题列表优先，系统主轴默认收起。"
          >
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
            className="glass-panel block rounded-xl p-5 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              世界易主轴
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">主轴入口</h2>
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
          </PriorityDisclosure>
        </section>

        <section className="mt-10">
          <PriorityDisclosure
            label="延伸路径与证据"
            title="把专题地图接到工具、案例和环境洞察"
            description="补充路径默认收起，不抢专题列表。"
          >
          <div className="glass-panel rounded-xl p-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              延伸路径与证据
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">把专题地图接到工具、案例和环境洞察</h2>
            <div className="intro-copy mt-3 max-w-3xl">
              专题地图不该只负责组织知识文章。它还应该把同一主题线继续接到工具入口、真实案例和环境洞察，让整个主题网络更像完整问题图谱。
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {toolItems.length > 0 ? (
                <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                    <Compass className="h-4 w-4" />
                    相关工具
                  </div>
                  <div className="mt-4 grid gap-3">
                    {toolItems.map((tool) => (
                      <ToolCardLink
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        toolSlug={tool.slug}
                        category={tool.category}
                        page="/knowledge/topics"
                        className="block rounded-[1.25rem] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
                      >
                        <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.themeLabel}</div>
                        <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{tool.shortTitle}</div>
                      </ToolCardLink>
                    ))}
                  </div>
                </div>
              ) : null}

              {caseItems.length > 0 ? (
                <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                    <LibraryBig className="h-4 w-4" />
                    相关案例
                  </div>
                  <div className="mt-4 grid gap-3">
                    {caseItems.map((item) => (
                      <ContentCardLink
                        key={item.slug}
                        href={`/cases/${item.slug}`}
                        page="/knowledge/topics"
                        meta={{ surfaceKey: 'knowledge_topics_page_evidence', targetSurfaceKey: `case_article:${item.slug}`, contentType: 'case' }}
                        className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                      >
                        <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                        <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                      </ContentCardLink>
                    ))}
                  </div>
                </div>
              ) : null}

              {insightItems.length > 0 ? (
                <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                    <Sparkles className="h-4 w-4" />
                    相关洞察
                  </div>
                  <div className="mt-4 grid gap-3">
                    {insightItems.map((item) => (
                      <ContentCardLink
                        key={item.slug}
                        href={`/insights/${item.type}/${item.slug}`}
                        page="/knowledge/topics"
                        meta={{ surfaceKey: 'knowledge_topics_page_evidence', targetSurfaceKey: `insight_article:${item.slug}`, contentType: 'insight' }}
                        className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                      >
                        <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
                        <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                      </ContentCardLink>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          </PriorityDisclosure>
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="更多入口"
            title="知识、案例和世界易网络"
            description="补充入口不再平铺在专题地图后面。"
          >
            <div className="grid gap-3 lg:grid-cols-3">
              <ContentCardLink
                href="/knowledge"
                page="/knowledge/topics"
                meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
                className="glass-panel rounded-xl p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">知识</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">知识库</h2>
                <div className="action-guide mt-4 inline-flex items-center gap-2">
                  返回知识库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/cases"
                page="/knowledge/topics"
                meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
                className="glass-panel rounded-xl p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">案例</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">案例库</h2>
                <div className="action-guide mt-4 inline-flex items-center gap-2">
                  查看案例库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/world-yi/network"
                page="/knowledge/topics"
                meta={{ surfaceKey: 'knowledge_topics_page_network', targetSurfaceKey: 'world_yi_network_page', contentType: 'knowledge', series: 'world-yi-network' }}
                className="glass-panel rounded-xl p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">世界易网络</h2>
                <div className="action-guide mt-4 inline-flex items-center gap-2">
                  查看世界易网络
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            </div>
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
