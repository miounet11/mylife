import { ArrowRight, BookOpen, Compass, Globe2, Layers3, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getCaseStudies, getEntityInsights, isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '世界易知识库 | 人生K线',
    description: '围绕真太阳时、结构判断、结果阅读和决策应用建立长期可积累的现代判断知识库。',
    path: '/knowledge',
    type: 'website',
    languages: {
      'zh-CN': '/knowledge',
      'en-US': '/world-yi/en',
      'x-default': '/knowledge',
    },
  });
}

export const revalidate = 3600;

const worldYiKnowledgePowerLinks = [
  {
    title: '十卷主书',
    href: '/world-yi/book',
    icon: BookOpen,
  },
  {
    title: '人生六域',
    href: '/world-yi/domains',
    icon: Compass,
  },
  {
    title: '全球华人',
    href: '/world-yi/global',
    icon: Globe2,
  },
  {
    title: '发布架构',
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
  const knowledgeSignals = [
    ...topicHubs.flatMap((hub) => [hub.topicName, ...hub.relatedTopicNames]),
    ...knowledgeEntries.slice(0, 16).flatMap((entry) => [entry.title, entry.category || '', ...entry.tags]),
  ].filter((signal): signal is string => typeof signal === 'string' && signal.length > 0)
    .map((signal) => signal.toLowerCase());
  const matchesKnowledgeSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return knowledgeSignals.some((signal) => lowered.includes(signal));
  };
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesKnowledgeSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesKnowledgeSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesKnowledgeSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
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
          title="知识库"
          description="这里负责解释方法论、报告阅读方式和现实应用，帮助用户在进入个人判断前先建立清晰预期。"
          hint="如果你不是来做系统学习，而是想直接看自己的结果，可以随时回到分析入口。"
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
                <h2 className="text-3xl font-black text-[color:var(--ink)]">主入口</h2>
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
                <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">数据面板</h2>
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

        <PublicEvidencePanel
          page="/knowledge"
          title="把知识层接到工具、案例和环境洞察"
          description="只看原理还不够。知识库应该继续接到具体工具、真实案例和环境洞察，既帮助用户继续判断，也让搜索与问答引擎更容易理解这个站点的完整能力图谱。"
          surfaceKey="knowledge_page_evidence"
          toolItems={toolItems}
          caseItems={caseItems}
          insightItems={insightItems}
        />

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
              <p className="mt-3 text-sm text-[color:var(--muted)]">{hub.entryCount} 篇</p>
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
                  </div>
                ))}
              </div>
            </ContentCardLink>
          )) : (
            <div className="soft-card rounded-[1.75rem] p-6 text-sm text-[color:var(--muted)] md:col-span-2">
              暂无专题
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
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">专题</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">专题地图</h2>
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
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">案例</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例库</h2>
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
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">洞察</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">洞察中心</h2>
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
            title="个人分析"
            description="看完方法和案例后，直接进入正式分析，把抽象方法落回你自己的节奏、环境和行动问题。"
          />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="knowledge_page"
            title="订阅更新"
            description="接收知识文章、专题扩写和方法更新，方便你持续跟进这套判断系统的公开内容。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
