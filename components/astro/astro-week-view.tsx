import Link from 'next/link';
import { shiftIsoWeek } from '@/lib/astro/iso-week';
import type { AstroWeekPack } from '@/lib/astro/week-types';

function stanceColor(stance: string, score: number) {
  if (stance === 'push' || score >= 62) return 'border-emerald-200 bg-emerald-50/70';
  if (stance === 'conserve' || score <= 42) return 'border-amber-200 bg-amber-50/70';
  return 'border-[color:var(--hairline)] bg-white';
}

export default function AstroWeekView({
  pack,
  basePath,
}: {
  pack: AstroWeekPack;
  basePath: string;
}) {
  const prev = shiftIsoWeek(pack.weekId, -1);
  const next = shiftIsoWeek(pack.weekId, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`${basePath}/${prev}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          ← 上周
        </Link>
        <h2 className="text-[17px] font-bold text-[color:var(--ink-1)]">
          {pack.identityLabel} · {pack.weekId}
        </h2>
        <Link href={`${basePath}/${next}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          下周 →
        </Link>
      </div>
      <p className="text-[13px] leading-relaxed text-[color:var(--ink-3)]">{pack.summary}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-3 text-center">
          <div className="text-[11px] text-[color:var(--ink-5)]">周均</div>
          <div className="text-[28px] font-black text-[color:var(--brand)]">{pack.avg}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[12px]">
          <div className="font-bold text-emerald-900">较顺日</div>
          {pack.best ? (
            <Link href={pack.best.href} className="mt-1 block underline-offset-2 hover:underline">
              {pack.best.weekday} {pack.best.date} · {pack.best.composite}
            </Link>
          ) : (
            '—'
          )}
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-[12px]">
          <div className="font-bold text-amber-950">宜慎日</div>
          {pack.careful ? (
            <Link href={pack.careful.href} className="mt-1 block underline-offset-2 hover:underline">
              {pack.careful.weekday} {pack.careful.date} · {pack.careful.composite}
            </Link>
          ) : (
            '—'
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {pack.days.map((d) => (
          <li key={d.date}>
            <Link
              href={d.href}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 no-underline ${stanceColor(d.stance, d.composite)}`}
            >
              <div>
                <span className="font-bold text-[color:var(--ink-1)]">
                  {d.weekday} · {d.date}
                </span>
                <span className="ml-2 text-[11px] text-[color:var(--ink-5)]">{d.dayGanZhi}</span>
                <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">{d.headline}</p>
              </div>
              <div className="text-[20px] font-black tabular-nums text-[color:var(--brand)]">{d.composite}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
