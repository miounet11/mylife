import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getEntityInsightByTypeAndSlug,
  getEntityInsightsByType,
} from '@/lib/content-store';
import { entityTypeLabels, type EntityInsightType } from '@/lib/content';
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { type, slug } = await params;
  const insight = getEntityInsightByTypeAndSlug(type, slug);
  if (!insight) {
    return { title: '洞察未找到 | 人生K线' };
  }

  return createPublicContentMetadata({
    title: insight.seoTitle,
    description: insight.seoDescription,
    path: `/insights/${insight.type}/${insight.slug}`,
    type: 'article',
  });
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { type, slug } = await params;
  const insight = getEntityInsightByTypeAndSlug(type, slug);
  if (!insight) notFound();

  const related = getEntityInsightsByType(insight.type as EntityInsightType)
    .filter((item) => item.slug !== insight.slug)
    .slice(0, 2);
  const otherTypes = (['industry', 'city', 'company'] as EntityInsightType[])
    .filter((item) => item !== insight.type)
    .map((item) => getEntityInsightsByType(item).find((entry) => entry.tags.some((tag) => insight.tags.includes(tag))))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 2);
  const breadcrumbItems = [
    { name: '首页', path: '/' },
    { name: '洞察中心', path: '/insights' },
    { name: entityTypeLabels[insight.type], path: '/insights' },
    { name: insight.title, path: `/insights/${insight.type}/${insight.slug}` },
  ];
  const schemas = [
    createArticleSchema({
      headline: insight.seoTitle,
      description: insight.seoDescription,
      path: `/insights/${insight.type}/${insight.slug}`,
      articleSection: entityTypeLabels[insight.type],
      keywords: insight.tags,
    }),
    createBreadcrumbSchema(breadcrumbItems),
  ];

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="insight_article_viewed"
        page={`/insights/${insight.type}/${insight.slug}`}
        meta={{
          surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
          contentType: 'insight',
          subtype: insight.type,
          slug: insight.slug,
          title: insight.title,
          name: insight.name,
          category: entityTypeLabels[insight.type],
          tags: insight.tags,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.98fr_0.72fr]">
          <article className="glass-panel rounded-[2rem] p-6 md:p-8">
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
                <Link href="/insights" className="action-secondary inline-flex">
                  <ArrowLeft className="h-4 w-4" />
                  返回洞察中心
                </Link>
              )}
              label={(
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {entityTypeLabels[insight.type]}
                </>
              )}
              title={insight.title}
              meta={<>{insight.name}</>}
              excerpt={insight.excerpt}
              hint="先看当前洞察结论，再回到分析页验证你自己的结构与窗口。"
              actions={[
                <Link key="analyze" href="/analyze" className="action-primary action-main">开始分析</Link>,
                <Link key="insights" href="/insights" className="action-secondary">返回洞察中心</Link>,
              ]}
            />

            <div className="mt-8 space-y-8">
              {insight.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-bold text-[color:var(--ink)]">{section.title}</h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.title}-${index}`} className="text-sm leading-6 text-[color:var(--ink)]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {otherTypes.length > 0 ? (
              <section className="mt-10 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">跨实体继续追踪</div>
                <p className="intro-copy mt-3">同一个主题通常会同时出现在城市、行业和组织层。</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {otherTypes.map((entry) => (
                    <ContentCardLink
                      key={`${entry.type}-${entry.slug}`}
                      href={`/insights/${entry.type}/${entry.slug}`}
                      page={`/insights/${insight.type}/${insight.slug}`}
                      meta={{
                        surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                        targetSurfaceKey: `insight_article:${entry.type}:${entry.slug}`,
                        contentType: 'insight',
                        subtype: entry.type,
                        slug: entry.slug,
                        title: entry.title,
                        name: entry.name,
                        category: entityTypeLabels[entry.type],
                        tags: entry.tags,
                      }}
                      className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{entry.title}</div>
                      <div className="intro-copy mt-2">{entry.excerpt}</div>
                    </ContentCardLink>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <div className="space-y-5">
            <ContentQuickAnalyzePanel
              sourceLabel="洞察页快速分析"
              sourceKey={`insight_article:${insight.type}:${insight.slug}`}
              contentMeta={{
                contentType: 'insight',
                subtype: insight.type,
                surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                slug: insight.slug,
                title: insight.title,
                name: insight.name,
                category: entityTypeLabels[insight.type],
                tags: insight.tags,
              }}
              title="群体洞察看完，直接看你自己的时间点"
              description="把生日带入分析页，直接看个人结构和当前窗口。"
            />

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">世界易环境路径</div>
              <p className="intro-copy mt-3">从单篇洞察回到世界易环境方法，理解判断成本为什么会变化。</p>
              <div className="mt-4 space-y-4">
                <ContentCardLink
                  href="/knowledge/world-yi-environment-method"
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'knowledge_article:world-yi-environment-method',
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">世界易的环境方法</div>
                  <div className="intro-copy mt-2">环境不是背景，而是和结构、阶段并列的判断层。</div>
                </ContentCardLink>
                <ContentCardLink
                  href="/knowledge/world-yi-judgment-crisis"
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'knowledge_article:world-yi-judgment-crisis',
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">AI 时代的判断危机</div>
                  <div className="intro-copy mt-2">答案越多，人越需要更高位的环境和阶段排序能力。</div>
                </ContentCardLink>
                <ContentCardLink
                  href="/world-yi"
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'world_yi_page',
                    contentType: 'insight',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">回到世界易总入口</div>
                  <div className="intro-copy mt-2">从单篇洞察回到主书、方法、案例和全球传播层。</div>
                </ContentCardLink>
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">继续阅读</div>
              <div className="mt-4 space-y-4">
                {related.length > 0 ? (
                  related.map((item) => (
                    <ContentCardLink
                      key={item.slug}
                      href={`/insights/${item.type}/${item.slug}`}
                      page={`/insights/${insight.type}/${insight.slug}`}
                      meta={{
                        surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                        targetSurfaceKey: `insight_article:${item.type}:${item.slug}`,
                        contentType: 'insight',
                        subtype: item.type,
                        slug: item.slug,
                        title: item.title,
                        name: item.name,
                        category: entityTypeLabels[item.type],
                        tags: item.tags,
                      }}
                      className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="intro-copy mt-2">{item.excerpt}</div>
                    </ContentCardLink>
                  ))
                ) : (
                  <p className="intro-copy">当前类型仍在扩充，后续会加入更多同主题实体页面。</p>
                )}
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">这类页面的作用</div>
              <div className="mt-4 space-y-3 text-xs leading-6 text-[color:var(--ink)]">
                <p>承接具体搜索意图，而不是只依赖工具页流量。</p>
                <p>把结果页里的职业、城市、组织话题延伸成长期内容。</p>
                <p>让首页、结果页、案例页和知识页形成更强的内链网络。</p>
              </div>
            </div>

            <NewsletterSignup
              source={`insight_article:${insight.type}:${insight.slug}`}
              title="订阅实体洞察更新"
              description="新增更多行业、城市和组织节奏内容时直接发送到邮箱。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
