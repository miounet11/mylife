import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicArticleHero from '@/components/public-article-hero';
import ContentBreadcrumbs from '@/components/content-breadcrumbs';
import ContentCardLink from '@/components/content-card-link';
import ContentConversionPanel from '@/components/content-conversion-panel';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import {
  getCaseStudyBySlug,
  getManagedContentEntryBySlug,
  getManagedContentJourneyMeta,
  listPublishedManagedContentEntriesByType,
} from '@/lib/content-store';
import { buildJourneyForContent } from '@/lib/surface-journeys';
import { getToolDefinition } from '@/lib/tools';
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

  return createPublicContentMetadata({
    title: item.seoTitle,
    description: item.seoDescription,
    path: `/cases/${item.slug}`,
    type: 'article',
    locale: typeof managedEntry?.meta?.locale === 'string' ? managedEntry.meta.locale : undefined,
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
  const schemas = [
    createArticleSchema({
      headline: item.seoTitle,
      description: item.seoDescription,
      path: `/cases/${item.slug}`,
      articleSection: item.scenario,
      keywords: item.tags,
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
  });
  const journeyMeta = getManagedContentJourneyMeta(managedEntry);
  const primaryTool = journeyMeta.relatedToolSlugs
    .map((toolSlug) => getToolDefinition(toolSlug))
    .find((tool) => !!tool)
    || null;

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
                <Link href="/cases" className="action-secondary inline-flex">
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
              actions={[
                <Link key="analyze" href="/analyze" className="action-primary action-main">开始分析</Link>,
                <Link key="cases" href="/cases" className="action-secondary">返回案例库</Link>,
                <Link key="hub" href={caseHubHref} className="action-secondary">{caseHubLabel}</Link>,
              ]}
            />

            <div className="mt-8 space-y-8">
              {item.sections.map((section) => (
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

            {relatedCases.length > 0 ? (
              <section className="mt-10 rounded-[1.75rem] border border-[color:var(--line)] bg-white/70 p-5">
                <div className="text-sm font-semibold text-[color:var(--muted)]">同类案例继续阅读</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {relatedCases.map((entry) => (
                    <ContentCardLink
                      key={entry.slug}
                      href={`/cases/${entry.slug}`}
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
                      className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{entry.title}</div>
                      <div className="intro-copy mt-2">{entry.excerpt}</div>
                    </ContentCardLink>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-10">
              <SurfaceJourneyPanel
                journey={journey}
                title="这个案例已经接到你的测算和工具路径"
                description="从案例直接回到测算、工具和方法文章。"
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
              description="直接填生日与时间，下一步继续补出生地。"
            />

            {primaryTool ? (
              <>
                <ContentConversionPanel
                  tool={primaryTool}
                  page={`/cases/${item.slug}`}
                  contentLabel="案例"
                  contentTitle={item.title}
                />
                <ToolPremiumRequestPanel tool={primaryTool} page={`/cases/${item.slug}`} />
              </>
            ) : null}

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">世界易案例路径</div>
              <p className="intro-copy mt-3">从案例回到方法、判断顺序和总入口。</p>
              <div className="mt-4 space-y-4">
                <ContentCardLink
                  href={caseMethodHref}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: caseMethodHref.replace('/knowledge/', 'knowledge_article:'),
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{caseMethodTitle}</div>
                  <div className="intro-copy mt-2">
                    {caseMethodDescription}
                  </div>
                </ContentCardLink>
                <ContentCardLink
                  href={methodologyHref}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: methodologyHref.replace('/knowledge/', 'knowledge_article:'),
                    contentType: 'knowledge',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{methodologyTitle}</div>
                  <div className="intro-copy mt-2">
                    {methodologyDescription}
                  </div>
                </ContentCardLink>
                <ContentCardLink
                  href={caseHubHref}
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: isEnglishCase ? 'world_yi_en_page' : isGlobalChineseCase ? 'world_yi_global_cases_page' : 'world_yi_page',
                    contentType: 'case',
                    series: 'world-yi',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{caseHubLabel}</div>
                  <div className="intro-copy mt-2">
                    {isEnglishCase
                      ? 'Continue through the English gateway and case path.'
                      : isGlobalChineseCase
                        ? '继续沿全球华人路径阅读。'
                      : '继续进入世界易总论、主书和方法路径。'}
                  </div>
                </ContentCardLink>
                <ContentCardLink
                  href="/world-yi/book"
                  page={`/cases/${item.slug}`}
                  meta={{
                    surfaceKey: `case_article:${item.slug}`,
                    targetSurfaceKey: 'world_yi_book_page',
                    contentType: 'knowledge',
                    series: 'world-yi-book',
                  }}
                  className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">看世界易主书工程</div>
                  <div className="intro-copy mt-2">把单个案例放回十卷主书的完整框架里。</div>
                </ContentCardLink>
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-5">
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
              description="新增代表性案例时直接发到邮箱。"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
