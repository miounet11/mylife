'use client';

import { useEffect, useRef } from 'react';

export interface PickerWheelOption {
  label: string;
  value: string;
}

interface PickerWheelColumnProps {
  label: string;
  options: PickerWheelOption[];
  value: string;
  onChange: (nextValue: string) => void;
}

const ROW_HEIGHT = 44;

export default function PickerWheelColumn({
  label,
  options,
  value,
  onChange,
}: PickerWheelColumnProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef<number | null>(null);

  useEffect(() => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0 || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const targetTop = Math.max(0, index * ROW_HEIGHT - ROW_HEIGHT * 1.5);
    if (lastScrollTopRef.current === targetTop) {
      return;
    }

    lastScrollTopRef.current = targetTop;
    container.scrollTop = targetTop;
  }, [options, value]);

  return (
    <div className="min-w-0">
      <div className="mb-3 text-center text-sm text-[color:var(--muted)]">{label}</div>
      <div className="relative h-[210px] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[58px] -translate-y-1/2 rounded-[12px] bg-[color:var(--accent-soft)]" />
        <div
          ref={containerRef}
          className="relative h-full overflow-y-auto px-1 pb-[66px] pt-[66px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-0">
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={`${label}-${option.value}`}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`relative z-20 flex h-[44px] w-full items-center justify-center text-center transition ${
                    selected ? 'text-[20px] font-bold text-[color:var(--ink)]' : 'text-[14px] text-[color:var(--muted)] opacity-80'
                  }`}
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
