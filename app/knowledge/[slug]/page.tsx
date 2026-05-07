import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock3, Compass, LibraryBig, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentConversionPanel from '@/components/content-conversion-panel';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import ContentVisualAssetPanel from '@/components/content-visual-asset-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicSearchIntentPanel from '@/components/public-search-intent-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolCardLink from '@/components/tool-card-link';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import { appendSourceToHref, buildSourceCtaStrategy, buildSourceJourneyCopy } from '@/lib/source-context';
import {
  getCaseStudies,
  getEntityInsights,
  getKnowledgeArticleBySlug,
  getManagedContentEntryBySlug,
  getManagedContentGeoOptimizationMeta,
  getManagedContentJourneyMeta,
  isPublicKnowledgeEntry,
  listPublishedManagedContentEntriesByType,
} from '@/lib/content-store';
import { listFeaturedKnowledgeEditorialEntries } from '@/lib/knowledge-editorial';
import { getKnowledgeTopicHubBySlug, getRelatedKnowledgeEntries } from '@/lib/knowledge-network-feed';
import { buildJourneyForContent } from '@/lib/surface-journeys';
import { getToolDefinition } from '@/lib/tools';
import { getVisualAssetsForContentEntry } from '@/lib/visual-asset-library';
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeArticleBySlug(slug);
  const managedEntry = getManagedContentEntryBySlug('knowledge', slug);
  if (!article) {
    return {
      title: '文章未找到 | 人生K线',
    };
  }
  const visualAssets = managedEntry ? getVisualAssetsForContentEntry(managedEntry, 1) : [];
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);

  return createPublicContentMetadata({
    title: article.seoTitle,
    description: article.seoDescription,
    path: `/knowledge/${article.slug}`,
    type: 'article',
    locale: typeof managedEntry?.meta?.locale === 'string' ? managedEntry.meta.locale : undefined,
    keywords: article.tags,
    images: visualAssets.map((asset) => ({
      url: asset.publicUrl,
      alt: asset.altText,
      width: asset.ratio === '4:5' ? 1280 : 2048,
      height: asset.ratio === '4:5' ? 1600 : 1152,
    })),
    publishedTime: managedEntry?.createdAt,
    modifiedTime: managedEntry?.updatedAt,
    section: article.category,
    tags: article.tags,
    answerSummary: geoMeta?.answerSummary || article.excerpt,
    searchIntents: geoMeta?.searchIntents,
    entityKeywords: geoMeta?.entityKeywords,
  });
}

