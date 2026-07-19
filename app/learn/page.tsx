export const fetchCache = 'force-no-store';
export const revalidate = 0;

import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import {
  LearningTrackMapGrid,
  LearningTrackMapSummary,
  LearningTrackQuickLinks,
} from '@/components/learning-track-map';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { learnPageCopy } from '@/lib/i18n/learn-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import { getLearningTracksOverview } from '@/lib/learning-track-stats';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

interface LearnPageProps {
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: LearnPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = learnPageCopy(locale);
  return buildPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: withLocalePrefix('/learn', locale),
    locale,
  });
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = learnPageCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const overview = getLearningTracksOverview();

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}>
      <AnalyticsPageView eventName="learn_page_viewed" page="/learn" meta={{ surfaceKey: 'learning_map' }} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">
            {copy.title}
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            {copy.description}
          </p>
          <div className="mt-3">
            <LearningTrackQuickLinks locale={uiLocale} />
          </div>
          <div className="mt-3">
            <LearningTrackMapSummary overview={overview} locale={uiLocale} />
          </div>
        </header>

        <PageIllustrationStrip
          surface="learn/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '专题路径',
            'zh-Hant': '專題路徑',
            en: 'Learning tracks',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />

        <LearningTrackMapGrid overview={overview} locale={uiLocale} />

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkKnowledge}
          </Link>
          <Link href="/cases" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkCases}
          </Link>
          <Link href="/world-yi" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkWorldYi}
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkTeachers}
          </Link>
        </nav>
      </div>
    </AppPage>
  );
}
