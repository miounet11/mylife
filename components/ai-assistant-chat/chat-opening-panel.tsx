'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, Sparkles, Zap } from 'lucide-react';
import type { TeacherOpeningView } from '@/lib/teacher-opening';
import type { TeacherTopicChip } from '@/lib/teachers';

/** How long to emphasize the first starter after open (ms). */
const FIRST_STARTER_PULSE_MS = 5000;

/**
 * Empty-state consultant opening: first_mes bubble + topic chips + user starters.
 * Compact vertical stack for the messenger shell (no double cards / no layout thrash).
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
  hideFirstMes?: boolean;
}) {
  const { teacher, firstMes, starters, chips, greetingIndex, greetingCount, hasReportSlots } =
    opening;

  const [pulseFirst, setPulseFirst] = useState(true);
  useEffect(() => {
    setPulseFirst(true);
    const t = window.setTimeout(() => setPulseFirst(false), FIRST_STARTER_PULSE_MS);
    return () => window.clearTimeout(t);
  }, [teacher.id, firstMes, starters[0]]);

  const greetingSwap =
    greetingCount > 1 ? (
      <button
        type="button"
        disabled={disabled}
        onClick={onSwapGreeting}
        className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium text-[#3b5998] hover:bg-white/80 active:opacity-70 disabled:opacity-50"
      >
        <RefreshCw className="h-3 w-3" />
        换开场 {greetingIndex + 1}/{greetingCount}
      </button>
    ) : null;

  return (
    <div className="space-y-2">
      {!hideFirstMes ? (
        <div className="flex justify-start">
          <div className="max-w-[min(100%,28rem)] rounded-[16px] bg-[#f1f0f0] px-3.5 py-2.5 text-[14px] text-[#1d2129]">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-semibold text-[#1d2129]">{teacher.name}</span>
              <span className="rounded-[3px] bg-white/90 px-1.5 py-px text-[10px] font-semibold text-[#606770]">
                开场
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[13.5px] leading-[1.5] text-[#1d2129]">
              {firstMes}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8d91]">
              <span className="truncate">{teacher.tagline}</span>
              {greetingSwap}
            </div>
          </div>
        </div>
      ) : greetingSwap ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a8d91]">
          <span>
            {teacher.name} · {teacher.tagline}
          </span>
          {greetingSwap}
        </div>
      ) : null}

      {chips.length > 0 && hasReportSlots ? (
        <div className="px-0.5">
          <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#606770]">
            <Sparkles className="h-3 w-3 text-[#3b5998]" />
            议题
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const active =
                (chip.teacherId || chip.id) === teacher.id || chip.id === teacher.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChip(chip)}
                  className={`min-h-[36px] touch-manipulation rounded-full border px-2.5 py-1 text-[12px] font-medium transition active:opacity-70 disabled:opacity-50 ${
                    active
                      ? 'border-[#3b5998] bg-[#e7f3ff] text-[#3b5998]'
                      : 'border-[#e4e6eb] bg-white text-[#1d2129] hover:border-[#3b5998]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {starters.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <div className="text-[11px] font-semibold text-[#606770]">一键开口</div>
            {pulseFirst ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#3b5998]">
                <Zap className="h-3 w-3" />
                推荐先点第一条
              </span>
            ) : null}
          </div>
          {/* Persistent primary CTA — always one clear tap target */}
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onStarter(starters[0], {
                source: pulseFirst ? 'opening_starter_primary' : 'opening_starter_cta_bar',
              })
            }
            className="flex min-h-[48px] w-full touch-manipulation items-center justify-between gap-2 rounded-[10px] border border-[#3b5998] bg-[#3b5998] px-3.5 py-2.5 text-left text-[13.5px] font-semibold leading-[1.4] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition active:opacity-90 disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 line-clamp-2">{starters[0]}</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold">
              发送
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="grid grid-cols-1 gap-1.5">
            {starters.slice(1).map((text) => (
              <button
                key={text}
                type="button"
                disabled={disabled}
                onClick={() => onStarter(text, { source: 'opening_starter' })}
                className="min-h-[40px] w-full touch-manipulation rounded-[8px] border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-2 text-left text-[13px] leading-[1.45] text-[#1d2129] transition hover:border-[#3b5998] hover:bg-[#e7f3ff] active:opacity-70 disabled:opacity-50"
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
