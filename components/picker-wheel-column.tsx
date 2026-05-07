'use client';

import { useEffect, useMemo, useRef } from 'react';

export interface PickerWheelOption {
  label: string;
  value: string;
}

interface PickerWheelColumnProps {
  label: string;
  options: PickerWheelOption[];
  value: string;
  onChange: (nextValue: string) => void;
  compact?: boolean;
  hideLabel?: boolean;
  showHighlight?: boolean;
}

export default function PickerWheelColumn({
  label,
  options,
  value,
  onChange,
  compact = false,
  hideLabel = false,
  showHighlight = true,
}: PickerWheelColumnProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef<number | null>(null);
  const syncingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const metrics = useMemo(() => {
    const rowHeight = compact ? 38 : 44;
    const height = compact ? 174 : 210;
    const padding = (height - rowHeight) / 2;
    return { rowHeight, height, padding };
  }, [compact]);

  useEffect(() => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0 || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const targetTop = Math.max(0, index * metrics.rowHeight);
    if (lastScrollTopRef.current === targetTop) {
      return;
    }

    lastScrollTopRef.current = targetTop;
    syncingRef.current = true;
    container.scrollTop = targetTop;

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(() => {
      syncingRef.current = false;
      frameRef.current = null;
    });
  }, [metrics.rowHeight, options, value]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (syncingRef.current || !containerRef.current) {
      return;
    }

    const index = Math.max(
      0,
      Math.min(options.length - 1, Math.round(containerRef.current.scrollTop / metrics.rowHeight))
    );
    const nextValue = options[index]?.value;

    if (nextValue && nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className="min-w-0">
      {hideLabel ? null : (
        <div className={`text-center text-[color:var(--muted)] ${compact ? 'mb-1.5 text-xs' : 'mb-3 text-sm'}`}>
          {label}
        </div>
      )}
      <div className="relative overflow-hidden" style={{ height: metrics.height }}>
        {showHighlight ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-[10px] bg-[color:var(--accent-soft)]"
            style={{ height: compact ? 46 : 58 }}
          />
        ) : null}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="relative h-full snap-y snap-mandatory overflow-y-auto px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingBottom: metrics.padding, paddingTop: metrics.padding }}
        >
          <div className="space-y-0">
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={`${label}-${option.value}`}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`relative z-20 flex w-full snap-center items-center justify-center text-center transition ${
                    selected
                      ? `${compact ? 'text-[19px]' : 'text-[20px]'} font-bold text-[color:var(--ink)]`
                      : `${compact ? 'text-[13px]' : 'text-[14px]'} text-[color:var(--muted)] opacity-72`
                  }`}
                  style={{ height: metrics.rowHeight }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
