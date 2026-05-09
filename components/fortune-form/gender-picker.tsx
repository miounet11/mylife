'use client';

type GenderPickerProps = {
  value: 0 | 1;
  onChange: (next: 0 | 1) => void;
};

const OPTIONS: Array<{ label: string; value: 0 | 1 }> = [
  { label: '男', value: 1 },
  { label: '女', value: 0 },
];

export default function GenderPicker({ value, onChange }: GenderPickerProps) {
  return (
    <div className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 md:py-3">
      <div className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--ink-4)]">性别</div>
      <div
        role="radiogroup"
        aria-label="性别"
        className="mt-2 inline-flex rounded-full border border-[color:var(--hairline)] bg-[color:var(--paper)] p-1"
      >
        {OPTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            role="radio"
            aria-checked={value === item.value}
            onClick={() => onChange(item.value)}
            className={`min-h-11 min-w-[72px] rounded-full px-5 text-sm font-semibold transition ${
              value === item.value
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
