import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildWeekComparePack } from '@/lib/astro/week-compare-engine';
import {
  currentIsoWeekId,
  parseIsoWeekId,
  shiftIsoWeek,
} from '@/lib/astro/week-engine';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ weekId: string }> };

export function generateStaticParams() {
  const cur = currentIsoWeekId();
  return [-2, -1, 0, 1, 2].map((d) => ({ weekId: shiftIsoWeek(cur, d) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { weekId } = await params;
  if (!parseIsoWeekId(weekId)) return { title: '周运对比' };
  return buildPageMetadata({
    title: `${weekId}十二星座周运对比｜引擎周均分｜人生K线`,
    description: `${weekId}：十二星座周均匹配分排名、可推进/守成天数，点进各座周运与日证据页。`,
    path: `/astro/week/${weekId}`,
  });
}

function stanceZh(s: string) {
  if (s === 'push') return '偏推进';
  if (s === 'conserve') return '偏守成';
  return '偏稳健';
}

export default async function WeekHubPage({ params }: Props) {
  const { weekId } = await params;
  if (!parseIsoWeekId(weekId)) notFound();
  const pack = buildWeekComparePack(weekId);
  if (!pack) notFound();
  const path = `/astro/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView eventName="astro_week_hub" page={path} meta={{ weekId }} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '星座', path: '/astro' },
          { name: '周运', path },
        ])}
      />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <header>
          <p className="text-[11px] font-bold text-[color:var(--brand)]">WEEK COMPARE · ENGINE</p>
          <h1 className="mt-1 text-[24px] font-black text-[color:var(--ink-1)]">
            {weekId} · 十二星座周运对比
          </h1>
          <p className="mt-2 text-[13px] text-[color:var(--ink-4)]">
            {pack.label} · 周中日柱参考 {pack.midDayGanZhi}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
            <Link
              href={`/astro/week/${shiftIsoWeek(weekId, -1)}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              ← 上周
            </Link>
            <Link
              href={`/astro/week/${shiftIsoWeek(weekId, 1)}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              下周 →
            </Link>
            <Link
              href={`/astro/day/${pack.startDate}/compare`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              周一日对比
            </Link>
            <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              生日查询
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">本周均分较高</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.top.map((r) => (
                <li key={r.key}>
                  <Link href={r.href} className="font-semibold text-emerald-950 underline-offset-2 hover:underline">
                    {r.title} · 周均 {r.avg} · {stanceZh(r.dominantStance)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">本周宜更稳</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.low.map((r) => (
                <li key={r.key}>
                  <Link href={r.href} className="font-semibold text-amber-950 underline-offset-2 hover:underline">
                    {r.title} · 周均 {r.avg} · {stanceZh(r.dominantStance)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4 overflow-x-auto">
          <h2 className="text-[14px] font-bold">十二星座周排名</h2>
          <table className="mt-3 w-full min-w-[520px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-[color:var(--hairline)] text-[color:var(--ink-5)]">
                <th className="py-2 pr-2">星座</th>
                <th className="py-2 pr-2">周均</th>
                <th className="py-2 pr-2">推进天</th>
                <th className="py-2 pr-2">守成天</th>
                <th className="py-2 pr-2">较顺日</th>
                <th className="py-2">主调</th>
              </tr>
            </thead>
            <tbody>
              {[...pack.signs]
                .sort((a, b) => b.avg - a.avg)
                .map((r) => (
                  <tr key={r.key} className="border-b border-[color:var(--hairline)]/60">
                    <td className="py-2 pr-2">
                      <Link href={r.href} className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 font-black tabular-nums">{r.avg}</td>
                    <td className="py-2 pr-2 tabular-nums">{r.pushDays}</td>
                    <td className="py-2 pr-2 tabular-nums">{r.conserveDays}</td>
                    <td className="py-2 pr-2">
                      {r.bestDate ? (
                        <Link
                          href={`/astro/signs/${r.key}/day/${r.bestDate}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {r.bestDate.slice(5)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2">{stanceZh(r.dominantStance)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <p className="text-[11px] text-[color:var(--ink-5)]">
          周均来自 7 日引擎分平均；用于节奏对比，不构成医疗投资建议。
        </p>
      </div>
    </AppPage>
  );
}
