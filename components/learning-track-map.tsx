import Link from 'next/link';
import type { LearningTracksOverview } from '@/lib/learning-track-stats';
import type { LearningTrack } from '@/lib/learning-tracks';
import { learnPageCopy, presentTrack } from '@/lib/i18n/learn-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

function LearningTrackRow({
  track,
  locale,
}: {
  track: LearningTrack & { progress: LearningTracksOverview['tracks'][number]['progress'] };
  locale: SiteLocale;
}) {
  const href = `/learn/${track.key}`;
  const presented = presentTrack(track, locale);
  const copy = learnPageCopy(locale);
  return (
    <Link
      href={href}
      className="group flex flex-col gap-0.5 border-b border-[color:var(--hairline)] py-3 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
    >
      <div className="min-w-0">
        <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
          {presented.title}
        </span>
        <span className="ml-2 text-[12px] text-[color:var(--ink-5)]">{presented.subtitle}</span>
      </div>
      <span className="shrink-0 text-[12px] text-[color:var(--ink-5)]">
        {copy.stepsMinutes(
          track.progress.publishedStepCount,
          track.progress.totalStepCount,
          track.progress.totalReadMinutes,
        )}
      </span>
    </Link>
  );
}

export function LearningTrackMapGrid({
  overview,
  locale = 'zh-CN',
}: {
  overview: LearningTracksOverview;
  compact?: boolean;
  locale?: SiteLocale;
}) {
  return (
    <div className="border-t border-[color:var(--hairline)]">
      {overview.tracks.map((track) => (
        <LearningTrackRow key={track.key} track={track} locale={locale} />
      ))}
    </div>
  );
}

export function LearningTrackMapSummary({
  overview,
  locale = 'zh-CN',
}: {
  overview: LearningTracksOverview;
  locale?: SiteLocale;
}) {
  const learnableCount = overview.tracks.filter((track) => track.progress.isLearnable).length;
  const copy = learnPageCopy(locale);
  return (
    <p className="text-[13px] text-[color:var(--ink-5)]">
      {copy.summaryAvailable(learnableCount, overview.tracks.length)}
    </p>
  );
}

export function LearningTrackQuickLinks({ locale = 'zh-CN' }: { locale?: SiteLocale }) {
  const copy = learnPageCopy(locale);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
      <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        {copy.quickGenerate}
      </Link>
      <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        {copy.linkKnowledge}
      </Link>
      <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        {copy.linkTeachers}
      </Link>
    </div>
  );
}

export function LearningTrackStepList({
  track,
  locale = 'zh-CN',
}: {
  track: LearningTrack & { progress?: LearningTracksOverview['tracks'][number]['progress'] };
  locale?: SiteLocale;
}) {
  const copy = learnPageCopy(locale);
  return (
    <ol className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
      {track.steps.map((step, index) => (
        <li key={step.key}>
          <Link
            href={step.href}
            className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
          >
            <span className="min-w-0 text-[13px] text-[color:var(--ink-1)] hover:underline">
              <span className="mr-2 tabular-nums text-[color:var(--ink-5)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              {step.label}
            </span>
            <span className="shrink-0 text-[12px] text-[color:var(--ink-5)]">
              {step.readMinutes ? copy.minutesShort(step.readMinutes) : ''}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
