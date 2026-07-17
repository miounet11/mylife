'use client';

import type { TeacherOpeningView } from '@/lib/teacher-opening';
import type { TeacherTopicChip } from '@/lib/teachers';

/**
 * Mid-conversation rail: switch teacher + one-tap continuations (raise multi-turn).
 */
export function ChatMidRail({
  opening,
  disabled,
  onStarter,
  onChip,
}: {
  opening: TeacherOpeningView;
  disabled?: boolean;
  onStarter: (text: string, meta?: { source: string }) => void;
  onChip: (chip: TeacherTopicChip) => void;
}) {
  return (
    <div className="rounded-[3px] border border-[#e9ebee] bg-[#f7f8fa] px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="text-[11px] font-semibold text-[#606770]">
          当前 · {opening.teacher.name}
          <span className="ml-1 font-normal text-[#8a8d91]">卡住了？换议题或点一句</span>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {opening.chips.slice(0, 6).map((chip) => {
          const active = (chip.teacherId || chip.id) === opening.teacherId;
          return (
            <button
              key={`mid-${chip.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onChip(chip)}
              className={`min-h-[44px] touch-manipulation rounded-full border px-3 py-2 text-[11px] font-semibold active:opacity-70 disabled:opacity-50 sm:min-h-0 sm:px-2 sm:py-0.5 ${
                active
                  ? 'border-[#3b5998] bg-[#e7f3ff] text-[#3b5998]'
                  : 'border-[#dddfe2] bg-white text-[#4b4f56]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex w-full flex-col gap-1">
        {opening.continuationStarters.map((text) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onStarter(text, { source: 'mid_continuation' })}
            className="min-h-[44px] w-full touch-manipulation rounded-[6px] border border-[#dddfe2] bg-white px-2.5 py-2.5 text-left text-[12px] leading-[1.45] text-[#1d2129] hover:border-[#3b5998] active:opacity-70 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
