'use client';

import type { ProgressSegment } from '@/lib/paipan-form';

type EntryProgressBarProps = {
  segments: ProgressSegment[];
};

export default function EntryProgressBar({ segments }: EntryProgressBarProps) {
  const total = segments.length;
  const doneCount = segments.filter((s) => s.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const currentIndex = segments.findIndex((s) => !s.done);
  const currentLabel = currentIndex === -1 ? '已可开始分析' : segments[currentIndex].label;

  return (
    <div
      role="progressbar"
      aria-valuenow={doneCount}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`录入进度，第 ${doneCount} / ${total} 步：${currentLabel}`}
      className="space-y-2"
    >
      <div className="relative">
        <div className="h-px bg-[color:var(--hairline)]" />
        <div
          className="absolute left-0 top-0 h-px bg-[color:var(--brand)] transition-all duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* < 360px：退化为 Step X/N + 进度条 */}
      <div className="flex items-center justify-between text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)] xs:hidden">
        <span>
          Step {Math.max(1, currentIndex === -1 ? total : currentIndex + 1)}/{total}
        </span>
        <span className="font-mono text-[color:var(--ink-2)]">{currentLabel}</span>
      </div>

      {/* ≥ 360px：三段刻度 */}
      <div
        className="hidden grid-cols-3 gap-2 text-xs tracking-[0.08em] uppercase xs:grid"
        aria-hidden
      >
        {segments.map((seg, idx) => {
          const isCurrent = idx === currentIndex;
          const tone = seg.done
            ? 'text-[color:var(--ink-1)]'
            : isCurrent
              ? 'text-[color:var(--ink-1)]'
              : 'text-[color:var(--ink-4)]';
          const align = idx === 0 ? '' : idx === total - 1 ? 'text-right' : 'text-center';
          return (
            <span key={seg.key} className={`${tone} ${align}`}>
              {`${idx + 1}. ${seg.label}`}
              {seg.done ? ' ✓' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}
