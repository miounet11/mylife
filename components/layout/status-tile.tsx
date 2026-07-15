import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'accent' | 'success' | 'warning';

const toneClass: Record<StatusTone, string> = {
  neutral: 'bg-[color:var(--paper)] text-[color:var(--ink-1)]',
  accent: 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]',
  success: 'bg-[color:var(--success-soft)] text-[color:var(--success)]',
  warning: 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]',
};

export function StatusTile({
  label,
  value,
  helper,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 rounded-[var(--radius)] px-4 py-5', toneClass[tone], className)}>
      <div className="text-xs font-medium tracking-[0.06em] break-words">{label}</div>
      <div className="mt-2 break-words text-2xl font-black leading-tight">{value}</div>
      {helper ? <div className="mt-2 text-xs leading-6 opacity-85 break-words">{helper}</div> : null}
    </div>
  );
}