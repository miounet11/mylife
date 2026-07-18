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
import { toIllustLocale } from '@/lib/page-illustrations/locale';
import {
  articleSummary,
  articleTrackKey,
  normalizeSections,
} from '@/lib/content-article-view';
import { resolveContentCrosslinks } from '@/lib/content-crosslinks';
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
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const article = getEntityInsightByTypeAndSlug(type, slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) return { title: '系统洞察' };
  const summary = articleSummary(article as never) || (article as { summary?: string }).summary || '';
  const dates = articleDatesFrom(article);
  return articleSeo({
    title: article.title,
    summary,
    path: `/insights/${type}/${slug}`,
    trackKey: articleTrackKey(article as never),
    type: 'insight',
    keywords: ['GEO', '城市观察', '海外华人', type, ...(article as { keywords?: string[] }).keywords || []],
    publishedTime: dates.publishedTime,
    modifiedTime: dates.modifiedTime,
  });
}

export default async function InsightArticlePage({
  params,
  searchParams,
}: PageProps & { searchParams?: Promise<{ lang?: string }> }) {
  const { type, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const illustLocale = toIllustLocale(uiLocale);
  const article = getEntityInsightByTypeAndSlug(type, slug) || CONTENT_BY_SLUG.get(slug);
  if (!article) notFound();

  // Support seed fallback shape
  const sections = normalizeSections(
    (article as { sections?: unknown }).sections as never,
  );
  // Match GEO city strip: world-yi-city-shanghai | shanghai → geo/shanghai
  const cityKey = slug
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
  const crosslinks = resolveContentCrosslinks({
    slug,
    title: article.title,
    summary,
    trackKey,
    source: `insight_${type}`,
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
          { name: '洞察', path: '/insights' },
          { name: article.title, path: `/insights/${type}/${slug}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: summary || article.title,
          path: `/insights/${type}/${slug}`,
          keywords: ['GEO', type, trackKey, '海外华人', '人生K线'],
          datePublished: articleDatesFrom(article).publishedTime,
          dateModified: articleDatesFrom(article).modifiedTime,
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
        }}
      />
      <FocusHero
        eyebrow={type === 'city' ? '城市观察 · GEO' : '系统洞察'}
        title={article.title}
        description={summary}
        actions={
          <>
            <Link href="/dimensions/living-environment" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              居家环境研判
            </Link>
            <Link href="/dimensions/fortune-rhythm" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
              运势节奏
            </Link>
          </>
        }
      />
      <JourneyStrip active="content" />
      <div className="mx-auto max-w-3xl px-4">
        <PageIllustrationStrip
          surface={geoSurface}
          title={type === 'city' ? '城市环境层' : '环境观察'}
          compact
          limit={1}
          locale={illustLocale}
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
            十维度中心
          </Link>
        </div>
      </article>
      <div className="mt-4">
        <ContentActionRail
          crosslinks={crosslinks}
          title="城市观察之后"
          description="把 GEO 环境层判断接到居家环境、运势节奏与完整报告。"
        />
      </div>
      <RelatedContent slug={slug} trackKey={trackKey} type="insight" />
    </AppPage>
  );
}
