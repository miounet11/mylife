import type { MajorTransition } from '@/lib/life-timing/types';

interface Props {
  transitions: MajorTransition[];
  baziPillars: string;
}

const TYPE_LABEL: Record<MajorTransition['type'], string> = {
  dayun_shift: '换大运',
  tai_sui_year: '太岁年',
  sui_yun_bing_lin: '岁运并临',
};

export default function Next5YearsBlock({ transitions, baziPillars }: Props) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        未来 5 年（大运层面）
      </div>
      <h3 className="mt-1 text-lg md:text-xl font-bold text-[color:var(--ink-1)]">
        {transitions.length === 0
          ? '未来 5 年命理层面无重大转折信号'
          : `${transitions.length} 个值得留意的关键年份`}
      </h3>
      {transitions.length > 0 && (
        <div className="mt-4 space-y-3">
          {transitions.map((t, i) => (
            <div
              key={`${t.type}_${t.year}_${i}`}
              className="flex items-baseline gap-3 text-sm"
            >
              <span className="font-mono text-[color:var(--ink-3)] w-16 flex-shrink-0">
                {t.year}
              </span>
              <span className="text-xs text-[color:var(--ink-3)] w-12 flex-shrink-0">
                {t.ageAtYear} 岁
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[color:var(--brand-soft-2)] text-[color:var(--brand-strong)] font-bold flex-shrink-0">
                {TYPE_LABEL[t.type]}
              </span>
              <span className="text-[color:var(--ink-1)] leading-6">
                {t.rawReason}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 text-xs text-[color:var(--ink-3)] border-t border-[color:var(--line)] pt-3 font-mono">
        命盘：{baziPillars}
      </div>
    </section>
  );
}
