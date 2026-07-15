export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LearningTrackStepList } from '@/components/learning-track-map';
import { AppPage } from '@/components/layout/app-page';
import { getLearningTracksOverview } from '@/lib/learning-track-stats';
import { getLearningTrack, type LearningTrackKey } from '@/lib/learning-tracks';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackParam } = await params;
  if (!TRACK_KEYS.has(trackParam as LearningTrackKey)) {
    return { title: '专题未找到 | 人生K线' };
  }
  const track = getLearningTrack(trackParam as LearningTrackKey);
  return {
    title: `${track.title} | 人生K线`,
    description: track.description,
    alternates: { canonical: `/learn/${track.key}` },
  };
}

export default async function LearnTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackParam } = await params;
  if (!TRACK_KEYS.has(trackParam as LearningTrackKey)) {
    notFound();
  }

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

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始判断', compact: true }}>
      <AnalyticsPageView
        eventName="learn_track_viewed"
        page={`/learn/${track.key}`}
        meta={{ surfaceKey: 'learning_track', trackKey: track.key }}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <div className="text-[13px]">
          <Link href="/learn" className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
            专题
          </Link>
          <span className="mx-1.5 text-[color:var(--ink-5)]">/</span>
          <span className="text-[color:var(--ink-2)]">{track.title}</span>
        </div>

        <header className="border-b border-[color:var(--hairline)] pb-4">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]">
            {track.title}
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
            {track.description}
            {track.progress
              ? ` · ${track.progress.publishedStepCount}/${track.progress.totalStepCount} 步 · 约 ${track.progress.totalReadMinutes} 分钟`
              : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {track.steps[0] ? (
              <Link
                href={track.steps[0].href}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                从第一步开始
              </Link>
            ) : null}
            {track.hubHref ? (
              <Link
                href={track.hubHref}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                专题入口
              </Link>
            ) : null}
            <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              生成报告
            </Link>
          </div>
        </header>

        <LearningTrackStepList track={track} />

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            事件本
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            请老师
          </Link>
          <Link href="/chat" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            对话
          </Link>
        </nav>
      </div>
    </AppPage>
  );
}
