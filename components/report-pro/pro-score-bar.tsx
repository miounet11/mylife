export default function ProScoreBar({
  score10,
  compact,
}: {
  score10: number;
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, score10 * 10));

  return (
    <div className={`flex shrink-0 items-center gap-2 ${compact ? '' : 'min-w-[88px]'}`}>
      <div
        className={`h-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)] ${compact ? 'w-14' : 'w-16'}`}
      >
        <div
          className="h-full rounded-full bg-[color:var(--ink-1)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[12px] tabular-nums text-[color:var(--ink-5)]">
        {score10}/10
      </span>
    </div>
  );
}
