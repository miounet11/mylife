'use client';

import { useRef } from 'react';

type GenderPickerProps = {
  value: 0 | 1;
  onChange: (next: 0 | 1) => void;
};

const OPTIONS: Array<{ label: string; value: 0 | 1 }> = [
  { label: '男', value: 1 },
  { label: '女', value: 0 },
];

export default function GenderPicker({ value, onChange }: GenderPickerProps) {
  const groupRef = useRef<HTMLDivElement | null>(null);

  // v5-D10: radiogroup 键盘导航（roving tabindex），只 selected 项可 tab 到
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const idx = OPTIONS.findIndex((o) => o.value === value);
    let nextIdx = idx;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIdx = (idx + 1) % OPTIONS.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIdx = (idx - 1 + OPTIONS.length) % OPTIONS.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = OPTIONS.length - 1;
    const next = OPTIONS[nextIdx];
    if (next && next.value !== value) {
      onChange(next.value);
      // 焦点跟着选中项移动
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      buttons?.[nextIdx]?.focus();
    }
  };

  return (
    <div className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 md:py-3">
      <div className="text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)]">性别</div>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="性别"
        onKeyDown={handleKeyDown}
        className="mt-2 inline-flex rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] p-1"
      >
        {OPTIONS.map((item) => {
          const selected = value === item.value;
          return (
            <button
              key={item.label}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={`min-h-11 min-w-[72px] rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/40 ${
                selected
                  ? 'bg-[color:var(--ink-1)] text-white'
                  : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
