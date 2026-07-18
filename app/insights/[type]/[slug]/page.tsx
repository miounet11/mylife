import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentActionRail from '@/components/content/content-action-rail';
import JourneyStrip from '@/components/content/journey-strip';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import RelatedContent from '@/components/related-content';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import {
  articleGeoFields,
  articleSummary,
  articleTrackKey,
  normalizeSections,
} from '@/lib/content-article-view';
import { resolveContentCrosslinks } from '@/lib/content-crosslinks';
import {
  illustrationSeoImages,
  resolveContentIllustrations,
} from '@/lib/content-illustrations';
import {
  buildContentEntityLanguageAlternates,
  resolveContentSisterLink,
} from '@/lib/content-locale-pairs';
import { getEntityInsightByTypeAndSlug } from '@/lib/content-store';
import { CONTENT_BY_SLUG } from '@/lib/content-seeds';
import {
  articleDatesFrom,
  articleSeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

function insightSisterExists(slug: string): boolean {
  return Boolean(
    getEntityInsightByTypeAndSlug('city', slug)
    || getEntityInsightByTypeAndSlug('topic', slug)
    || CONTENT_BY_SLUG.get(slug),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const article = getEntityInsightByTypeAndSlug(type, slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: '系统洞察' };
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const dates = articleDatesFrom(article);
  const geo = articleGeoFields(article);
  const isEnEntity =
    `${geo.locale || ''}`.toLowerCase().startsWith('en')
    || /-en$/i.test(slug)
    || slug.startsWith('world-yi-en-');
  const languages = buildContentEntityLanguageAlternates({
    kind: 'insight',
    slug,
    insightType: type,
    contentLocale: isEnEntity ? 'en' : geo.locale || 'zh-Hans',
    sisterExists: insightSisterExists,
  });
  const seoImages = illustrationSeoImages(
    resolveContentIllustrations({
      contentType: 'insight',
      slug,
      title: article.title,
      excerpt: summary,
      category: type,
      tags: (article as { keywords?: string[] }).keywords,
      meta: (article as { meta?: Record<string, unknown> }).meta,
      locale: isEnEntity ? 'en' : geo.locale || 'zh-CN',
    }),
  );
  return articleSeo({
    title: article.title,
    summary,
    path: `/insights/${type}/${slug}`,
    trackKey: articleTrackKey(article as never),
    type: 'insight',
    keywords: [
      'GEO',
      '城市观察',
      'city lens',
      '海外华人',
      'overseas Chinese',
      type,
      ...((article as { keywords?: string[] }).keywords || []),
    ],
    publishedTime: dates.publishedTime,
    modifiedTime: dates.modifiedTime,
    locale: isEnEntity ? 'en' : geo.locale,
    canonicalPath: `/insights/${type}/${slug}`,
    languages,
    images: seoImages.map((item) => item.url),
    entityKeywords: geo.geo?.entityKeywords,
    answerSummary: geo.answerSummary,
  });
}

export default async function InsightArticlePage({
  params,
  searchParams,
}: PageProps) {
  const { type, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const illustLocale = toIllustLocale(uiLocale);
  const article = getEntityInsightByTypeAndSlug(type, slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) notFound();

  const isEnEntity =
    /-en$/i.test(slug)
    || slug.startsWith('world-yi-en-')
    || `${(article as { locale?: string }).locale || ''}`.toLowerCase().startsWith('en');

  // Support seed fallback shape
  const sections = normalizeSections(
    (article as { sections?: unknown }).sections as never,
  );
  // Match GEO city strip: world-yi-city-shanghai | world-yi-en-city-shanghai | shanghai
  const cityKey = slug
    .replace(/^world-yi-en-city-/, '')
    .replace(/^world-yi-city-/, '')
    .replace(/^city-/, '');
  const geoSurface =
    type === 'city' || /city|shanghai|shenzhen|beijing|london|sydney|tokyo|york|angeles|singapore|hong-kong|vancouver|toronto/i.test(
      slug,
    )
      ? `geo/${cityKey}`
      : `insights/city/${slug}`;
  const trackKey = articleTrackKey(article as never);
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const geo = articleGeoFields(article);
  const sister = resolveContentSisterLink({
    kind: 'insight',
    slug,
    insightType: type,
    contentLocale: isEnEntity ? 'en' : geo.locale,
    sisterExists: insightSisterExists,
  });
  const crosslinks = resolveContentCrosslinks({
    slug,
    title: article.title,
    summary,
    trackKey,
    source: `insight_${type}`,
  });
  const faqPairs = sections
    .filter((section) => /常见问题|FAQ/i.test(section.heading))
    .map((section) => ({
      question: section.heading.replace(/^(常见问题|FAQ)：?/i, ''),
      answer: section.body,
    }));

  const stripTitle = illustStripTitle(
    isEnEntity ? 'en' : uiLocale,
    {
      'zh-CN': type === 'city' ? '城市环境层' : '环境观察',
      'zh-Hant': type === 'city' ? '城市環境層' : '環境觀察',
      en: type === 'city' ? 'City environment layer' : 'Environment lens',
    },
  );

  const eyebrow = isEnEntity
    ? type === 'city'
      ? 'City lens · GEO'
      : 'Insight'
    : type === 'city'
      ? '城市观察 · GEO'
      : '系统洞察';

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: isEnEntity ? 'Ten dimensions' : '十维度研判' }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: isEnEntity ? 'Home' : '首页', path: '/' },
          { name: isEnEntity ? 'Insights' : '洞察', path: '/insights' },
          { name: article.title, path: `/insights/${type}/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: summary || article.title,
          path: `/insights/${type}/${slug}`,
          keywords: ['GEO', type, trackKey, isEnEntity ? 'overseas Chinese' : '海外华人', 'Life K-Line'],
          datePublished: articleDatesFrom(article).publishedTime,
          dateModified: articleDatesFrom(article).modifiedTime,
          inLanguage: isEnEntity ? 'en' : 'zh-CN',
        })}
      />
      {faqPairs.length ? <JsonLd data={buildFaqJsonLd(faqPairs)} /> : null}
      <AnalyticsPageView
        eventName="insight_article_viewed"
        page={`/insights/${type}/${slug}`}
        meta={{
          surfaceKey: 'insights',
          contentType: 'insight',
          slug,
          type,
          title: article.title,
          trackKey,
          locale: isEnEntity ? 'en' : 'zh-CN',
        }}
      />
      <FocusHero
        eyebrow={eyebrow}
        title={article.title}
        description={summary}
        actions={
          <>
            <Link href="/dimensions/living-environment" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              {isEnEntity ? 'Living environment' : '居家环境研判'}
            </Link>
            <Link href="/dimensions/fortune-rhythm" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
              {isEnEntity ? 'Fortune rhythm' : '运势节奏'}
            </Link>
            {sister ? (
              <Link href={sister.href} className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {sister.label}
              </Link>
            ) : null}
          </>
        }
      />
      <JourneyStrip active="content" />
      <div className="mx-auto max-w-3xl px-4">
        <PageIllustrationStrip
          surface={geoSurface}
          title={stripTitle}
          compact
          limit={1}
          locale={isEnEntity ? 'en' : illustLocale}
          priority
        />
      </div>
      <article className="fb-card space-y-4 p-4 md:p-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
              {section.body}
            </p>
          </section>
        ))}
        <div className="flex flex-wrap gap-2 border-t border-[color:var(--hairline)] pt-4">
          <Link href={crosslinks.analyzeHref} className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            {crosslinks.primaryLabel}
          </Link>
          <Link href="/dimensions" className="fb-btn h-9 px-4 text-sm hover:no-underline">
            {isEnEntity ? 'Ten dimensions' : '十维度中心'}
          </Link>
        </div>
      </article>
      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title={isEnEntity ? 'After the city lens' : '城市观察之后'}
          description={
            isEnEntity
              ? 'Connect GEO environment reads to living environment, fortune rhythm, and a full report.'
              : '把 GEO 环境层判断接到居家环境、运势节奏与完整报告。'
          }
        />
      </div>
      <RelatedContent slug={slug} trackKey={trackKey} type="insight" />
    </AppPage>
  );
}
