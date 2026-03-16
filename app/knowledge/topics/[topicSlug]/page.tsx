import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getKnowledgeTopicHubByTopicSlug,
  listKnowledgeTopicHubRoutes,
} from '@/lib/knowledge-network-feed';

interface PageProps {
  params: Promise<{ topicSlug: string }>;
}

export const dynamic = 'force-dynamic';

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

  return {
    title: `${hub.topicName}专题地图 | 人生K线`,
    description: `围绕${hub.topicName}自动聚合的专题地图，包含${hub.entryCount}篇可互链知识内容与相邻主题线索。`,
  };
}

export default async function KnowledgeTopicPage({ params }: PageProps) {
  const { topicSlug } = await params;
  const hub = getKnowledgeTopicHubByTopicSlug(topicSlug);
  if (!hub) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    headline: `${hub.topicName}专题地图`,
    description: `围绕${hub.topicName}自动聚合的专题地图，包含${hub.entryCount}篇可互链知识内容。`,
    mainEntityOfPage: `https://www.life-kline.com/knowledge/topics/${hub.topicSlug}`,
    url: `https://www.life-kline.com/knowledge/topics/${hub.topicSlug}`,
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_0.7fr]">
          <article className="glass-panel rounded-[2rem] p-6 md:p-8">
            <Link href="/knowledge/topics" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
              <ArrowLeft className="h-4 w-4" />
              返回专题地图
            </Link>

            <div className="mt-6 section-label">
              <Network className="h-3.5 w-3.5" />
              自动专题网络
            </div>

            <h1 className="mt-5 text-4xl font-black text-[color:var(--ink)] md:text-5xl">{hub.topicName}专题地图</h1>
            <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">
              这一专题当前已经形成 {hub.entryCount} 篇可互链内容，覆盖 {hub.synthesisTypes.join('、')} 等层次。它适合作为一个稳定的搜索入口，也适合作为后续持续扩写的主干主题。
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="soft-card rounded-[1.5rem] p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">内容层次</div>
                <div className="mt-3 text-base leading-7 text-[color:var(--ink)]">{hub.synthesisTypes.join('、')}</div>
              </div>
              <div className="soft-card rounded-[1.5rem] p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">相邻主题</div>
                <div className="mt-3 text-base leading-7 text-[color:var(--ink)]">
                  {hub.relatedTopicNames.length ? hub.relatedTopicNames.join('、') : '当前仍在继续扩写中'}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {hub.entries.map((item, index) => (
                <section key={item.entry.slug} className="soft-card rounded-[1.5rem] p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                    路径 {index + 1} · {item.synthesisType || item.entry.category || '知识内容'}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.entry.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.entry.excerpt}</p>
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
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]"
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
              title="顺着专题看懂后，直接回到自己的命盘"
              description="专题页负责建立认知框架，真正有价值的下一步仍然是回到你的出生信息，验证这些结构和节奏如何落到个人身上。"
            />

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">继续扩展的相邻专题</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {hub.relatedTopicNames.length ? hub.relatedTopicNames.map((item) => (
                  <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {item}
                  </span>
                )) : (
                  <span className="text-sm leading-7 text-[color:var(--muted)]">当前专题已成型，系统会继续补充可桥接的相邻主题。</span>
                )}
              </div>
            </div>

            <NewsletterSignup
              source={`knowledge_topic:${hub.topicSlug}`}
              title="订阅专题更新"
              description="当这个专题新增总览、词汇表、问题地图和书单路径时，第一时间收到更新。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
