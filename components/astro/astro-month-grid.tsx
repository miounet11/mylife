import Link from 'next/link';
import type { AstroMonthPack } from '@/lib/astro/month-engine';
import { shiftYearMonth } from '@/lib/astro/month-engine';

function stanceColor(stance: string, score: number) {
  if (stance === 'push' || score >= 62) return 'bg-emerald-50 border-emerald-200 text-emerald-950';
  if (stance === 'conserve' || score <= 42) return 'bg-amber-50 border-amber-200 text-amber-950';
  return 'bg-[color:var(--paper)] border-[color:var(--hairline)] text-[color:var(--ink-2)]';
}

export default function AstroMonthGrid({
  pack,
  basePath,
}: {
  pack: AstroMonthPack;
  /** e.g. /astro/signs/leo/month */
  basePath: string;
}) {
  const ym = `${pack.year}-${String(pack.month).padStart(2, '0')}`;
  const prev = shiftYearMonth(ym, -1);
  const next = shiftYearMonth(ym, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`${basePath}/${prev}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          ← 上月
        </Link>
        <h2 className="text-[18px] font-bold text-[color:var(--ink-1)]">
          {pack.identityLabel} · {pack.label}
        </h2>
        <Link href={`${basePath}/${next}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          下月 →
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-3 text-center">
          <div className="text-[11px] text-[color:var(--ink-5)]">月均匹配</div>
          <div className="text-[28px] font-black text-[color:var(--brand)]">{pack.avg}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[12px]">
          <div className="font-bold text-emerald-900">相对较顺日</div>
          {pack.best ? (
            <Link href={pack.best.href} className="mt-1 block text-emerald-950 underline-offset-2 hover:underline">
              {pack.best.date} · {pack.best.composite}分 · {pack.best.dayGanZhi}
            </Link>
          ) : (
            '—'
          )}
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-[12px]">
          <div className="font-bold text-amber-950">宜谨慎日</div>
          {pack.careful ? (
            <Link href={pack.careful.href} className="mt-1 block text-amber-950 underline-offset-2 hover:underline">
              {pack.careful.date} · {pack.careful.composite}分 · {pack.careful.dayGanZhi}
            </Link>
          ) : (
            '—'
          )}
        </div>
      </div>

      <p className="text-[12px] text-[color:var(--ink-4)]">
        可推进 {pack.pushDays} 天 · 宜守成 {pack.conserveDays} 天 · 点击日期打开引擎证据页
      </p>

      <div className="grid grid-cols-7 gap-1.5">
        {pack.cells.map((c) => (
          <Link
            key={c.date}
            href={c.href}
            className={`min-h-[64px] rounded-lg border p-1.5 no-underline transition hover:ring-1 hover:ring-[color:var(--brand)]/30 ${stanceColor(c.stance, c.composite)}`}
          >
            <div className="text-[12px] font-bold">{c.day}</div>
            <div className="text-[14px] font-black tabular-nums">{c.composite}</div>
            <div className="truncate text-[9px] opacity-80">{c.dayGanZhi}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
