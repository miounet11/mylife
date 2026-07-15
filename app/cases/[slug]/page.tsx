import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { getCaseStudyBySlug } from '@/lib/content-store';
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
import { articleDatesFrom, articleSeo, buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function caseSisterExists(slug: string): boolean {
  return Boolean(getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: '案例库' };
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

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getCaseStudyBySlug(slug) || CONTENT_BY_SLUG.get(slug) || null;
  if (!article || (article.type && article.type !== 'case')) notFound();

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

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '十维度研判' }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '案例库', path: '/cases' },
          { name: article.title, path: `/cases/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: geo.answerSummary || summary || article.title,
          path: `/cases/${slug}`,
          keywords: [trackKey, '案例', '世界易', '人生K线', ...(geo.geo?.entityKeywords || [])],
          datePublished: articleDatesFrom(article).publishedTime,
          dateModified: articleDatesFrom(article).modifiedTime,
          inLanguage: geo.locale,
          abstract: geo.answerSummary,
          about: geo.geo?.entityKeywords,
        })}
      />
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
        }}
      />
      <ContentVisitTracker href={`/cases/${slug}`} title={article.title} kind="article" />
      <FocusHero
        eyebrow="案例库"
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
          </div>
        }
        actions={
          <>
            <Link href={crosslinks.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              生成类似报告
            </Link>
            {crosslinks.dimensions[0] ? (
              <Link href={crosslinks.dimensions[0].href} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {crosslinks.dimensions[0].title}
              </Link>
            ) : null}
          </>
        }
      />
      <JourneyStrip active="content" />
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
            生成类似处境的报告
          </Link>
          <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            十维度
          </Link>
          <Link href={`/learn/${trackKey}`} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            相关专题
          </Link>
        </div>
      </article>

      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title="案例之后：落到你的处境"
          description="用十维度场景与工具，把案例中的结构判断迁移到你自己的命盘与时间窗。"
        />
      </div>

      <div className="mt-4">
        <RelatedContent slug={slug} trackKey={trackKey} type="case" />
      </div>
    </AppPage>
  );
}
