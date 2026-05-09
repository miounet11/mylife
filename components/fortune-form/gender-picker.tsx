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
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 text-[color:var(--ink)] md:rounded-[var(--radius)] md:py-3">
      <div className="text-xs font-semibold text-[color:var(--muted)]">性别</div>
      <div
        role="radiogroup"
        aria-label="性别"
        className="mt-1.5 inline-flex rounded-full border border-[#ece7da] bg-[color:var(--paper)] p-1 md:mt-2"
      >
        {OPTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            role="radio"
            aria-checked={value === item.value}
            onClick={() => onChange(item.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              value === item.value
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-[color:var(--muted)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