export async function generateStaticParams() {
  return listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry))
    .map((entry) => ({
      slug: entry.slug,
    }));
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeArticleBySlug(slug);
  const managedEntry = getManagedContentEntryBySlug('knowledge', slug);
  if (!article || !managedEntry || !isPublicKnowledgeEntry(managedEntry)) notFound();
  const locale = typeof managedEntry.meta?.locale === 'string' ? managedEntry.meta.locale : '';
  const market = typeof managedEntry.meta?.market === 'string' ? managedEntry.meta.market : '';

  const topicHub = getKnowledgeTopicHubBySlug(article.slug);
  const related = getRelatedKnowledgeEntries(article.slug, 4);
  const isWorldYiArticle = article.slug.startsWith('world-yi-');
  const isWorldYiEnglishArticle = isWorldYiArticle && locale === 'en';
  const worldYiReadingOrder = [
    ...(isWorldYiEnglishArticle ? [
      'world-yi-en-introduction',
      'world-yi-en-judgment-language',
      'world-yi-en-global-life',
      'world-yi-en-wealth-pattern',
      'world-yi-en-relationship-environment',
    ] : [
      'world-yi-v1-manifesto',
      'world-yi-era-cognition',
      'world-yi-judgment-crisis',
      'world-yi-attraction-model',
      'world-yi-five-foundations',
      'world-yi-methodology',
      'world-yi-decision-language',
      'world-yi-life-domains',
      'world-yi-wealth-rhythm',
      'world-yi-relationship-order',
      'world-yi-relationship-conflict-repair',
      'world-yi-partner-selection',
      'world-yi-family-generational-order',
      'world-yi-health-recovery-order',
      'world-yi-migration-stage-logic',
      'world-yi-home-recovery-system',
      'world-yi-daily-application-discipline',
      'world-yi-product-language',
      'world-yi-version-governance',
      'world-yi-home-order',
      'world-yi-timing-selection',
      'world-yi-version-faq',
    ]),
  ];
  const worldYiSeriesEntries = isWorldYiArticle
    ? worldYiReadingOrder
        .map((entrySlug) => getManagedContentEntryBySlug('knowledge', entrySlug))
        .filter((entry): entry is NonNullable<typeof entry> => !!entry && isPublicKnowledgeEntry(entry))
        .filter((entry) => entry.slug !== article.slug)
        .slice(0, 6)
    : [];
  const fallbackWorldYiEntries = !isWorldYiArticle
    ? listPublishedManagedContentEntriesByType('knowledge')
        .filter((entry) => isPublicKnowledgeEntry(entry) && entry.slug.startsWith('world-yi-') && !entry.slug.startsWith('world-yi-en-'))
        .slice(0, 4)
    : [];
  const fallbackRelated = related.length === 0
    ? listFeaturedKnowledgeEditorialEntries(4)
      .map((item) => item.entry)
      .filter((item) => item.slug !== article.slug)
      .slice(0, 3)
    : [];
  const breadcrumbItems = [
    { name: '首页', path: '/' },
    { name: '知识库', path: '/knowledge' },
    ...(topicHub ? [{ name: `${topicHub.topicName}专题地图`, path: `/knowledge/topics/${topicHub.topicSlug}` }] : []),
    { name: article.title, path: `/knowledge/${article.slug}` },
  ];
  const visualAssets = getVisualAssetsForContentEntry(managedEntry, 3);
  const primaryVisualAsset = visualAssets[0] || null;
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);
  const schemas = [
    createArticleSchema({
      headline: article.seoTitle,
      description: article.seoDescription,
      path: `/knowledge/${article.slug}`,
      articleSection: article.category,
      keywords: [...article.tags, ...(geoMeta?.entityKeywords || [])],
      image: primaryVisualAsset ? [{
        url: primaryVisualAsset.publicUrl,
        alt: primaryVisualAsset.altText,
        width: primaryVisualAsset.ratio === '4:5' ? 1280 : 2048,
        height: primaryVisualAsset.ratio === '4:5' ? 1600 : 1152,
      }] : undefined,
      datePublished: managedEntry.createdAt,
      dateModified: managedEntry.updatedAt,
      inLanguage: locale || 'zh-CN',
      abstract: geoMeta?.answerSummary || article.excerpt,
      about: geoMeta?.entityKeywords || article.tags,
      mentions: geoMeta?.searchIntents,
      audience: geoMeta?.audience,
      mainEntityName: geoMeta?.canonicalTopic || article.title,
    }),
    createBreadcrumbSchema(breadcrumbItems),
  ];
  const journey = buildJourneyForContent({
    title: article.title,
    excerpt: article.excerpt,
    tags: article.tags,
    category: article.category,
    contentType: 'knowledge',
    slug: article.slug,
  }, {
    source: `knowledge_article:${article.slug}`,
  });
  const pageSource = `knowledge_article:${article.slug}`;
  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);
  const journeyCopy = buildSourceJourneyCopy(pageSource, {
    title: '相关入口',
    description: '把这篇文章接回专题、工具和后续动作入口，帮助你从理解方法继续走向个人判断。',
  });
  const journeyMeta = getManagedContentJourneyMeta(managedEntry);
  const pageSignals = [article.title, article.excerpt, article.category, ...article.tags, ...(topicHub ? [topicHub.topicName, ...topicHub.relatedTopicNames] : [])];
  const matchesPageSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return pageSignals.some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const toolItems = journeyMeta.relatedToolSlugs
    .map((toolSlug) => getToolDefinition(toolSlug))
    .filter((tool): tool is NonNullable<typeof tool> => !!tool)
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesPageSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesPageSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
  const primaryTool = toolItems[0] || null;
  const primaryCase = caseItems[0] || null;
  const queryIntent = article.tags[0] || article.category || article.title;

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_article_viewed"
        page={`/knowledge/${article.slug}`}
        meta={{
          surfaceKey: `knowledge_article:${article.slug}`,
          contentType: 'knowledge',
          slug: article.slug,
          title: article.title,
          category: article.category,
          tags: article.tags,
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
                <Link href="/knowledge" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] inline-flex">
                  <ArrowLeft className="h-4 w-4" />
                  返回知识库
                </Link>
              )}
              label={(
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {article.category}
                </>
              )}
              title={article.title}
              meta={(
                <>
                  <Clock3 className="h-4 w-4" />
                  {article.readTime}
                  {(locale || market) ? <ContentLocaleBadge locale={locale} market={market} /> : null}
                  {market ? <span>{market}</span> : null}
                </>
              )}
              excerpt={article.excerpt}
              hint="建议先读完本页摘要，再开始个人分析，避免信息跳转过早。"
              actionLabel={sourceCtaStrategy.actionGuide}
              actions={[
                <Link key="analyze" href={appendSourceToHref('/analyze', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">{sourceCtaStrategy.searchAnalyzeLabel}</Link>,
                <Link key="knowledge" href={appendSourceToHref('/knowledge', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">返回知识库</Link>,
                ...(topicHub ? [<Link key="topic" href={appendSourceToHref(`/knowledge/topics/${topicHub.topicSlug}`, pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">查看专题地图</Link>] : []),
              ]}
            />

            <div className="mt-8">
              <PublicSearchIntentPanel
                page={`/knowledge/${article.slug}`}
                title={article.title}
                queryIntent={queryIntent}
                toolHref={primaryTool ? `/tools/${primaryTool.slug}` : undefined}
                caseHref={primaryCase ? `/cases/${primaryCase.slug}` : undefined}
                source={pageSource}
                analyzeLabel={sourceCtaStrategy.searchAnalyzeLabel}
                toolLabel={sourceCtaStrategy.searchToolLabel}
                caseLabel={sourceCtaStrategy.searchCaseLabel}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
            </div>

            <div className="mt-8 space-y-8">
              {article.sections.map((section) => (
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

            <ProductSurfaceRolePanel
              surface="knowledgeArticle"
              className="mt-10"
              title="文章读完后要知道下一步验证什么"
              description="知识详情页的目标不是让用户停在解释层，而是把一个概念接到个人测算、专题、工具和案例路径。"
              compact
            />

            <ContentVisualAssetPanel
              assets={visualAssets}
              page={`/knowledge/${article.slug}`}
              source={pageSource}
              contentLabel="知识文章"
              contentTitle={article.title}
              className="mt-10"
            />

            {topicHub ? (
              <section className="mt-10 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">所属专题路径</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{topicHub.topicName}专题地图</h2>
                <p className="text-sm leading-7 text-[color:var(--ink-4)] mt-3">这篇文章已进入稳定专题节点，可直接回专题继续扩展。</p>
                <ContentCardLink
                  href={`/knowledge/topics/${topicHub.topicSlug}`}
                  source={pageSource}
                  page={`/knowledge/${article.slug}`}
                  meta={{
                    surfaceKey: `knowledge_article:${article.slug}`,
                    targetSurfaceKey: `knowledge_topic:${topicHub.topicSlug}`,
                    contentType: 'knowledge',
                    topicName: topicHub.topicName,
                  }}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-4"
                >
                  返回专题地图
                </ContentCardLink>
              </section>
            ) : null}

            <section className="mt-10">
              <SurfaceJourneyPanel
                journey={journey}
                title={journeyCopy.title}
                description={journeyCopy.description}
                badge="知识文章来源 · 已保留"
              />
            </section>
          </article>

          <div className="space-y-5">
            <ContentQuickAnalyzePanel
              sourceLabel="文章页快速分析"
              sourceKey={`knowledge_article:${article.slug}`}
              contentMeta={{
                contentType: 'knowledge',
                surfaceKey: `knowledge_article:${article.slug}`,
                slug: article.slug,
                title: article.title,
                category: article.category,
                tags: article.tags,
              }}
              title="看懂原理之后，直接测自己的生日"
              description="把出生日期、时间和性别先带进分析入口，看看这套方法落到你自己身上时，重点到底在哪里。"
            />

            {primaryTool ? (
              <>
                <ContentConversionPanel
                  tool={primaryTool}
                  page={`/knowledge/${article.slug}`}
                  contentLabel="文章"
                  contentTitle={article.title}
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                />
                <ToolPremiumRequestPanel tool={primaryTool} page={`/knowledge/${article.slug}`} />
              </>
            ) : null}

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4" />
                相关工具
              </div>
              <div className="mt-4 grid gap-3">
                {toolItems.length > 0 ? toolItems.map((tool) => (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page={`/knowledge/${article.slug}`}
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

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <LibraryBig className="h-4 w-4" />
                相关案例
              </div>
              <div className="mt-4 grid gap-3">
                {caseItems.length > 0 ? caseItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/cases/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/knowledge/${article.slug}`}
                    meta={{ surfaceKey: `knowledge_article:${article.slug}`, targetSurfaceKey: `case_article:${item.slug}`, contentType: 'case' }}
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
                相关洞察
              </div>
              <div className="mt-4 grid gap-3">
                {insightItems.length > 0 ? insightItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/insights/${item.type}/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/knowledge/${article.slug}`}
                    meta={{ surfaceKey: `knowledge_article:${article.slug}`, targetSurfaceKey: `insight_article:${item.slug}`, contentType: 'insight' }}
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

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              {isWorldYiArticle ? (
                <>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">
                    {isWorldYiEnglishArticle ? 'World Yi Reading Path' : '世界易阅读路径'}
                  </div>
                  <Link href={appendSourceToHref(isWorldYiEnglishArticle ? '/world-yi/en' : '/world-yi', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-3 inline-flex">
                    {isWorldYiEnglishArticle ? 'Back to World Yi English Gateway' : '先回世界易总入口'}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                  <div className="mt-4 space-y-4">
                    {worldYiSeriesEntries.map((item) => (
                      <ContentCardLink
                        key={item.slug}
                        href={`/knowledge/${item.slug}`}
                        source={pageSource}
                        ctaStrategyKey={sourceCtaStrategy.strategyKey}
                        sourceFamily={sourceCtaStrategy.sourceFamily}
                        page={`/knowledge/${article.slug}`}
                        meta={{
                          surfaceKey: `world_yi_series:${article.slug}`,
                          targetSurfaceKey: `knowledge_article:${item.slug}`,
                          contentType: 'knowledge',
                          slug: item.slug,
                          title: item.title,
                          category: item.category,
                          tags: item.tags,
                          series: 'world-yi',
                        }}
                        className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                      >
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <div className="text-sm leading-7 text-[color:var(--ink-4)] mt-2">{item.excerpt}</div>
                      </ContentCardLink>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">世界易入口</div>
                  <Link href={appendSourceToHref('/world-yi', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-4 inline-flex">
                    进入世界易总入口
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                  {fallbackWorldYiEntries.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {fallbackWorldYiEntries.map((item) => (
                        <ContentCardLink
                          key={item.slug}
                          href={`/knowledge/${item.slug}`}
                          source={pageSource}
                          ctaStrategyKey={sourceCtaStrategy.strategyKey}
                          sourceFamily={sourceCtaStrategy.sourceFamily}
                          page={`/knowledge/${article.slug}`}
                          meta={{
                            surfaceKey: `knowledge_article:${article.slug}`,
                            targetSurfaceKey: `knowledge_article:${item.slug}`,
                            contentType: 'knowledge',
                            slug: item.slug,
                            title: item.title,
                            category: item.category,
                            tags: item.tags,
                            series: 'world-yi',
                        }}
                        className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                      >
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      </ContentCardLink>
                    ))}
                  </div>
                ) : null}
                </>
              )}
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">
                {topicHub ? `同专题继续阅读：${topicHub.topicName}` : '相关文章'}
              </div>
              {topicHub?.relatedTopicNames.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topicHub.relatedTopicNames.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <ContentCardLink
                    key={item.entry.slug}
                    href={`/knowledge/${item.entry.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/knowledge/${article.slug}`}
                    meta={{
                      surfaceKey: `knowledge_article:${article.slug}`,
                      targetSurfaceKey: `knowledge_article:${item.entry.slug}`,
                      contentType: 'knowledge',
                      slug: item.entry.slug,
                      title: item.entry.title,
                      category: item.entry.category,
                      tags: item.entry.tags,
                      topicName: item.topicName,
                      synthesisType: item.synthesisType,
                    }}
                    className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                  >
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.entry.title}</div>
                  </ContentCardLink>
                ))}
                {fallbackRelated.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/knowledge/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/knowledge/${article.slug}`}
                    meta={{
                      surfaceKey: `knowledge_article:${article.slug}`,
                      targetSurfaceKey: `knowledge_article:${item.slug}`,
                      contentType: 'knowledge',
                      slug: item.slug,
                      title: item.title,
                      category: item.category,
                      tags: item.tags,
                    }}
                    className="block rounded-[1.25rem] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-white"
                  >
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                ))}
              </div>
            </div>

            <NewsletterSignup
              source={`knowledge_article:${article.slug}`}
              title="订阅内容更新"
              description="接收相关文章、专题扩写和方法更新，方便你把零散阅读逐步串成完整体系。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
