import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpenText, Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentConversionPanel from '@/components/content-conversion-panel';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import ArticleInlineCTA from '@/components/article/article-inline-cta';
import ArticleStickyCTA from '@/components/article/article-sticky-cta';
import ArticleScrollTracker from '@/components/article/article-scroll-tracker';
import { findInjectionPoint, isArticleCtaEnabled } from '@/lib/article-cta';
import ContentVisualAssetPanel from '@/components/content-visual-asset-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolCardLink from '@/components/tool-card-link';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import { appendSourceToHref, buildSourceCtaStrategy, buildSourceJourneyCopy } from '@/lib/source-context';
import {
  getCaseStudyBySlug,
  getEntityInsights,
  getKnowledgeArticles,
  getManagedContentEntryBySlug,
  getManagedContentGeoOptimizationMeta,
  getManagedContentJourneyMeta,
  listPublishedManagedContentEntriesByType,
} from '@/lib/content-store';
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

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  const managedEntry = getManagedContentEntryBySlug('case', slug);
  if (!item) {
    return { title: '案例未找到 | 人生K线' };
  }
  const visualAssets = managedEntry ? getVisualAssetsForContentEntry(managedEntry, 1) : [];
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);

  return createPublicContentMetadata({
    title: item.seoTitle,
    description: item.seoDescription,
    path: `/cases/${item.slug}`,
    type: 'article',
    locale: typeof managedEntry?.meta?.locale === 'string' ? managedEntry.meta.locale : undefined,
    keywords: item.tags,
    images: visualAssets.map((asset) => ({
      url: asset.publicUrl,
      alt: asset.altText,
      width: asset.ratio === '4:5' ? 1280 : 2048,
      height: asset.ratio === '4:5' ? 1600 : 1152,
    })),
    publishedTime: managedEntry?.createdAt,
    modifiedTime: managedEntry?.updatedAt,
    section: item.scenario,
    tags: item.tags,
    answerSummary: geoMeta?.answerSummary || item.excerpt,
    searchIntents: geoMeta?.searchIntents,
    entityKeywords: geoMeta?.entityKeywords,
  });
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  const managedEntry = getManagedContentEntryBySlug('case', slug);
  if (!item || !managedEntry) notFound();
  const locale = typeof managedEntry.meta?.locale === 'string' ? managedEntry.meta.locale : '';
  const market = typeof managedEntry.meta?.market === 'string' ? managedEntry.meta.market : '';
  const isEnglishCase = locale.startsWith('en');
  const isGlobalChineseCase = locale === 'zh-US';
  const ctaEnabled = isArticleCtaEnabled();
  const surfaceKey = `case_article:${item.slug}`;
  const inlineCtaPoint = ctaEnabled
    ? findInjectionPoint(item.sections.map((s) => ({ content: (s.paragraphs || []).join('\n') })))
    : { injectAfterIndex: -1 };
  const caseHubHref = isEnglishCase ? '/world-yi/en/cases' : isGlobalChineseCase ? '/world-yi/global/cases' : '/world-yi';
  const caseHubLabel = isEnglishCase ? 'Back to World Yi English Cases' : isGlobalChineseCase ? '进入全球案例入口' : '回到世界易总入口';
  const caseMethodHref = isEnglishCase ? '/knowledge/world-yi-en-judgment-language' : '/knowledge/world-yi-case-method';
  const caseMethodTitle = isEnglishCase ? 'World Yi Judgment Language' : '世界易的案例方法';
  const caseMethodDescription = isEnglishCase
    ? 'See how World Yi turns pattern, stage, environment, action, and risk into readable modern language.'
    : '为什么真正好的案例不是做玄感展示，而是讲结构、阶段、环境、动作与风险。';
  const methodologyHref = isEnglishCase ? '/knowledge/world-yi-en-introduction' : '/knowledge/world-yi-methodology';
  const methodologyTitle = isEnglishCase ? 'World Yi Introduction' : '世界易方法论';
  const methodologyDescription = isEnglishCase
    ? 'Return to the core World Yi sequence before reading more English-facing cases.'
    : '先看结构，再看时位，再带环境，最后回到动作和风险。';
  const relatedCases = listPublishedManagedContentEntriesByType('case')
    .filter((entry) => entry.slug !== item.slug)
    .map((entry) => {
      const entryLocale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
      const sharedTags = entry.tags.filter((tag) => item.tags.includes(tag));
      let score = sharedTags.length * 1.8;

      if (entry.category === item.scenario) {
        score += 4;
      }
      if (entryLocale === locale) {
        score += 1.5;
      }

      return { entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || right.entry.updatedAt.localeCompare(left.entry.updatedAt))
    .slice(0, 3)
    .map((entry) => entry.entry);
  const breadcrumbItems = [
    { name: '首页', path: '/' },
    { name: '案例库', path: '/cases' },
    { name: item.title, path: `/cases/${item.slug}` },
  ];
  const visualAssets = getVisualAssetsForContentEntry(managedEntry, 3);
  const primaryVisualAsset = visualAssets[0] || null;
  const geoMeta = getManagedContentGeoOptimizationMeta(managedEntry);
  const schemas = [
    createArticleSchema({
      headline: item.seoTitle,
      description: item.seoDescription,
      path: `/cases/${item.slug}`,
      articleSection: item.scenario,
      keywords: [...item.tags, ...(geoMeta?.entityKeywords || [])],
      image: primaryVisualAsset ? [{
        url: primaryVisualAsset.publicUrl,
        alt: primaryVisualAsset.altText,
        width: primaryVisualAsset.ratio === '4:5' ? 1280 : 2048,
        height: primaryVisualAsset.ratio === '4:5' ? 1600 : 1152,
      }] : undefined,
      datePublished: managedEntry.createdAt,
      dateModified: managedEntry.updatedAt,
      inLanguage: locale || 'zh-CN',
      abstract: geoMeta?.answerSummary || item.excerpt,
      about: geoMeta?.entityKeywords || item.tags,
      mentions: geoMeta?.searchIntents,
      audience: geoMeta?.audience,
      mainEntityName: geoMeta?.canonicalTopic || item.title,
    }),
    createBreadcrumbSchema(breadcrumbItems),
  ];
  const journey = buildJourneyForContent({
    title: item.title,
    excerpt: item.excerpt,
    tags: item.tags,
    category: item.scenario,
    contentType: 'case',
    slug: item.slug,
  }, {
    source: `case_article:${item.slug}`,
  });
  const pageSource = `case_article:${item.slug}`;
  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);
  const journeyCopy = buildSourceJourneyCopy(pageSource, {
    title: '相关入口',
    description: '把这篇案例接回对应的方法、工具和后续动作入口，避免只停留在围观别人的结果。',
  });
  const journeyMeta = getManagedContentJourneyMeta(managedEntry);
  const pageSignals = [item.title, item.excerpt, item.scenario, ...item.tags];
  const matchesPageSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return pageSignals.some((signal) => signal && lowered.includes(signal.toLowerCase()));
  };
  const toolItems = journeyMeta.relatedToolSlugs
    .map((toolSlug) => getToolDefinition(toolSlug))
    .filter((tool): tool is NonNullable<typeof tool> => !!tool)
    .slice(0, 3);
  const knowledgeItems = getKnowledgeArticles()
    .filter((entry) => entry.slug !== item.slug)
    .filter((entry) => matchesPageSignal([entry.title, entry.excerpt, entry.category, ...entry.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((entry) => matchesPageSignal([entry.title, entry.excerpt, entry.name, ...entry.tags].join(' ')))
    .slice(0, 2);
  const primaryTool = toolItems[0] || null;

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="case_article_viewed"
        page={`/cases/${item.slug}`}
        meta={{
          surfaceKey: `case_article:${item.slug}`,
          contentType: 'case',
          slug: item.slug,
          title: item.title,
          category: item.scenario,
          tags: item.tags,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.98fr_0.72fr]">
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
                <Link href="/cases" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] inline-flex">
                  <ArrowLeft className="h-4 w-4" />
                  返回案例库
                </Link>
              )}
              label={(
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {item.scenario}
                </>
              )}
              title={item.title}
              meta={(
                <>
                  {(locale || market) ? <ContentLocaleBadge locale={locale} market={market} /> : null}
                  {market ? <span>{market}</span> : null}
                </>
              )}
              excerpt={item.excerpt}
              hint="先看完案例关键信息，再进入分析页验证自己的结构与阶段。"
              actionLabel={sourceCtaStrategy.actionGuide}
              actions={[
                <Link key="analyze" href={appendSourceToHref('/analyze', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">{sourceCtaStrategy.searchAnalyzeLabel}</Link>,
                <Link key="cases" href={appendSourceToHref('/cases', pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">返回案例库</Link>,
                <Link key="hub" href={appendSourceToHref(caseHubHref, pageSource)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">{caseHubLabel}</Link>,
              ]}
            />

            <div className="mt-8 space-y-8">
              {item.sections.map((section, idx) => (
                <Fragment key={section.title}>
                  <section>
                    <h2 className="text-2xl font-bold text-[color:var(--ink)]">{section.title}</h2>
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph, index) => (
                        <p key={`${section.title}-${index}`} className="text-sm leading-6 text-[color:var(--ink)]">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                  {ctaEnabled && idx === inlineCtaPoint.injectAfterIndex && (
                    <ArticleInlineCTA surfaceKey={surfaceKey} slug={item.slug} contentType="case" />
                  )}
                </Fragment>
              ))}
            </div>

            <ProductSurfaceRolePanel
              surface="caseArticle"
              className="mt-10"
              title="案例读完后要回到自己的结构验证"
              description="案例详情页不能只让用户围观别人，而是把场景拆成结构、阶段、环境和动作，再引导用户验证自己是否相似。"
              compact
            />

            <ContentVisualAssetPanel
              assets={visualAssets}
              page={`/cases/${item.slug}`}
              source={pageSource}
              contentLabel="案例"
              contentTitle={item.title}
              className="mt-10"
            />

            {relatedCases.length > 0 ? (
              <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">同类案例继续阅读</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {relatedCases.map((entry) => (
                    <ContentCardLink
                      key={entry.slug}
                      href={`/cases/${entry.slug}`}
                      source={pageSource}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                      page={`/cases/${item.slug}`}
                      meta={{
                        surfaceKey: `case_article:${item.slug}`,
                        targetSurfaceKey: `case_article:${entry.slug}`,
                        contentType: 'case',
                        slug: entry.slug,
                        title: entry.title,
                        category: entry.category,
                        tags: entry.tags,
                      }}
                      className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{entry.title}</div>
                      <div className="text-sm leading-7 text-[color:var(--ink-4)] mt-2">{entry.excerpt}</div>
                    </ContentCardLink>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-10">
              <SurfaceJourneyPanel
                journey={journey}
                title={journeyCopy.title}
                description={journeyCopy.description}
                badge="案例文章来源 · 已保留"
              />
            </section>
          </article>

          <div className="space-y-5">
            <ContentQuickAnalyzePanel
              sourceLabel="案例页快速分析"
              sourceKey={`case_article:${item.slug}`}
              contentMeta={{
                contentType: 'case',
                surfaceKey: `case_article:${item.slug}`,
                slug: item.slug,
                title: item.title,
                category: item.scenario,
                tags: item.tags,
              }}
              title="案例和你之间，只差把生日带进去"
              description="把出生日期、时间和性别先带进分析入口，看看你和这类案例到底是相似结构，还是只是表面相像。"
            />

            {primaryTool ? (
              <>
                <ContentConversionPanel
                  tool={primaryTool}
                  page={`/cases/${item.slug}`}
                  contentLabel="案例"
                  contentTitle={item.title}
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                />
                <ToolPremiumRequestPanel tool={primaryTool} page={`/cases/${item.slug}`} />
              </>
            ) : null}

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4" />
                案例相关工具
              </div>
              <div className="mt-4 grid gap-3">
                {toolItems.length > 0 ? toolItems.map((tool) => (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page={`/cases/${item.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    className="block rounded-[var(--radius)] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.themeLabel}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{tool.shortTitle}</div>
                  </ToolCardLink>
                )) : (
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应工具</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <BookOpenText className="h-4 w-4" />
                案例相关知识
              </div>
              <div className="mt-4 grid gap-3">
                {knowledgeItems.length > 0 ? knowledgeItems.map((entry) => (
                  <ContentCardLink
                    key={entry.slug}
                    href={`/knowledge/${entry.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/cases/${item.slug}`}
                    meta={{ surfaceKey: `case_article:${item.slug}`, targetSurfaceKey: `knowledge_article:${entry.slug}`, contentType: 'knowledge' }}
                    className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{entry.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应知识内容</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Sparkles className="h-4 w-4" />
                案例相关洞察
              </div>
              <div className="mt-4 grid gap-3">
                {insightItems.length > 0 ? insightItems.map((entry) => (
                  <ContentCardLink
                    key={entry.slug}
                    href={`/insights/${entry.type}/${entry.slug}`}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                    page={`/cases/${item.slug}`}
                    meta={{ surfaceKey: `case_article:${item.slug}`, targetSurfaceKey: `insight_article:${entry.slug}`, contentType: 'insight' }}
                    className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.name}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{entry.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--ink)]">暂无对应洞察</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">世界易案例路径</div>
              <div className="mt-4 space-y-4">
                <ContentCardLink
                  href={caseMethodHref}
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: caseMethodHref.replace('/knowledge/', 'knowledge_article:'),
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{caseMethodTitle}</div>
                </ContentCardLink>
                <ContentCardLink
                  href={methodologyHref}
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: methodologyHref.replace('/knowledge/', 'knowledge_article:'),
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{methodologyTitle}</div>
                </ContentCardLink>
                <ContentCardLink
                  href={caseHubHref}
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: isEnglishCase ? 'world_yi_en_page' : isGlobalChineseCase ? 'world_yi_global_cases_page' : 'world_yi_page',
                    contentType: 'case',
                    series: 'world-yi',
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{caseHubLabel}</div>
                </ContentCardLink>
                <ContentCardLink
                  href="/world-yi/book"
                  source={pageSource}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: 'world_yi_book_page',
                    contentType: 'knowledge',
                    series: 'world-yi-book',
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 transition hover:bg-[color:var(--paper)]"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">看世界易主书工程</div>
                </ContentCardLink>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">这类案例的价值</div>
              <div className="mt-4 space-y-3 text-xs leading-6 text-[color:var(--ink)]">
                <p>它能把抽象判断结果翻译成真实场景。</p>
                <p>它能提升新用户对产品价值的理解速度。</p>
                <p>它能成为长期可累积、可搜索、可分享的内容资产。</p>
              </div>
            </div>

            <NewsletterSignup
              source={`case_article:${item.slug}`}
              title="订阅案例更新"
              description="持续接收新的公开案例和场景拆解，方便你观察相似问题在不同人生阶段怎么展开。"
            />
          </div>
        </section>
      </main>

      {ctaEnabled && (
        <>
          <ArticleScrollTracker surfaceKey={surfaceKey} slug={item.slug} contentType="case" />
          <ArticleStickyCTA surfaceKey={surfaceKey} slug={item.slug} contentType="case" />
        </>
      )}
      <SiteFooter />
    </div>
  );
}
