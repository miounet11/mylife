export const fetchCache = 'force-no-store';
export const revalidate = 0;

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LearningTrackStepList } from '@/components/learning-track-map';
import { AppPage } from '@/components/layout/app-page';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { learnTrackPageCopy, presentTrack } from '@/lib/i18n/learn-copy';
import { getLearningTracksOverview } from '@/lib/learning-track-stats';
import { getLearningTrack, type LearningTrackKey } from '@/lib/learning-tracks';
import { buildPageMetadata, withLocalePrefix } from '@/lib/seo';

const TRACK_KEYS = new Set<LearningTrackKey>([
  'intro',
  'career',
  'wealth',
  'relationship',
  'family',
  'health',
  'migration',
  'application',
  'classics',
]);

interface LearnTrackPageProps {
  params: Promise<{ track: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: LearnTrackPageProps): Promise<Metadata> {
  const { track: trackParam } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const copy = learnTrackPageCopy(locale);

  if (!TRACK_KEYS.has(trackParam as LearningTrackKey)) {
    return { title: copy.notFoundTitle };
  }

  const track = getLearningTrack(trackParam as LearningTrackKey);
  const presented = presentTrack(track, locale);
  return buildPageMetadata({
    title: `${presented.title} | ${copy.metaTitleSuffix}`,
    description: presented.description,
    path: withLocalePrefix(`/learn/${track.key}`, locale),
    locale,
  });
}

export default async function LearnTrackPage({ params, searchParams }: LearnTrackPageProps) {
  const { track: trackParam } = await params;
  if (!TRACK_KEYS.has(trackParam as LearningTrackKey)) {
    notFound();
  }

  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = learnTrackPageCopy(uiLocale);

  const overview = getLearningTracksOverview();
  const track =
    overview.tracks.find((item) => item.key === trackParam) || {
      ...getLearningTrack(trackParam as LearningTrackKey),
      progress: {
        key: trackParam as LearningTrackKey,
        publishedStepCount: 0,
        totalStepCount: 0,
        requiredStepCount: 0,
        requiredPublishedCount: 0,
        completionRate: 0,
        isLearnable: false,
        totalReadMinutes: 0,
      },
    };

  const presented = presentTrack(track, uiLocale);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.headerCta, compact: true }}>
      <AnalyticsPageView
        eventName="learn_track_viewed"
        page={`/learn/${track.key}`}
        meta={{ surfaceKey: 'learning_track', trackKey: track.key }}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <div className="text-[13px]">
          <Link href="/learn" className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
            {copy.backToTopics}
          </Link>
          <span className="mx-1.5 text-[color:var(--ink-5)]">/</span>
          <span className="text-[color:var(--ink-2)]">{presented.title}</span>
        </div>

        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">
            {presented.title}
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            {presented.description}
            {track.progress
              ? copy.progressSuffix(
                  track.progress.publishedStepCount,
                  track.progress.totalStepCount,
                  track.progress.totalReadMinutes,
                )
              : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {track.steps[0] ? (
              <Link
                href={track.steps[0].href}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.startFirstStep}
              </Link>
            ) : null}
            {track.hubHref ? (
              <Link
                href={track.hubHref}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.trackHub}
              </Link>
            ) : null}
            <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {copy.generateReport}
            </Link>
          </div>
        </header>

        <LearningTrackStepList track={track} locale={uiLocale} />

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkEvents}
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkTeachers}
          </Link>
          <Link href="/chat" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkChat}
          </Link>
        </nav>
      </div>
    </AppPage>
  );
}
