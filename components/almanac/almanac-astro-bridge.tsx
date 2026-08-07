import Link from 'next/link';
import { buildDayComparePack } from '@/lib/astro/day-compare-engine';
import { resolveSunSignFromDate } from '@/lib/astro/resolve';
import { resolveZoneFromDate } from '@/lib/astro/zones-48';
import { isoWeekIdFromDate } from '@/lib/astro/iso-week';

/**
 * Almanac day → astro engine entry strip (server component).
 */
export default function AlmanacAstroBridge({ date }: { date: string }) {
  const compare = buildDayComparePack(date);
  const flowSun = resolveSunSignFromDate(date);
  const flowZone = resolveZoneFromDate(date);
  const weekId = isoWeekIdFromDate(date);

  if (!compare) return null;

  return (
    <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            星座引擎 · 同日
          </p>
          <h2 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">
            通书日 × 十二星座匹配
          </h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
            与黄历同一日柱数据源；点进证据链与时辰，非空泛运势文。
          </p>
        </div>
        <Link
          href={`/astro/day/${date}/compare`}
          className="text-[12px] font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          完整排名 →
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-[12px]">
          <div className="font-bold text-emerald-900">今日相对较顺</div>
          <ul className="mt-1.5 space-y-1">
            {compare.topSigns.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="text-emerald-950 underline-offset-2 hover:underline">
                  {r.title} · {r.composite}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-[12px]">
          <div className="font-bold text-amber-950">今日宜谨慎</div>
          <ul className="mt-1.5 space-y-1">
            {compare.lowSigns.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="text-amber-950 underline-offset-2 hover:underline">
                  {r.title} · {r.composite}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-[12px]">
          <div className="font-bold text-[color:var(--ink-2)]">流日太阳 / 星区</div>
          {flowSun ? (
            <Link
              href={`/astro/signs/${flowSun.key}/day/${date}`}
              className="mt-1.5 block font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              {flowSun.symbol} {flowSun.zh} 当日
            </Link>
          ) : (
            <p className="mt-1 text-[color:var(--ink-5)]">—</p>
          )}
          {flowZone ? (
            <Link
              href={`/astro/zones/${flowZone.id}/day/${date}`}
              className="mt-1 block text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {flowZone.title}
            </Link>
          ) : null}
          {weekId && flowSun ? (
            <Link
              href={`/astro/signs/${flowSun.key}/week/${weekId}`}
              className="mt-1 block text-[11px] text-[color:var(--ink-5)] underline-offset-2 hover:underline"
            >
              本周周运 · {weekId}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Link
          href={`/astro/day/${date}`}
          className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 font-semibold no-underline hover:border-[color:var(--brand)]/40"
        >
          星座日入口
        </Link>
        {weekId ? (
          <Link
            href={`/astro/week/${weekId}`}
            className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 font-semibold no-underline hover:border-[color:var(--brand)]/40"
          >
            本周十二座对比
          </Link>
        ) : null}
        <Link
          href="/astro"
          className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 font-semibold no-underline hover:border-[color:var(--brand)]/40"
        >
          生日查我的日运
        </Link>
        <Link
          href="/astro/pair"
          className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 font-semibold no-underline hover:border-[color:var(--brand)]/40"
        >
          合盘
        </Link>
      </div>
    </section>
  );
}
