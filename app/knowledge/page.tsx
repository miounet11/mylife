import { ArrowRight, BookOpen, Compass, Globe2, Layers3, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = createPublicContentMetadata({
  title: '世界易知识库 | 人生K线',
  description: '围绕真太阳时、结构判断、结果阅读和决策应用建立长期可积累的现代判断知识库。',
  path: '/knowledge',
  type: 'website',
});

export const dynamic = 'force-dynamic';

const worldYiKnowledgePowerLinks = [
  {
    title: '十卷主书',
    description: '把世界易从母理论、方法、六域到传播治理全部挂在主书工程上。',
    href: '/world-yi/book',
    icon: BookOpen,
  },
  {
    title: '人生六域',
    description: '让事业、财富、关系、健康、家庭、迁移成为持续扩写的主干。',
    href: '/world-yi/domains',
    icon: Compass,
  },
  {
    title: '全球华人',
    description: '把留回、身份、婚姻、教育、养老等现实议题独立成层。',
    href: '/world-yi/global',
    icon: Globe2,
  },
  {
    title: '发布架构',
    description: '区分母文档、公开页面和产品化内容，避免体系继续失焦。',
    href: '/world-yi/publish',
    icon: Layers3,
  },
];

export default function KnowledgePage() {
  const worldYiStats = getWorldYiPublicStats();
  const localeGroups = new Map<ContentLocaleGroupKey, {
    groupLabel: string;
    groupDescription: string;
    sortOrder: number;
    entries: ReturnType<typeof listPublishedManagedContentEntriesByType>;
  }>();
  const knowledgeEntries = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry));
  knowledgeEntries.forEach((entry) => {
    const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
    const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';
    const presentation = getContentLocalePresentation(locale, market);
    const group = localeGroups.get(presentation.groupKey);
    if (group) {
      group.entries.push(entry);
      return;
    }

    localeGroups.set(presentation.groupKey, {
      groupLabel: presentation.groupLabel,
      groupDescription: presentation.groupDescription,
      sortOrder: presentation.sortOrder,
      entries: [entry],
    });
  });
  const groupedKnowledgeEntries = [...localeGroups.entries()]
    .sort((left, right) => left[1].sortOrder - right[1].sortOrder)
    .map(([groupKey, group]) => ({
      groupKey,
      ...group,
    }));
  const topicHubs = listKnowledgeTopicHubs({ limit: 4 });
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易知识库',
      description: '围绕真太阳时、结构判断、结果阅读和决策应用建立长期可积累的现代判断知识库。',
      path: '/knowledge',
      keywords: ['真太阳时', '结构判断', '报告阅读', '决策应用'],
    }),
    createItemListSchema(
      '知识库重点阅读',
      knowledgeEntries.slice(0, 10).map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '知识专题地图',
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
      <AnalyticsPageView eventName="knowledge_page_viewed" page="/knowledge" meta={{ surfaceKey: 'knowledge_page', contentType: 'knowledge' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              长期内容资产
            </>
          )}
          title={(
            <>
              知识库不是附属页，
              <span className="font-serif text-[color:var(--accent-strong)]">而是站点长期价值的一部分。</span>
            </>
          )}
          description="这里专门解释真太阳时、报告阅读、结构判断与现实决策等高价值主题。它既服务真实用户，也承担 SEO 与品牌可信度建设。"
          hint="首次使用建议：先看专题地图，再进入文章详情。"
          actions={[
            <ContentCardLink
              key="topics"
              href="/knowledge/topics"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
              className="action-primary action-main"
            >
              查看专题地图
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>,
            <ContentCardLink
              key="analyze"
              href="/analyze"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'analyze_page', contentType: 'knowledge' }}
              className="action-secondary"
            >
              回到分析入口
            </ContentCardLink>,
          ]}
          highlights={[
            { body: '真太阳时与结构判断精度' },
            { body: '普通用户如何读报告' },
            { body: '职业与关系场景应用' },
            { body: '世界易 v1.0.0.1 体系入口' },
          ]}
        />

        <section className="mt-8">
          <ContentCardLink
            href="/world-yi"
            page="/knowledge"
            meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'world_yi_page', contentType: 'knowledge', series: 'world-yi', version: 'v1.0.0.1' }}
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              世界易 v1.0.0.1
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">从一篇文章，进入一整套学说起点</h2>
                <p className="intro-copy mt-4">
                  世界易由凯莉提出，目标不是给旧叙事再套一层包装，而是在 AI 时代重新统一世界、人与环境的解释秩序。先读总论，再进入时代认知、方法、人生六域、起名、寻物、迁移与案例体系。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入世界易总入口
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['时代认知与版本观', '方法论与现代翻译', '人生六域', '生活应用与海外传播'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,237,226,0.92))] p-6 shadow-[0_22px_60px_rgba(34,33,30,0.08)] md:p-8">
            <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-[rgba(178,149,93,0.14)] blur-3xl" />
            <div className="absolute left-0 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[0.94fr_1.06fr]">
              <div className="space-y-5">
                <div className="section-label">
                  <Layers3 className="h-3.5 w-3.5" />
                  世界易知识系统层
                </div>
                <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                  知识库现在不再是散点文章，
                  <span className="font-serif text-[color:var(--accent-strong)]">而是在被世界易母系统重新组织。</span>
                </h2>
                <p className="intro-copy">
                  这里已经不只是常识合集。世界易正在把知识内容重写为主书、六域、应用、全球、案例与治理协同的版本化工程，让每一篇文章都能回到统一判断秩序。
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: '当前公开世界易内容', value: `${worldYiStats.publicKnowledgeCount + worldYiStats.publicCaseCount} 篇` },
                    { label: '中文主路径知识', value: `${worldYiStats.mainKnowledgeCount} 篇` },
                    { label: '全球华人知识', value: `${worldYiStats.globalKnowledgeCount} 篇` },
                    { label: '英文知识入口', value: `${worldYiStats.englishKnowledgeCount} 篇` },
                    { label: '案例证据层', value: `${worldYiStats.publicCaseCount} 篇` },
                    { label: '目标内容宇宙', value: `${worldYiRoadmapSummary.targetArticleCount} 篇` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] bg-white/82 p-4 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {worldYiKnowledgePowerLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <ContentCardLink
                      key={item.href}
                      href={item.href}
                      page="/knowledge"
                      meta={{
                        surfaceKey: 'knowledge_page_world_yi_system',
                        targetSurfaceKey: item.href.replace('/', '').replaceAll('/', '_'),
                        contentType: 'knowledge',
                        series: 'world-yi',
                        version: worldYiRoadmapSummary.version,
                      }}
                      className="rounded-[1.6rem] bg-white/84 p-5 transition hover:-translate-y-0.5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-4 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                      <p className="intro-copy mt-3">{item.description}</p>
                      <div className="action-guide mt-5 inline-flex items-center gap-2">
                        进入路径
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </ContentCardLink>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {topicHubs.length > 0 ? topicHubs.map((hub) => (
            <ContentCardLink
              key={hub.topicKey}
              href={`/knowledge/topics/${hub.topicSlug}`}
              page="/knowledge"
              meta={{
                surfaceKey: 'knowledge_topic_hubs',
                targetSurfaceKey: `knowledge_topic:${hub.topicSlug}`,
                contentType: 'knowledge',
                topicName: hub.topicName,
              }}
              className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                <Network className="h-3.5 w-3.5" />
                专题路径
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{hub.topicName}</h2>
              <p className="intro-copy mt-3">{`已形成 ${hub.entryCount} 篇互链内容，可直接作为专题入口。`}</p>
              {hub.relatedTopicNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {hub.relatedTopicNames.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-5 space-y-3">
                {hub.entries.slice(0, 3).map((item) => (
                  <div
                    key={item.entry.slug}
                    className="block rounded-[1.25rem] bg-white/70 p-4"
                  >
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.entry.title}</div>
                    <div className="intro-copy mt-2">{item.entry.excerpt}</div>
                  </div>
                ))}
              </div>
            </ContentCardLink>
          )) : (
            <div className="soft-card rounded-[1.75rem] p-6 intro-copy md:col-span-2">
              当前公开专题仍在整理中，先保留高质量基础文章对外展示。
            </div>
          )}
        </section>

        <section className="mt-10 space-y-5">
          <div className="flex flex-wrap gap-3">
            {groupedKnowledgeEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="product-chip"
              >
                {group.groupLabel}
                <span className="text-xs text-[color:var(--muted)]">{group.entries.length} 篇</span>
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {groupedKnowledgeEntries.map((group) => (
              <section key={group.groupKey} id={getLocaleAnchorId(group.groupKey)} className="space-y-4 scroll-mt-24">
                <div className="space-y-2">
                  <div className="section-label">
                    <BookOpen className="h-3.5 w-3.5" />
                    {group.groupLabel}
                  </div>
                  <p className="intro-copy">{group.groupDescription}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.entries.map((article) => {
                    const locale = typeof article.meta?.locale === 'string' ? article.meta.locale : '';
                    const market = typeof article.meta?.market === 'string' ? article.meta.market : '';

                    return (
                      <ContentCardLink
                        key={article.slug}
                        href={`/knowledge/${article.slug}`}
                        page="/knowledge"
                        meta={{
                          surfaceKey: `knowledge_page:${group.groupKey}`,
                          contentType: 'knowledge',
                          slug: article.slug,
                          title: article.title,
                          category: article.category,
                          tags: article.tags,
                          locale,
                          market,
                        }}
                        className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{article.category}</span>
                          <ContentLocaleBadge locale={locale} market={market} compact />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{article.title}</h2>
                        <p className="intro-copy mt-3">{article.excerpt}</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="action-guide mt-5 inline-flex items-center gap-2">
                          阅读全文
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </ContentCardLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge/topics"
            page="/knowledge"
            meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">继续往专题走</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">从单篇知识，进入专题地图</h2>
            <p className="intro-copy mt-3">想把单篇文章变成阅读路径，下一步就进专题地图。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              进入专题地图
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/knowledge"
            meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">继续往证据走</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">原理看完，回到案例库验证</h2>
            <p className="intro-copy mt-3">知识解释方法，案例验证它怎样落到真实问题里。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              查看案例库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/insights"
            page="/knowledge"
            meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">继续往环境走</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">把知识放回城市、行业与组织</h2>
            <p className="intro-copy mt-3">完整判断不会停在个人结构，还要补环境层。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              进入洞察中心
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="知识内容转化"
            sourceKey="knowledge_page"
            contentMeta={{ contentType: 'knowledge', surfaceKey: 'knowledge_page' }}
            title="读到这里，直接把生日带入个人分析"
            description="先填生日和时间，下一步补出生地即可开始分析。"
          />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="knowledge_page"
            title="订阅判断知识与站点更新"
            description="适合持续追踪世界易内容和产品更新。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
