import Link from 'next/link';
import type { LearningTracksOverview } from '@/lib/learning-track-stats';
import type { LearningTrack } from '@/lib/learning-tracks';

function LearningTrackRow({
  track,
}: {
  track: LearningTrack & { progress: LearningTracksOverview['tracks'][number]['progress'] };
}) {
  const href = `/learn/${track.key}`;
  return (
    <Link
      href={href}
      className="group flex flex-col gap-0.5 border-b border-[color:var(--hairline)] py-3 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
    >
      <div className="min-w-0">
        <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
          {track.title}
        </span>
        <span className="ml-2 text-[12px] text-[color:var(--ink-5)]">{track.subtitle}</span>
      </div>
      <span className="shrink-0 text-[12px] text-[color:var(--ink-5)]">
        {track.progress.publishedStepCount}/{track.progress.totalStepCount} · 约 {track.progress.totalReadMinutes} 分
      </span>
    </Link>
  );
}

export function LearningTrackMapGrid({
  overview,
}: {
  overview: LearningTracksOverview;
  compact?: boolean;
}) {
  return (
    <div className="border-t border-[color:var(--hairline)]">
      {overview.tracks.map((track) => (
        <LearningTrackRow key={track.key} track={track} />
      ))}
    </div>
  );
}

export function LearningTrackMapSummary({ overview }: { overview: LearningTracksOverview }) {
  const learnableCount = overview.tracks.filter((track) => track.progress.isLearnable).length;
  return (
    <p className="text-[13px] text-[color:var(--ink-5)]">
      {learnableCount} 条可用专题 · 共 {overview.tracks.length} 条
    </p>
  );
}

export function LearningTrackQuickLinks() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
      <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        生成报告
      </Link>
      <Link href="/knowledge" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        知识库
      </Link>
      <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
        请老师
      </Link>
    </div>
  );
}

export function LearningTrackStepList({
  track,
}: {
  track: LearningTrack & { progress?: LearningTracksOverview['tracks'][number]['progress'] };
}) {
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
              {step.readMinutes ? `${step.readMinutes} 分` : ''}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
