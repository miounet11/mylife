'use client';

type BirthTimeCardProps = {
  label: string;
  confirmed: boolean;
  unknownHour: boolean;
  onOpen: () => void;
  onToggleUnknown: () => void;
};

export default function BirthTimeCard({
  label,
  confirmed,
  unknownHour,
  onOpen,
  onToggleUnknown,
}: BirthTimeCardProps) {
  const dataState = confirmed ? 'confirmed' : 'empty';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`出生时间：${label || '请选择'}`}
        data-state={dataState}
        className="
          group w-full rounded-md border px-4 md:px-5 py-4 md:py-5 text-left
          bg-[color:var(--paper)] transition-all duration-150 active:translate-y-px
          border-[color:var(--hairline)] text-[color:var(--ink-2)]
          hover:border-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/35
          data-[state=confirmed]:border-[color:var(--brand)] data-[state=confirmed]:text-[color:var(--ink-1)]
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--ink-4)]">
            出生时间
          </div>
          <span
            className={`text-[10px] tracking-[0.08em] uppercase ${
              confirmed
                ? 'text-[color:var(--brand-strong)]'
                : 'text-[color:var(--ink-5)]'
            }`}
          >
            {confirmed ? '已确认' : '待确认'}
          </span>
        </div>
        <div className="mt-1.5 truncate font-mono text-[20px] md:text-[26px] leading-[1.15] tracking-[0.01em]">
          {label || '点击选择出生时间'}
        </div>
        <div className="mt-1 text-xs text-[color:var(--ink-5)]">
          支持公历 / 农历 / 四柱
        </div>
      </button>

      <button
        type="button"
        onClick={onToggleUnknown}
        aria-pressed={unknownHour}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
          unknownHour
            ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
            : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]'
        }`}
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            unknownHour ? 'bg-[color:var(--signal-strong)]' : 'bg-[color:var(--ink-5)]'
          }`}
        />
        时辰未知
      </button>
    </div>
  );
}
