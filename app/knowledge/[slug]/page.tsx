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

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string }>;
}

function knowledgeSisterExists(slug: string): boolean {
  return Boolean(getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getKnowledgeArticleBySlug(slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: '知识库' };
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
  const source = (await searchParams)?.source;
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
  const faqPairs = sections
    .filter((section) => section.heading.startsWith('常见问题'))
    .map((section) => ({
      question: section.heading.replace(/^常见问题：?/, ''),
      answer: section.body,
    }));

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '十维度研判' }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '知识库', path: '/knowledge' },
          { name: article.title, path: `/knowledge/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: geo.answerSummary || summary || article.title,
          path: `/knowledge/${slug}`,
          keywords: [
            ...(seed?.keywords || [trackKey, '世界易', '人生K线']),
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
        }}
      />
      <ContentVisitTracker href={`/knowledge/${slug}`} title={article.title} kind="article" />
      <FocusHero
        eyebrow="知识库"
        title={article.title}
        description={summary}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <ContentLocaleBadge
              groupLabel={geo.groupLabel}
              localeLabel={geo.localeLabel}
              geoReady={geo.geoReady}
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
              场景研判
            </Link>
            <Link href="/tools" className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:underline">
              工具
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
      <JourneyStrip active="content" />
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
            十维度
          </Link>
          <Link href={`/learn/${trackKey}`} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            回到专题
          </Link>
        </div>
      </article>

      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title="把这篇文章接到功能"
          description="相关十维度研判、免费工具与完整报告入口，帮助你从「读懂」走到「验证」。"
        />
      </div>

      <div className="mt-4">
        <RelatedContent slug={slug} trackKey={trackKey} type="knowledge" />
      </div>
    </AppPage>
  );
}
