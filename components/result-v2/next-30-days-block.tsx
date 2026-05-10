import type { TimingPoint } from '@/lib/life-timing/types';
import TimingPointCard from './timing-point-card';

interface Props {
  points: TimingPoint[];
}

export default function Next30DaysBlock({ points }: Props) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        未来 30 天
      </div>
      <h3 className="mt-1 text-lg md:text-xl font-bold text-[color:var(--ink-1)]">
        {points.length > 0
          ? `你会有 ${points.length} 个值得留意的时点`
          : '这一段相对平稳'}
      </h3>
      {points.length > 0 && (
        <div className="mt-4 space-y-3">
          {points.map((p) => <TimingPointCard key={p.id} point={p} />)}
        </div>
      )}
    </section>
  );
}
