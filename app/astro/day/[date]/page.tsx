import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { ASTRO_ZONES_48 } from '@/lib/astro/zones-48';
import { formatZhDate, isValidIsoDate, rollingIsoDates } from '@/lib/astro/daily-window';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ date: string }> };

export function generateStaticParams() {
  return rollingIsoDates(7, 7).map((date) => ({ date }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  if (!isValidIsoDate(date) || !buildAlmanacDayPack(date)) {
    return { title: '星座日运' };
  }
  const zh = formatZhDate(date);
  return buildPageMetadata({
    title: `${zh}十二星座与48星区运势入口｜通书匹配｜人生K线`,
    description: `${zh}按星座/星区/上升查看引擎匹配日运；通书宜忌与结构队列同一数据源。`,
    path: `/astro/day/${date}`,
  });
}

export default async function AstroDayHubPage({ params }: Props) {
  const { date } = await params;
  if (!isValidIsoDate(date)) notFound();
  const pack = buildAlmanacDayPack(date);
  if (!pack) notFound();
  const zh = formatZhDate(date);
  const path = `/astro/day/${date}`;

  return (
    <AppPage header={{ ctaHref: `/almanac/${date}`, ctaLabel: '当日黄历', compact: true }}>
      <AnalyticsPageView eventName="astro_day_hub" page={path} meta={{ date }} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: zh, path },
        ])}
      />
      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <header>
          <p className="text-[11px] font-bold text-[color:var(--brand)]">ASTRO × ALMANAC</p>
          <h1 className="mt-1 text-[24px] font-black text-[color:var(--ink-1)]">{zh} · 星座日运入口</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            流日日柱 <strong>{pack.lunar.dayGanZhi}</strong> · 农历{pack.lunar.lunarText}
            。以下链接均走同一匹配引擎（通书 + 表达/结构层），无空壳文。
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            <Link href={`/almanac/${date}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              万年历通书
            </Link>
            <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              生日查询
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold">十二星座 · 当日</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {ASTRO_SIGNS.map((s) => (
              <li key={s.key}>
                <Link
                  href={`/astro/signs/${s.key}/day/${date}`}
                  className="block rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 no-underline hover:border-[color:var(--brand)]/40"
                >
                  <span className="text-[14px] font-bold text-[color:var(--ink-1)]">
                    {s.symbol} {s.zh}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold">48 星区 · 当日（抽样入口）</h2>
          <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">完整 48 区均可打开 …/zones/&#123;id&#125;/day/{date}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ASTRO_ZONES_48.filter((_, i) => i % 4 === 3).map((z) => (
              <li key={z.id}>
                <Link
                  href={`/astro/zones/${z.id}/day/${date}`}
                  className="block rounded-lg border border-[color:var(--hairline)] px-3 py-2 text-[12px] no-underline hover:border-[color:var(--brand)]/40"
                >
                  <span className="font-bold text-[color:var(--ink-1)]">{z.title}</span>
                  <span className="ml-2 text-[color:var(--ink-5)]">#{z.index}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/astro/zones"
            className="mt-3 inline-block text-[12px] text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            全部 48 星区百科 →
          </Link>
        </section>
      </div>
    </AppPage>
  );
}
