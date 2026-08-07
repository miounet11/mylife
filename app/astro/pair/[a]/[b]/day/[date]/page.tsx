import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { formatZhDate, isValidIsoDate, rollingIsoDates, shiftIsoDate } from '@/lib/astro/daily-window';
import { buildAstroPairDayPack } from '@/lib/astro/pair-day-engine';
import { allPairKeyCombos, canonicalPairKeys } from '@/lib/astro/pair-engine';
import { getSignByKey } from '@/lib/astro/signs-data';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ a: string; b: string; date: string }> };

export function generateStaticParams() {
  // Bound: popular pairs (same element + catalog pairs) × short window
  const dates = rollingIsoDates(2, 2);
  const pairs = allPairKeyCombos().filter(({ a, b }) => a !== b).slice(0, 24);
  return pairs.flatMap(({ a, b }) => dates.map((date) => ({ a, b, date })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b, date } = await params;
  const keys = canonicalPairKeys(a, b);
  if (!keys || !isValidIsoDate(date)) return { title: '合盘日运' };
  const pack = buildAstroPairDayPack(date, keys[0], keys[1]);
  if (!pack) return { title: '合盘日运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/pair/${keys[0]}/${keys[1]}/day/${date}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

function stanceZh(s: string) {
  if (s === 'push') return '可推进';
  if (s === 'conserve') return '宜守成';
  return '稳节奏';
}

export default async function PairDayPage({ params }: Props) {
  const { a, b, date } = await params;
  if (!getSignByKey(a) || !getSignByKey(b) || !isValidIsoDate(date)) notFound();
  const keys = canonicalPairKeys(a, b)!;
  if (a !== keys[0] || b !== keys[1]) {
    redirect(`/astro/pair/${keys[0]}/${keys[1]}/day/${date}`);
  }
  const pack = buildAstroPairDayPack(date, keys[0], keys[1]);
  if (!pack) notFound();
  const path = `/astro/pair/${keys[0]}/${keys[1]}/day/${date}`;
  const zh = formatZhDate(date);
  const sa = getSignByKey(keys[0])!;
  const sb = getSignByKey(keys[1])!;

  return (
    <AppPage header={{ ctaHref: '/hehun?source=astro_pair_day', ctaLabel: '合婚双盘', compact: true }}>
      <AnalyticsPageView
        eventName="astro_pair_day"
        page={path}
        meta={{ a: keys[0], b: keys[1], date, score: pack.combined.score }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '星座', path: '/astro' },
          { name: '配对', path: '/astro/pair' },
          { name: pack.title.split(' · ')[0], path: pack.pairPath },
          { name: date, path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: pack.seo.title,
          description: pack.seo.description,
          path,
          keywords: pack.seo.keywords,
        })}
      />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <header className="rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-violet-50/80 via-white to-[color:var(--paper)] p-5">
          <p className="text-[11px] font-bold tracking-wide text-violet-700">PAIR DAY · 合盘日运</p>
          <h1 className="mt-1 text-[22px] font-black text-[color:var(--ink-1)] md:text-[26px]">
            {sa.symbol}
            {sa.zh} × {sb.symbol}
            {sb.zh}
            <span className="mt-1 block text-[16px] font-semibold text-[color:var(--ink-3)] md:mt-0 md:ml-2 md:inline">
              {zh}
            </span>
          </h1>
          <p className="mt-3 text-[15px] font-medium text-[color:var(--ink-2)]">{pack.combined.headline}</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <div className="text-[11px] text-[color:var(--ink-5)]">合盘综合</div>
              <div className="text-[36px] font-black text-[color:var(--brand)]">{pack.combined.score}</div>
            </div>
            <div className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-[12px] font-bold text-[color:var(--brand-strong)]">
              {stanceZh(pack.combined.stance)}
            </div>
            <div className="text-[12px] text-[color:var(--ink-5)]">
              配对基线 {pack.pairScore} · 结构层
            </div>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href={pack.aDaily.href}
            className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm hover:border-[color:var(--brand)]/40"
          >
            <div className="text-[12px] text-[color:var(--ink-5)]">{sa.zh}今日</div>
            <div className="mt-1 text-[28px] font-black text-[color:var(--brand)]">{pack.aDaily.composite}</div>
            <div className="text-[12px] font-semibold">{stanceZh(pack.aDaily.stance)}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{pack.aDaily.mood}</p>
          </Link>
          <Link
            href={pack.bDaily.href}
            className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 no-underline shadow-sm hover:border-[color:var(--brand)]/40"
          >
            <div className="text-[12px] text-[color:var(--ink-5)]">{sb.zh}今日</div>
            <div className="mt-1 text-[28px] font-black text-[color:var(--brand)]">{pack.bDaily.composite}</div>
            <div className="text-[12px] font-semibold">{stanceZh(pack.bDaily.stance)}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{pack.bDaily.mood}</p>
          </Link>
        </div>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[13px] font-bold">证据链</h2>
          <ul className="mt-2 space-y-1.5 text-[12px] text-[color:var(--ink-3)]">
            {pack.combined.evidence.map((e) => (
              <li key={e.code}>
                <span className="font-mono text-[10px] text-[color:var(--ink-5)]">{e.code}</span> · {e.label}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">今日可借力</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-emerald-950/90">
              {pack.combined.favors.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">今日宜注意</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-amber-950/90">
              {pack.combined.watchouts.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          <p>{pack.elementNote}</p>
          <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">{pack.worldYi}</p>
        </section>

        <nav className="flex flex-wrap gap-3 text-[13px]">
          <Link href={`/astro/pair/${keys[0]}/${keys[1]}/day/${shiftIsoDate(date, -1)}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            ← 前一日
          </Link>
          <Link href={`/astro/pair/${keys[0]}/${keys[1]}/day/${shiftIsoDate(date, 1)}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            后一日 →
          </Link>
          <Link href={pack.pairPath} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            配对结构
          </Link>
          <Link href={pack.almanacPath} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            当日黄历
          </Link>
          <Link href="/hehun?source=astro_pair_day" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            合婚双盘
          </Link>
        </nav>
        <p className="text-[11px] text-[color:var(--ink-5)]">
          合盘日运 = 配对结构 + 双方当日引擎分。不等于现实关系命运；深度请用合婚或结构报告。
        </p>
      </div>
    </AppPage>
  );
}
