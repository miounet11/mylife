'use client';

import { useEffect, useRef, useState } from 'react';

type AutoAdvanceToastProps = {
  durationMs: number;
  onCancel: () => void;
  onComplete: () => void;
};

export default function AutoAdvanceToast({
  durationMs,
  onCancel,
  onComplete,
}: AutoAdvanceToastProps) {
  const [remaining, setRemaining] = useState(durationMs);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);

  // Always keep refs pointing at latest callbacks without re-running the timer
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCancelRef.current = onCancel;
  }, [onComplete, onCancel]);

  useEffect(() => {
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(interval);
        onCompleteRef.current();
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [durationMs]);

  const percent = Math.max(0, Math.min(100, (remaining / durationMs) * 100));

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        rounded-[var(--radius)] border border-[color:var(--brand)]/30
        bg-[color:var(--brand-soft)] px-3 py-2
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs leading-5 text-[color:var(--ink-2)]">
          已确认出生时间，{Math.ceil(remaining / 1000)} 秒后自动打开出生地点选择
        </div>
        <button
          type="button"
          onClick={() => onCancelRef.current()}
          className="
            rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)]
            px-3 py-1 text-[12px] font-semibold text-[color:var(--ink-2)]
            transition hover:border-[color:var(--ink-3)]
          "
        >
          留在当前
        </button>
      </div>
      <div className="relative mt-2 h-px bg-[color:var(--hairline)]">
        <div
          className="absolute left-0 top-0 h-px bg-[color:var(--brand)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
