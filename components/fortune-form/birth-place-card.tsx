'use client';

type BirthPlaceCardProps = {
  label: string;
  confirmed: boolean;
  bjTime: boolean;
  onOpen: () => void;
};

export default function BirthPlaceCard({
  label,
  confirmed,
  bjTime,
  onOpen,
}: BirthPlaceCardProps) {
  const dataState = confirmed ? 'confirmed' : 'empty';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`出生地点：${label || '请选择'}`}
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
            出生地点
          </div>
          <div className="flex items-center gap-2">
            {bjTime ? (
              <span className="rounded-sm border border-[color:var(--env)]/30 bg-[color:var(--env-soft)] px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase text-[color:var(--env)]">
                北京时间
              </span>
            ) : null}
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
        </div>
        <div className="mt-1.5 truncate font-mono text-[20px] md:text-[26px] leading-[1.15] tracking-[0.01em]">
          {label || '点击选择出生地点'}
        </div>
        <div className="mt-1 text-xs text-[color:var(--ink-5)]">
          {bjTime ? '地点仅用于地理校正（可选）' : '影响真太阳时与时区校正'}
        </div>
      </button>
    </div>
  );
}
