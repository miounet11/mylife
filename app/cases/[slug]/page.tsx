import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import ContentActionRail from '@/components/content/content-action-rail';
import JourneyStrip from '@/components/content/journey-strip';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import RelatedContent from '@/components/related-content';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentVisitTracker from '@/components/content-visit-tracker';
import {
  articleGeoFields,
  articleSummary,
  articleTrackKey,
  normalizeSections,
} from '@/lib/content-article-view';
import { resolveContentCrosslinks } from '@/lib/content-crosslinks';
import { getCaseStudyBySlug, getKnowledgeArticleBySlug } from '@/lib/content-store';
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
import { caseArticleCopy } from '@/lib/i18n/content-article-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import ArticleGeoLead from '@/components/seo/article-geo-lead';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

function caseSisterExists(slug: string): boolean {
  return Boolean(getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = caseArticleCopy(uiLocale);
  const article = getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: copy.metaFallback };
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const dates = articleDatesFrom(article);
  const geo = articleGeoFields(article);
  const languages = buildContentEntityLanguageAlternates({
    kind: 'case',
    slug,
    contentLocale: geo.locale,
    sisterExists: caseSisterExists,
  });
  const seoImages = illustrationSeoImages(
    resolveContentIllustrations({
      contentType: 'case',
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
    path: `/cases/${slug}`,
    trackKey: articleTrackKey(article as never),
    type: 'case',
    publishedTime: dates.publishedTime,
    modifiedTime: dates.modifiedTime,
    locale: geo.locale,
    canonicalPath: `/cases/${slug}`,
    answerSummary: geo.answerSummary,
    searchIntents: geo.geo?.searchIntents,
    entityKeywords: geo.geo?.entityKeywords,
    languages,
    images: seoImages.map((item) => item.url),
  });
}

export default async function CaseStudyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = caseArticleCopy(uiLocale);
  const article = getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug) || null;
  if (!article || (article.type && article.type !== 'case')) {
    const asKnowledge = getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug);
    if (asKnowledge && (!asKnowledge.type || asKnowledge.type === 'knowledge')) {
      permanentRedirect(`/knowledge/${slug}`);
    }
    notFound();
  }

  const sections = normalizeSections(article.sections as never);
  const trackKey = articleTrackKey(article as never);
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const geo = articleGeoFields(article);
  const sister = resolveContentSisterLink({
    kind: 'case',
    slug,
    contentLocale: geo.locale,
    sisterExists: caseSisterExists,
  });
  const crosslinks = resolveContentCrosslinks({
    slug,
    title: article.title,
    summary,
    trackKey,
    source: 'case_study',
  });
  const faqPairs = sections
    .filter(
      (section) =>
        section.heading.startsWith('常见问题')
        || section.heading.startsWith('FAQ')
        || section.heading.startsWith('Common questions'),
    )
    .map((section) => ({
      question: section.heading.replace(/^(常见问题|FAQ|Common questions)：?\s*/i, ''),
      answer: section.body,
    }));

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: copy.dimensionsCta }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: copy.homeCrumb, path: '/' },
          { name: copy.hubCrumb, path: '/cases' },
          { name: article.title, path: `/cases/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: geo.answerSummary || summary || article.title,
          path: `/cases/${slug}`,
          keywords: [
            ...copy.defaultKeywords(trackKey),
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
        eventName="case_article_viewed"
        page={`/cases/${slug}`}
        meta={{
          surfaceKey: 'cases',
          contentType: 'case',
          slug,
          title: article.title,
          trackKey,
          contentLocale: geo.locale,
          geoReady: geo.geoReady,
          uiLocale,
        }}
      />
      <ContentVisitTracker href={`/cases/${slug}`} title={article.title} kind="article" />
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
          </div>
        }
        actions={
          <>
            <Link href={crosslinks.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {copy.generateSimilar}
            </Link>
            {crosslinks.dimensions[0] ? (
              <Link href={crosslinks.dimensions[0].href} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {crosslinks.dimensions[0].title}
              </Link>
            ) : null}
          </>
        }
      />
      <JourneyStrip active="content" locale={uiLocale} />
      <div className="page-content">
        <ArticleGeoLead
          answerSummary={geo.answerSummary || summary}
          searchIntents={geo.geo?.searchIntents}
          entityKeywords={geo.geo?.entityKeywords}
          title={uiLocale === 'en' ? 'What this case answers' : '这个案例在回答什么'}
        />
      </div>
      <article className="space-y-4 border-t border-[color:var(--hairline)] pt-5">
        <ContentArticleBody
          sections={sections}
          entry={{
            contentType: 'case',
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
            {copy.generateSimilarLong}
          </Link>
          <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.dimensionsShort}
          </Link>
          <Link href={`/learn/${trackKey}`} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.relatedTopic}
          </Link>
        </div>
      </article>

      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title={copy.railTitle}
          description={copy.railDescription}
          source={`case:${slug}`}
          page={`/cases/${slug}`}
          bridgeTitle="对照案例，生成你的结构报告"
          bridgeDescription="案例是别人的路径。用你的生辰生成结构报告，再对照决策节奏。"
        />
      </div>

      <div className="mt-4">
        <RelatedContent slug={slug} trackKey={trackKey} type="case" />
      </div>
    </AppPage>
  );
}
