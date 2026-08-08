import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import {
  AlmanacDayStripFrame,
  AstroRankingFrame,
  AstroStanceIcon,
} from '@/components/astro/astro-data-frames';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildDayComparePack } from '@/lib/astro/day-compare-engine';
import { formatZhDate, isValidIsoDate, rollingIsoDates, shiftIsoDate } from '@/lib/astro/daily-window';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ date: string }> };

export function generateStaticParams() {
  return rollingIsoDates(10, 10).map((date) => ({ date }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  if (!isValidIsoDate(date)) return { title: '星座日运对比' };
  const zh = formatZhDate(date);
  return buildPageMetadata({
    title: `${zh}十二星座运势对比｜引擎排名｜人生K线`,
    description: `${zh}用同一匹配引擎给十二星座与星区样本打分排序，附通书日柱与宜忌。`,
    path: `/astro/day/${date}/compare`,
  });
}

function stanceZh(s: string) {
  if (s === 'push') return '可推进';
  if (s === 'conserve') return '宜守成';
  return '稳节奏';
}

export default async function DayComparePage({ params }: Props) {
  const { date } = await params;
  if (!isValidIsoDate(date)) notFound();
  const pack = buildDayComparePack(date);
  if (!pack) notFound();
  const zh = formatZhDate(date);
  const path = `/astro/day/${date}/compare`;

  return (
    <AppPage header={{ ctaHref: `/almanac/${date}`, ctaLabel: '当日黄历', compact: true }}>
      <AnalyticsPageView eventName="astro_day_compare" page={path} meta={{ date }} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '星座', path: '/astro' },
          { name: zh, path: `/astro/day/${date}` },
          { name: '对比', path },
        ])}
      />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <header>
          <p className="text-[11px] font-bold text-[color:var(--brand)]">DAY COMPARE · ENGINE</p>
          <h1 className="mt-1 text-[24px] font-black text-[color:var(--ink-1)]">{zh} · 十二星座对比</h1>
          <p className="mt-2 text-[13px] text-[color:var(--ink-4)]">
            流日 <strong>{pack.dayGanZhi}</strong> · 农历{pack.lunarText} · 宜 {pack.yi.slice(0, 4).join('、') || '—'}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
            <Link href={`/astro/day/${shiftIsoDate(date, -1)}/compare`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              ← 前一日
            </Link>
            <Link href={`/astro/day/${date}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              当日入口
            </Link>
            <Link href={`/astro/day/${shiftIsoDate(date, 1)}/compare`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              后一日 →
            </Link>
            <Link href={`/almanac/${date}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              黄历
            </Link>
          </div>
        </header>

        <AlmanacDayStripFrame
          title={`${zh} 通书条`}
          dayGanZhi={pack.dayGanZhi}
          lunarText={pack.lunarText}
          yi={pack.yi}
          ji={pack.ji}
        />
        <AstroRankingFrame
          title="十二星座引擎排名"
          eyebrow="DAY RANK"
          subtitle={`${date} · 同分可并列 · 点表进入证据页`}
          rows={pack.signs.map((r) => ({
            key: r.key,
            title: r.title,
            score: r.composite,
            stance: r.stance,
          }))}
        />

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">今日相对较顺（前三）</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.topSigns.map((r) => (
                <li key={r.key} className="flex items-center gap-2">
                  <AstroStanceIcon stance={r.stance} />
                  <Link href={r.href} className="font-semibold text-emerald-950 underline-offset-2 hover:underline">
                    {r.title} · {r.composite} · {stanceZh(r.stance)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">今日宜谨慎（后三）</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.lowSigns.map((r) => (
                <li key={r.key} className="flex items-center gap-2">
                  <AstroStanceIcon stance={r.stance} />
                  <Link href={r.href} className="font-semibold text-amber-950 underline-offset-2 hover:underline">
                    {r.title} · {r.composite} · {stanceZh(r.stance)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold">十二星座完整排名</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[color:var(--hairline)] text-[color:var(--ink-5)]">
                  <th className="py-2 pr-2">星座</th>
                  <th className="py-2 pr-2">综合</th>
                  <th className="py-2 pr-2">结构</th>
                  <th className="py-2 pr-2">表达</th>
                  <th className="py-2">立场</th>
                </tr>
              </thead>
              <tbody>
                {[...pack.signs]
                  .sort((a, b) => b.composite - a.composite)
                  .map((r) => (
                    <tr key={r.key} className="border-b border-[color:var(--hairline)]/60">
                      <td className="py-2 pr-2">
                        <Link href={r.href} className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-2 font-black tabular-nums">{r.composite}</td>
                      <td className="py-2 pr-2 tabular-nums">{r.structure}</td>
                      <td className="py-2 pr-2 tabular-nums">{r.expression}</td>
                      <td className="py-2">{stanceZh(r.stance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold">48 星区 · 三区样本（主气质）</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pack.zoneSamples.map((z) => (
              <li key={z.key}>
                <Link
                  href={z.href}
                  className="block rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 no-underline hover:border-[color:var(--brand)]/40"
                >
                  <span className="font-bold text-[color:var(--ink-1)]">{z.title}</span>
                  <span className="ml-2 tabular-nums text-[color:var(--brand)]">{z.composite}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[11px] text-[color:var(--ink-5)]">
          排名来自确定性引擎（通书×元素队列），用于节奏对比，不构成医疗投资建议。
        </p>
      </div>
    </AppPage>
  );
}
