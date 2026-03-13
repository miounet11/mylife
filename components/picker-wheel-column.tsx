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

  useEffect(() => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0 || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const targetTop = Math.max(0, index * ROW_HEIGHT - ROW_HEIGHT * 1.5);
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [options, value]);

  return (
    <div className="min-w-0">
      <div className="mb-3 text-center text-sm text-[#666666]">{label}</div>
      <div className="relative h-[210px] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[58px] -translate-y-1/2 rounded-[8px] bg-[#f5f5f5]" />
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
                    selected ? 'text-[20px] font-bold text-[#101010]' : 'text-[14px] text-[#8b8b8b]'
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
