import { cn } from '@/lib/utils';

export type StatItem = {
  label: string;
  value: string | number;
  mono?: boolean;
  helper?: string;
};

export function StatGrid({
  items,
  columns = 4,
  className,
}: {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-2 md:grid-cols-3'
        : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={cn('grid gap-4', colClass, className)}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-4)]">
            {item.label}
          </div>
          <div
            className={cn(
              'text-xl font-semibold tracking-[-0.02em] text-[color:var(--ink-1)]',
              item.mono ? 'font-mono tabular-nums' : '',
            )}
          >
            {item.value}
          </div>
          {item.helper ? (
            <div className="text-[11px] leading-4 text-[color:var(--ink-4)]">{item.helper}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}