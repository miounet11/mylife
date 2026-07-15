import type { ProPillarItem } from '@/lib/report-pro-view';

export default function ProPillarsBar({ pillars }: { pillars: ProPillarItem[] }) {
  if (!pillars.length) return null;

  return (
    <div className="overflow-hidden rounded-[12px] bg-gradient-to-r from-[#1a1f36] via-[#252b45] to-[#1a1f36] px-3 py-4 shadow-sm md:px-6 md:py-5">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {pillars.map((p) => (
          <div key={p.label} className="min-w-0 text-center">
            <div className="text-[11px] font-medium tracking-[0.12em] text-white/55 md:text-[12px]">
              {p.label}
            </div>
            <div className="mt-1.5 font-serif text-[22px] font-bold leading-none tracking-wide text-[#f5e6c8] md:text-[28px]">
              {p.ganZhi}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
