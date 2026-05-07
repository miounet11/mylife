import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpenText, Compass, LibraryBig, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import ContentVisualAssetPanel from '@/components/content-visual-asset-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import {
  getCaseStudies,
  getEntityInsightByTypeAndSlug,
  getEntityInsightsByType,
  getKnowledgeArticles,
  getManagedContentEntryBySlug,
  getManagedContentGeoOptimizationMeta,
} from '@/lib/content-store';
import { appendSourceToHref, buildSourceCtaStrategy } from '@/lib/source-context';
import { entityTypeLabels, type EntityInsightType } from '@/lib/content';
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';
import { getVisualAssetsForContentEntry } from '@/lib/visual-asset-library';

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
  const managedEntry = getManagedContentEntryBySlug('insight', insight.slug);
  const visualAssets = managedEntry ? getVisualAssetsForContentEntry(managedEntry, 1) : [];
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);

  return createPublicContentMetadata({
    title: insight.seoTitle,
    description: insight.seoDescription,
    path: `/insights/${insight.type}/${insight.slug}`,
    type: 'article',
    locale: typeof managedEntry?.meta?.locale === 'string' ? managedEntry.meta.locale : undefined,
    keywords: insight.tags,
    images: visualAssets.map((asset) => ({
      url: asset.publicUrl,
      alt: asset.altText,
      width: asset.ratio === '4:5' ? 1280 : 2048,
      height: asset.ratio === '4:5' ? 1600 : 1152,
    })),
    publishedTime: managedEntry?.createdAt,
    modifiedTime: managedEntry?.updatedAt,
    section: entityTypeLabels[insight.type],
    tags: insight.tags,
    answerSummary: geoMeta?.answerSummary || insight.excerpt,
    searchIntents: geoMeta?.searchIntents,
    entityKeywords: geoMeta?.entityKeywords,
  });
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { type, slug } = await params;
  const insight = getEntityInsightByTypeAndSlug(type, slug);
  if (!insight) notFound();
  const managedEntry = getManagedContentEntryBySlug('insight', insight.slug);
  const locale = typeof managedEntry?.meta?.locale === 'string' ? managedEntry.meta.locale : '';
  const pageSource = `insight_article:${insight.type}:${insight.slug}`;
  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);

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
  const pageSignals = [insight.title, insight.excerpt, insight.name, ...insight.tags];
  const matchesPageSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return pageSignals.some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesPageSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesPageSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 2);
  const caseItems = getCaseStudies()
    .filter((item) => matchesPageSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const visualAssets = managedEntry ? getVisualAssetsForContentEntry(managedEntry, 3) : [];
  const primaryVisualAsset = visualAssets[0] || null;
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);
  const schemas = [
    createArticleSchema({
      headline: insight.seoTitle,
      description: insight.seoDescription,
      path: `/insights/${insight.type}/${insight.slug}`,
      articleSection: entityTypeLabels[insight.type],
      keywords: [...insight.tags, ...(geoMeta?.entityKeywords || [])],
      image: primaryVisualAsset ? [{
        url: primaryVisualAsset.publicUrl,
        alt: primaryVisualAsset.altText,
        width: primaryVisualAsset.ratio === '4:5' ? 1280 : 2048,
        height: primaryVisualAsset.ratio === '4:5' ? 1600 : 1152,
      }] : undefined,
      datePublished: managedEntry?.createdAt,
      dateModified: managedEntry?.updatedAt,
      inLanguage: locale || 'zh-CN',
      abstract: geoMeta?.answerSummary || insight.excerpt,
      about: geoMeta?.entityKeywords || insight.tags,
      mentions: geoMeta?.searchIntents,
      audience: geoMeta?.audience,
      mainEntityName: geoMeta?.canonicalTopic || insight.name || insight.title,
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
              actionLabel={sourceCtaStrategy.actionGuide}
              actions={[
                <Link key="analyze" href={appendSourceToHref('/analyze', pageSource)} className="action-primary action-main">{sourceCtaStrategy.searchAnalyzeLabel}</Link>,
                <Link key="insights" href={appendSourceToHref('/insights', pageSource)} className="action-secondary">返回洞察中心</Link>,
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

            <ContentVisualAssetPanel
              assets={visualAssets}
              page={`/insights/${insight.type}/${insight.slug}`}
              source={pageSource}
              contentLabel="洞察"
              contentTitle={insight.title}
              className="mt-10"
            />

            {otherTypes.length > 0 ? (
              <section className="mt-10 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">跨实体继续追踪</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {otherTypes.map((entry) => (
                    <ContentCardLink
                      key={`${entry.type}-${entry.slug}`}
                      href={`/insights/${entry.type}/${entry.slug}`}
                      source={pageSource}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
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
                      className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{entry.title}</div>
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
              description="先看外部环境的共性，再把个人出生信息带进去，判断你是在顺势、逆势还是该换场。"
            />

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4" />
                洞察相关工具
              </div>
              <div className="mt-4 grid gap-3">
                {toolItems.length > 0 ? toolItems.map((tool) => (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page={`/insights/${insight.type}/${insight.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
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

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <BookOpenText className="h-4 w-4" />
                洞察相关知识
              </div>
              <div className="mt-4 grid gap-3">
                {knowledgeItems.length > 0 ? knowledgeItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/knowledge/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/insights/${insight.type}/${insight.slug}`}
                    meta={{ surfaceKey: `insight_article:${insight.type}:${insight.slug}`, targetSurfaceKey: `knowledge_article:${item.slug}`, contentType: 'knowledge' }}
                    className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.category}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应知识内容</div>
                )}
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <LibraryBig className="h-4 w-4" />
                洞察相关案例
              </div>
              <div className="mt-4 grid gap-3">
                {caseItems.length > 0 ? caseItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/cases/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/insights/${insight.type}/${insight.slug}`}
                    meta={{ surfaceKey: `insight_article:${insight.type}:${insight.slug}`, targetSurfaceKey: `case_article:${item.slug}`, contentType: 'case' }}
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

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">世界易环境路径</div>
              <div className="mt-4 space-y-4">
                <ContentCardLink
                  href="/knowledge/world-yi-environment-method"
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'knowledge_article:world-yi-environment-method',
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">世界易的环境方法</div>
                </ContentCardLink>
                <ContentCardLink
                  href="/knowledge/world-yi-judgment-crisis"
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'knowledge_article:world-yi-judgment-crisis',
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">AI 时代的判断危机</div>
                </ContentCardLink>
                <ContentCardLink
                  href="/world-yi"
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/insights/${insight.type}/${insight.slug}`}
                  meta={{
                    surfaceKey: `insight_article:${insight.type}:${insight.slug}`,
                    targetSurfaceKey: 'world_yi_page',
                    contentType: 'insight',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">回到世界易总入口</div>
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
                      source={pageSource}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
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
                      className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    </ContentCardLink>
                  ))
                ) : (
                  <p className="text-sm text-[color:var(--muted)]">暂无更多同类页面</p>
                )}
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">页面类型</div>
              <div className="mt-4 space-y-3 text-xs leading-6 text-[color:var(--ink)]">
                <p>搜索承接</p>
                <p>结果延伸</p>
                <p>站内互链</p>
              </div>
            </div>

            <NewsletterSignup
              source={`insight_article:${insight.type}:${insight.slug}`}
              title="订阅实体洞察更新"
              description="跟进城市、行业和组织的后续变化，让环境判断不会停留在一次性的快照。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
