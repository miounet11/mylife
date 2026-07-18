import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import JourneyStrip from '@/components/content/journey-strip';
import ContentLocaleFilter, {
  ContentLocaleBadge,
} from '@/components/content/content-locale-filter';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import ContentListPagination from '@/components/content/content-list-pagination';
import {
  articleGeoFields,
  articleSummary,
  paginate,
} from '@/lib/content-article-view';
import { getKnowledgeArticles } from '@/lib/content-store';
import type { ContentLocaleGroupKey } from '@/lib/content-locale';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { contentHubCopy } from '@/lib/i18n/funnel-copy';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

const PAGE_SIZE = 24;

interface PageProps {
  searchParams?: Promise<{ page?: string; locale?: string; lang?: string }>;
}

function parseLocaleFilter(raw?: string | null): ContentLocaleGroupKey | 'all' {
  const v = `${raw || ''}`.trim().toLowerCase();
  if (v === 'en' || v === 'english') return 'en';
  if (v === 'zh-hant' || v === 'zh-tw' || v === 'zh-hk' || v === 'hant' || v === 'traditional') {
    return 'zh-Hant';
  }
  if (v === 'zh-hans' || v === 'zh-cn' || v === 'hans' || v === 'simplified') {
    return 'zh-Hans';
  }
  return 'all';
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) || {};
  const locale = await getRequestLocale(sp.lang);
  const copy = contentHubCopy('knowledge', locale);
  return buildPageMetadata({
    title: copy.meta.title,
    description: copy.meta.description,
    path: withLocalePrefix('/knowledge', locale),
    locale,
    keywords: [
      '八字知识',
      '世界易',
      '真太阳时',
      '报告读法',
      '海外华人运势',
      '十维度',
      'GEO',
      'bazi knowledge',
      'World Yi',
    ],
  });
}

export default async function KnowledgePage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {};
  const page = Math.max(1, Number(sp.page) || 1);
  const localeFilter = parseLocaleFilter(sp.locale);
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = contentHubCopy('knowledge', uiLocale);

  const all = getKnowledgeArticles().map((item) => {
    const geo = articleGeoFields(item);
    return { item, geo };
  });

  const counts = {
    all: all.length,
    'zh-Hans': all.filter((x) => x.geo.groupKey === 'zh-Hans').length,
    'zh-Hant': all.filter((x) => x.geo.groupKey === 'zh-Hant').length,
    en: all.filter((x) => x.geo.groupKey === 'en').length,
  };

  const filtered =
    localeFilter === 'all'
      ? all
      : all.filter((x) => x.geo.groupKey === localeFilter);

  const { items, total, page: currentPage, totalPages } = paginate(
    filtered,
    page,
    PAGE_SIZE
  );

  const basePath =
    localeFilter === 'all' ? '/knowledge' : `/knowledge?locale=${localeFilter}`;

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: copy.ctaHeader, compact: true }}>
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/knowledge"
        meta={{
          surfaceKey: 'knowledge',
          page: currentPage,
          total,
          localeFilter,
          uiLocale,
        }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Link href="/dimensions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.ctaDimensions}
              </Link>
              <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                专题
              </Link>
              <Link href="/cases" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                案例
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.ctaTools}
              </Link>
            </>
          }
        />
        <JourneyStrip active="content" />
        <PageIllustrationStrip surface="knowledge/hub" title="怎么用知识库" compact limit={1} />
        <DimensionsShowcase
          title={copy.showcaseTitle}
          description={copy.showcaseDesc}
          limit={6}
          source="knowledge_list"
          compact
        />

        <ContentLocaleFilter
          basePath="/knowledge"
          active={localeFilter}
          hint={copy.localeFilterHint}
          options={[
            { key: 'all', label: copy.allLocales, count: counts.all },
            { key: 'zh-Hans', label: '简体中文', count: counts['zh-Hans'] },
            { key: 'zh-Hant', label: '繁體中文', count: counts['zh-Hant'] },
            { key: 'en', label: 'English', count: counts.en },
          ]}
        />

        <section>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">
              {copy.publishedLabel(total)}
            </h2>
            {totalPages > 1 ? (
              <span className="text-[11px] text-[color:var(--ink-5)]">
                {copy.pageHint(currentPage, PAGE_SIZE)}
              </span>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="py-4 text-[13px] text-[color:var(--ink-5)]">{copy.emptyGroup}</p>
          ) : (
            <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {items.map(({ item, geo }) => (
                <li key={item.slug || item.id}>
                  <Link
                    href={`/knowledge/${item.slug}`}
                    className="block py-3 no-underline hover:no-underline"
                  >
                    <h2 className="text-[14px] font-medium text-[color:var(--ink-1)] hover:underline">
                      {item.title}
                    </h2>
                    {articleSummary(item as never) ? (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
                        {articleSummary(item as never)}
                      </p>
                    ) : null}
                    <ContentLocaleBadge
                      groupLabel={geo.groupLabel}
                      localeLabel={geo.localeLabel}
                      geoReady={geo.geoReady}
                      geoReadyLabel={copy.geoReadyBadge}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ContentListPagination
            basePath={basePath.includes('?') ? basePath : basePath}
            page={currentPage}
            totalPages={totalPages}
          />
        </section>
      </div>
    </AppPage>
  );
}
