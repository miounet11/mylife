import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, LibraryBig, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import { getCaseStudies, getEntityInsights } from '@/lib/content-store';
import {
  getKnowledgeTopicHubByTopicSlug,
  listKnowledgeTopicHubRoutes,
} from '@/lib/knowledge-network-feed';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getToolDefinition } from '@/lib/tools';

interface PageProps {
  params: Promise<{ topicSlug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return listKnowledgeTopicHubRoutes().map((item) => ({
    topicSlug: item.topicSlug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { topicSlug } = await params;
  const hub = getKnowledgeTopicHubByTopicSlug(topicSlug);

  if (!hub) {
    return {
      title: '专题未找到 | 人生K线',
    };
  }

  return createPublicContentMetadata({
    title: `${hub.topicName}专题地图 | 人生K线`,
    description: `围绕${hub.topicName}自动聚合的专题地图，包含${hub.entryCount}篇可互链知识内容与相邻主题线索。`,
    path: `/knowledge/topics/${hub.topicSlug}`,
    type: 'website',
  });
}

export default async function KnowledgeTopicPage({ params }: PageProps) {
  const { topicSlug } = await params;
  const hub = getKnowledgeTopicHubByTopicSlug(topicSlug);
  if (!hub) notFound();

  const breadcrumbItems = [
    { name: '首页', path: '/' },
    { name: '知识库', path: '/knowledge' },
    { name: '专题地图', path: '/knowledge/topics' },
    { name: `${hub.topicName}专题地图`, path: `/knowledge/topics/${hub.topicSlug}` },
  ];
  const topicSignals = [hub.topicName, ...hub.relatedTopicNames, ...hub.entries.flatMap((item) => [item.entry.title, item.entry.category || '', ...item.entry.tags])];
  const matchesTopicSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return topicSignals.some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const toolItems = hub.entries
    .flatMap((item) => (Array.isArray(item.entry.meta?.relatedToolSlugs) ? item.entry.meta.relatedToolSlugs : []))
    .filter((slug): slug is string => typeof slug === 'string')
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesTopicSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesTopicSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
  const schemas = [
    createCollectionPageSchema({
      headline: `${hub.topicName}专题地图`,
      description: `围绕${hub.topicName}自动聚合的专题地图，包含${hub.entryCount}篇可互链知识内容。`,
      path: `/knowledge/topics/${hub.topicSlug}`,
      keywords: [hub.topicName, ...hub.relatedTopicNames.slice(0, 4)],
    }),
    createBreadcrumbSchema(breadcrumbItems),
  ];

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_article_viewed"
        page={`/knowledge/topics/${hub.topicSlug}`}
        meta={{
          surfaceKey: `knowledge_topic:${hub.topicSlug}`,
          contentType: 'knowledge',
          topicName: hub.topicName,
          entryCount: hub.entryCount,
          synthesisTypes: hub.synthesisTypes,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_0.7fr]">
          <article className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <PublicArticleHero
              breadcrumbs={(
                <ContentBreadcrumbs
                  items={breadcrumbItems.map((item, index) => ({
                    label: item.name,
                    href: index === breadcrumbItems.length - 1 ? undefined : item.path,
                  }))}
                />
              )}
              backLink={(
                <Link href="/knowledge/topics" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] inline-flex">
                  <ArrowLeft className="h-4 w-4" />
                  返回专题地图
                </Link>
              )}
              label={(
                <>
                  <Network className="h-3.5 w-3.5" />
                  自动专题网络
                </>
              )}
              title={`${hub.topicName}专题地图`}
              excerpt={`这一专题当前已经形成 ${hub.entryCount} 篇可互链内容，覆盖 ${hub.synthesisTypes.join('、')} 等层次。它适合作为一个稳定的搜索入口，也适合作为后续持续扩写的主干主题。`}
              hint="先读本专题第一篇，再回到分析页做个人验证，效率最高。"
              actions={[
                <Link key="analyze" href="/analyze" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">开始分析</Link>,
                <Link key="topics" href="/knowledge/topics" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">返回专题地图</Link>,
              ]}
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">内容层次</div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{hub.synthesisTypes.join('、')}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">相邻主题</div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                  {hub.relatedTopicNames.length ? hub.relatedTopicNames.join('、') : '当前仍在继续扩写中'}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {hub.entries.map((item, index) => (
                <section key={item.entry.slug} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                    路径 {index + 1} · {item.synthesisType || item.entry.category || '知识内容'}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.entry.title}</h2>
                  <ContentCardLink
                    href={`/knowledge/${item.entry.slug}`}
                    page={`/knowledge/topics/${hub.topicSlug}`}
                    meta={{
                      surfaceKey: `knowledge_topic:${hub.topicSlug}`,
                      targetSurfaceKey: `knowledge_article:${item.entry.slug}`,
                      contentType: 'knowledge',
                      topicName: hub.topicName,
                      title: item.entry.title,
                      synthesisType: item.synthesisType,
                    }}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-4"
                  >
                    阅读这篇内容
                    <ArrowRight className="h-4 w-4" />
                  </ContentCardLink>
                </section>
              ))}
            </div>
          </article>

          <div className="space-y-5">
            <ContentQuickAnalyzePanel
              sourceLabel="专题页转化"
              sourceKey={`knowledge_topic:${hub.topicSlug}`}
              contentMeta={{
                contentType: 'knowledge',
                surfaceKey: `knowledge_topic:${hub.topicSlug}`,
                topicName: hub.topicName,
                entryCount: hub.entryCount,
              }}
              title="顺着专题看懂后，直接回到自己的判断结果"
              description="当你已经知道自己最关心哪条问题线，就把出生信息带进正式分析，看看个人结构和这个专题怎么对应。"
            />

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">继续扩展的相邻专题</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {hub.relatedTopicNames.length ? hub.relatedTopicNames.map((item) => (
                  <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {item}
                  </span>
                )) : (
                  <span className="text-sm text-[color:var(--muted)]">暂无相邻专题</span>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4" />
                专题相关工具
              </div>
              <div className="mt-4 grid gap-3">
                {toolItems.length > 0 ? toolItems.map((tool) => (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page={`/knowledge/topics/${hub.topicSlug}`}
                    className="block rounded-[1.25rem] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.themeLabel}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{tool.shortTitle}</div>
                  </ToolCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应工具</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <LibraryBig className="h-4 w-4" />
                专题相关案例
              </div>
              <div className="mt-4 grid gap-3">
                {caseItems.length > 0 ? caseItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/cases/${item.slug}`}
                    page={`/knowledge/topics/${hub.topicSlug}`}
                    meta={{ surfaceKey: `knowledge_topic:${hub.topicSlug}`, targetSurfaceKey: `case_article:${item.slug}`, contentType: 'case' }}
                    className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应案例</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Sparkles className="h-4 w-4" />
                专题相关洞察
              </div>
              <div className="mt-4 grid gap-3">
                {insightItems.length > 0 ? insightItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/insights/${item.type}/${item.slug}`}
                    page={`/knowledge/topics/${hub.topicSlug}`}
                    meta={{ surfaceKey: `knowledge_topic:${hub.topicSlug}`, targetSurfaceKey: `insight_article:${item.slug}`, contentType: 'insight' }}
                    className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应洞察</div>
                )}
              </div>
            </div>

            <NewsletterSignup
              source={`knowledge_topic:${hub.topicSlug}`}
              title="订阅专题更新"
              description="持续接收这个专题的新增文章和关联扩写，方便你沿着同一条问题线继续深入。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
