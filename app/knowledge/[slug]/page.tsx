import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContentActionRail from '@/components/content/content-action-rail';
import JourneyStrip from '@/components/content/journey-strip';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import EncyclopediaWorldYiSidebar from '@/components/encyclopedia-world-yi-sidebar';
import RelatedContent from '@/components/related-content';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentVisitTracker from '@/components/content-visit-tracker';
import {
  articleGeoFields,
  articleReadLabel,
  articleSummary,
  articleTrackKey,
  normalizeSections,
} from '@/lib/content-article-view';
import { resolveContentCrosslinks } from '@/lib/content-crosslinks';
import { getEncyclopediaWorldYiLens } from '@/lib/encyclopedia-world-yi-lens';
import { getKnowledgeArticleBySlug } from '@/lib/content-store';
import { CONTENT_BY_SLUG } from '@/lib/content-seeds';
import { ContentLocaleBadge } from '@/components/content/content-locale-filter';
import { ContentArticleBody } from '@/components/content/content-article-body';
import {
  buildContentEntityLanguageAlternates,
  resolveContentSisterLink,
} from '@/lib/content-locale-pairs';
import {
  illustrationSeoImages,
  resolveContentIllustrations,
} from '@/lib/content-illustrations';
import {
  articleDatesFrom,
  articleSeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo';
import { knowledgeArticleCopy } from '@/lib/i18n/content-article-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string; lang?: string }>;
}

function knowledgeSisterExists(slug: string): boolean {
  return Boolean(getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = knowledgeArticleCopy(uiLocale);
  const article = getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: copy.metaFallback };
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const dates = articleDatesFrom(article);
  const geo = articleGeoFields(article);
  const languages = buildContentEntityLanguageAlternates({
    kind: 'knowledge',
    slug,
    contentLocale: geo.locale,
    sisterExists: knowledgeSisterExists,
  });
  const seoImages = illustrationSeoImages(
    resolveContentIllustrations({
      contentType: 'knowledge',
      slug,
      title: article.title,
      excerpt: summary,
      category: (article as { category?: string }).category,
      tags: (article as { tags?: string[] }).tags,
      meta: (article as { meta?: Record<string, unknown> }).meta,
      locale: geo.locale,
    }),
  );
  return articleSeo({
    title: article.title,
    summary,
    path: `/knowledge/${slug}`,
    trackKey: articleTrackKey(article as never),
    type: 'knowledge',
    keywords: (article as { keywords?: string[] }).keywords,
    publishedTime: dates.publishedTime,
    modifiedTime: dates.modifiedTime,
    locale: geo.locale,
    canonicalPath: `/knowledge/${slug}`,
    answerSummary: geo.answerSummary,
    searchIntents: geo.geo?.searchIntents,
    entityKeywords: geo.geo?.entityKeywords,
    languages,
    images: seoImages.map((item) => item.url),
  });
}

export default async function KnowledgeArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const source = sp.source;
  const uiLocale = await getRequestLocale(sp.lang);
  // Prefer DB/content-store; fall back to local enriched seeds (SEO pillars / dimension guides)
  const article = getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug) || null;
  if (!article || (article.type && article.type !== 'knowledge')) notFound();

  const lens = getEncyclopediaWorldYiLens({ slug, source });
  const sections = normalizeSections(article.sections as never);
  const trackKey = articleTrackKey(article as never);
  const readLabel = articleReadLabel(article as never);
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const crosslinks = resolveContentCrosslinks({
    slug,
    title: article.title,
    summary,
    trackKey,
    source: source || 'knowledge_article',
  });

  const seed = CONTENT_BY_SLUG.get(slug);
  const geo = articleGeoFields(article);
  const sister = resolveContentSisterLink({
    kind: 'knowledge',
    slug,
    contentLocale: geo.locale,
    sisterExists: knowledgeSisterExists,
  });
  const copy = knowledgeArticleCopy(uiLocale);
  const faqPairs = sections
    .filter((section) => section.heading.startsWith('常见问题') || section.heading.startsWith('FAQ') || section.heading.startsWith('Common questions'))
    .map((section) => ({
      question: section.heading.replace(/^(常见问题|FAQ|Common questions)：?\s*/i, ''),
      answer: section.body,
    }));

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: copy.dimensionsCta }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: copy.homeCrumb, path: '/' },
          { name: copy.hubCrumb, path: '/knowledge' },
          { name: article.title, path: `/knowledge/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: geo.answerSummary || summary || article.title,
          path: `/knowledge/${slug}`,
          keywords: [
            ...(seed?.keywords || copy.defaultKeywords(trackKey)),
            ...(geo.geo?.entityKeywords || []),
          ],
          datePublished: articleDatesFrom(article).publishedTime,
          dateModified: articleDatesFrom(article).modifiedTime,
          inLanguage: geo.locale,
          abstract: geo.answerSummary,
          about: geo.geo?.entityKeywords,
        })}
      />
      {faqPairs.length ? <JsonLd data={buildFaqJsonLd(faqPairs)} /> : null}
      <AnalyticsPageView
        eventName="knowledge_article_viewed"
        page={`/knowledge/${slug}`}
        meta={{
          surfaceKey: 'knowledge',
          contentType: 'knowledge',
          slug,
          title: article.title,
          trackKey,
          source: source || null,
          contentLocale: geo.locale,
          geoReady: geo.geoReady,
          uiLocale,
        }}
      />
      <ContentVisitTracker href={`/knowledge/${slug}`} title={article.title} kind="article" />
      <FocusHero
        eyebrow={copy.eyebrow}
        title={article.title}
        description={summary}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <ContentLocaleBadge
              groupLabel={geo.groupLabel}
              localeLabel={geo.localeLabel}
              geoReady={geo.geoReady}
              geoReadyLabel={copy.geoReadyBadge}
              locale={uiLocale}
            />
            {sister ? (
              <Link
                href={sister.href}
                className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline"
              >
                {sister.label}
              </Link>
            ) : null}
            {readLabel ? <span className="text-[12px] text-[color:var(--ink-5)]">{readLabel}</span> : null}
            <Link href="/dimensions" className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline">
              {copy.sceneJudgment}
            </Link>
            <Link href="/tools" className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline">
              {copy.toolsLink}
            </Link>
          </div>
        }
        actions={
          <>
            <Link href={crosslinks.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {crosslinks.primaryLabel}
            </Link>
            {crosslinks.dimensions[0] ? (
              <Link
                href={crosslinks.dimensions[0].href}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {crosslinks.dimensions[0].title}
              </Link>
            ) : null}
          </>
        }
      />
      <JourneyStrip active="content" locale={uiLocale} />
      {lens ? <EncyclopediaWorldYiSidebar lens={lens} /> : null}
      <article className="space-y-4 border-t border-[color:var(--hairline)] pt-5">
        <ContentArticleBody
          sections={sections}
          entry={{
            contentType: 'knowledge',
            slug,
            title: article.title,
            excerpt: summary,
            category: (article as { category?: string }).category,
            tags: (article as { tags?: string[] }).tags,
            meta: (article as { meta?: Record<string, unknown> }).meta,
          }}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href={crosslinks.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {crosslinks.primaryLabel}
          </Link>
          <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.dimensionsShort}
          </Link>
          <Link href={`/learn/${trackKey}`} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.backToTopic}
          </Link>
        </div>
      </article>

      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title={copy.railTitle}
          description={copy.railDescription}
        />
      </div>

      <div className="mt-4">
        <RelatedContent slug={slug} trackKey={trackKey} type="knowledge" />
      </div>
    </AppPage>
  );
}
