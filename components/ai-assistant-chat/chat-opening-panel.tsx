'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import type { TeacherOpeningView } from '@/lib/teacher-opening';
import type { TeacherTopicChip } from '@/lib/teachers';

/**
 * Empty-state consultant opening: first_mes bubble + topic chips + user starters.
 * When first_mes is already injected into the message timeline, pass hideFirstMes
 * to keep only chips + starters (and greeting swap).
 */
export function ChatOpeningPanel({
  opening,
  disabled,
  onStarter,
  onChip,
  onSwapGreeting,
  hideFirstMes = false,
}: {
  opening: TeacherOpeningView;
  disabled?: boolean;
  onStarter: (text: string, meta?: { source: string }) => void;
  onChip: (chip: TeacherTopicChip) => void;
  onSwapGreeting: () => void;
  /** Hide the first_mes bubble when it already lives in MessageBubble timeline. */
  hideFirstMes?: boolean;
}) {
  const { teacher, firstMes, starters, chips, greetingIndex, greetingCount } = opening;

  const greetingSwap =
    greetingCount > 1 ? (
      <button
        type="button"
        disabled={disabled}
        onClick={onSwapGreeting}
        className="inline-flex min-h-[44px] touch-manipulation items-center gap-1 rounded-[3px] border border-[#dddfe2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#3b5998] active:opacity-70 disabled:opacity-50 sm:min-h-0 sm:py-0.5"
      >
        <RefreshCw className="h-3 w-3" />
        换一种开场 ({greetingIndex + 1}/{greetingCount})
      </button>
    ) : null;

  return (
    <div className="space-y-2.5">
      {/* Assistant first message — messenger style (skipped when already in timeline) */}
      {!hideFirstMes ? (
        <div className="flex justify-start">
          <div
            className="max-w-[92%] rounded-[18px] px-4 py-2.5 text-[14px] text-[#1d2129]"
            style={{ background: '#f1f0f0' }}
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-[#1d2129]">{teacher.name}</span>
              <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">
                开场
              </span>
              <span className="text-[#8a8d91]">{teacher.tagline}</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[14px] leading-5 text-[#1d2129]">
              {firstMes}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8d91]">
              <span>结构参考 · {teacher.boundary}</span>
              {greetingSwap}
            </div>
          </div>
        </div>
      ) : greetingSwap ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a8d91]">
          <span>
            {teacher.name} · 结构参考 · {teacher.boundary}
          </span>
          {greetingSwap}
        </div>
      ) : null}

      {/* Topic chips */}
      {chips.length > 0 ? (
        <div className="rounded-[3px] border border-[#dddfe2] bg-white px-3 py-2.5">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
            <Sparkles className="h-3 w-3" />
            先选议题
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const active =
                (chip.teacherId || chip.id) === teacher.id || chip.id === teacher.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChip(chip)}
                  className={`min-h-[44px] touch-manipulation rounded-full border px-3 py-2 text-[12px] font-semibold transition active:opacity-70 disabled:opacity-50 sm:min-h-0 sm:px-2.5 sm:py-1 ${
                    active
                      ? 'border-[#3b5998] bg-[#e7f3ff] text-[#3b5998]'
                      : 'border-[#dddfe2] bg-white text-[#1d2129] hover:border-[#3b5998]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* User starters — one tap send */}
      {starters.length > 0 ? (
        <div className="rounded-[3px] border border-[#dddfe2] bg-white px-3 py-2.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
            一键开口（点了就发送）
          </div>
          <div className="mt-2 grid w-full grid-cols-1 gap-1.5">
            {starters.map((text) => (
              <button
                key={text}
                type="button"
                disabled={disabled}
                onClick={() => onStarter(text, { source: 'opening_starter' })}
                className="min-h-[44px] w-full touch-manipulation rounded-[8px] border border-[#dddfe2] bg-[#f7f8fa] px-3 py-2.5 text-left text-[13px] leading-5 text-[#1d2129] transition hover:border-[#3b5998] hover:bg-[#e7f3ff] active:opacity-70 disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
