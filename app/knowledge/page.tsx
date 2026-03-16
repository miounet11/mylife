import { ArrowRight, BookOpen, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';

export const metadata = {
  title: '命理知识库 | 人生K线',
  description: '围绕真太阳时、命盘结构、结果阅读和决策应用建立长期可积累的知识内容。',
};

export const dynamic = 'force-dynamic';

export default function KnowledgePage() {
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

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="knowledge_page_viewed" page="/knowledge" meta={{ surfaceKey: 'knowledge_page', contentType: 'knowledge' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              长期内容资产
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              知识库不是附属页，
              <span className="font-serif text-[color:var(--accent-strong)]">而是站点长期价值的一部分。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里专门解释真太阳时、报告阅读、命理辅助决策等高价值主题。它既服务真实用户，也承担 SEO 与品牌可信度建设。
            </p>
            <ContentCardLink
              href="/knowledge/topics"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]"
            >
              查看专题地图
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {['真太阳时与排盘精度', '普通用户如何读报告', '职业与关系场景应用', '公开结果页与内容增长策略'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
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
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                已形成 {hub.entryCount} 篇可互链内容，涵盖 {hub.synthesisTypes.join('、')} 等层次，适合作为持续扩写的专题入口。
              </p>
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
                    <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.entry.excerpt}</div>
                  </div>
                ))}
              </div>
            </ContentCardLink>
          )) : (
            <div className="soft-card rounded-[1.75rem] p-6 text-sm leading-7 text-[color:var(--muted)] md:col-span-2">
              当前公开专题页仍在整理中，先保留高质量基础文章对外展示。后续只有通过质量门槛的专题内容才会进入公开知识网络。
            </div>
          )}
        </section>

        <section className="mt-10 space-y-5">
          <div className="flex flex-wrap gap-3">
            {groupedKnowledgeEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
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
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{group.groupDescription}</p>
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
                        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{article.excerpt}</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
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

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="知识内容转化"
            sourceKey="knowledge_page"
            contentMeta={{ contentType: 'knowledge', surfaceKey: 'knowledge_page' }}
            title="读到这里，直接把生日带入个人测算"
            description="知识页负责让用户看懂原理，真正的转化要发生在用户产生兴趣的当下。先填生日和时间，下一步补出生地即可开始完整分析。"
          />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source="knowledge_page"
            title="订阅命理知识与站点更新"
            description="适合希望长期追踪命理内容、公开案例与产品迭代的人。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
