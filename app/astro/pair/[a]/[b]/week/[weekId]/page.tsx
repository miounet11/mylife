import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { allPairKeyCombos, canonicalPairKeys } from '@/lib/astro/pair-engine';
import { buildAstroPairWeekPack } from '@/lib/astro/pair-week-engine';
import { getSignByKey } from '@/lib/astro/signs-data';
import {
  currentIsoWeekId,
  parseIsoWeekId,
  shiftIsoWeek,
} from '@/lib/astro/week-engine';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ a: string; b: string; weekId: string }> };

export function generateStaticParams() {
  const cur = currentIsoWeekId();
  const weeks = [shiftIsoWeek(cur, -1), cur];
  const pairs = allPairKeyCombos().filter(({ a, b }) => a !== b).slice(0, 20);
  return pairs.flatMap(({ a, b }) => weeks.map((weekId) => ({ a, b, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b, weekId } = await params;
  const keys = canonicalPairKeys(a, b);
  if (!keys || !parseIsoWeekId(weekId)) return { title: '合盘周运' };
  const pack = buildAstroPairWeekPack(weekId, keys[0], keys[1]);
  if (!pack) return { title: '合盘周运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/pair/${keys[0]}/${keys[1]}/week/${weekId}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

function stanceZh(s: string) {
  if (s === 'push') return '可推进';
  if (s === 'conserve') return '宜守成';
  return '稳节奏';
}

export default async function PairWeekPage({ params }: Props) {
  const { a, b, weekId } = await params;
  if (!getSignByKey(a) || !getSignByKey(b) || !parseIsoWeekId(weekId)) notFound();
  const keys = canonicalPairKeys(a, b)!;
  if (a !== keys[0] || b !== keys[1]) {
    redirect(`/astro/pair/${keys[0]}/${keys[1]}/week/${weekId}`);
  }
  const pack = buildAstroPairWeekPack(weekId, keys[0], keys[1]);
  if (!pack) notFound();
  const path = `/astro/pair/${keys[0]}/${keys[1]}/week/${weekId}`;
  const sa = getSignByKey(keys[0])!;
  const sb = getSignByKey(keys[1])!;

  return (
    <AppPage header={{ ctaHref: pack.pairPath, ctaLabel: '配对结构', compact: true }}>
      <AnalyticsPageView
        eventName="astro_pair_week"
        page={path}
        meta={{ a: keys[0], b: keys[1], weekId, avg: pack.combinedAvg }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '配对', path: '/astro/pair' },
          { name: pack.title, path: pack.pairPath },
          { name: weekId, path },
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
        <header className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-violet-700">PAIR WEEK · 合盘周运</p>
          <h1 className="mt-1 text-[22px] font-black text-[color:var(--ink-1)]">
            {sa.symbol}
            {sa.zh} × {sb.symbol}
            {sb.zh} · {weekId}
          </h1>
          <p className="mt-2 text-[13px] text-[color:var(--ink-4)]">{pack.label}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <div className="text-[11px] text-[color:var(--ink-5)]">合盘周均</div>
              <div className="text-[32px] font-black text-[color:var(--brand)]">{pack.combinedAvg}</div>
            </div>
            <div className="text-[12px] text-[color:var(--ink-4)]">
              <div>
                {sa.zh} 周均 {pack.aAvg}
              </div>
              <div>
                {sb.zh} 周均 {pack.bAvg}
              </div>
              <div>配对基线 {pack.pairScore}</div>
              <div>
                推进 {pack.pushDays} · 守成 {pack.conserveDays}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            <Link
              href={`/astro/pair/${keys[0]}/${keys[1]}/week/${shiftIsoWeek(weekId, -1)}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              ← 上周
            </Link>
            <Link
              href={`/astro/pair/${keys[0]}/${keys[1]}/week/${shiftIsoWeek(weekId, 1)}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              下周 →
            </Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-[13px]">
            <div className="font-bold text-emerald-900">本周较适合一起推进</div>
            {pack.best ? (
              <Link href={pack.best.href} className="mt-1 block font-semibold underline-offset-2 hover:underline">
                {pack.best.date} · {pack.best.score}分 · {stanceZh(pack.best.stance)}
              </Link>
            ) : (
              '—'
            )}
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-[13px]">
            <div className="font-bold text-amber-950">本周宜降规格</div>
            {pack.careful ? (
              <Link href={pack.careful.href} className="mt-1 block font-semibold underline-offset-2 hover:underline">
                {pack.careful.date} · {pack.careful.score}分 · {stanceZh(pack.careful.stance)}
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
                className="flex items-center justify-between rounded-xl border border-[color:var(--hairline)] bg-white px-3 py-2.5 no-underline hover:border-[color:var(--brand)]/40"
              >
                <span className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                  {d.date} · {stanceZh(d.stance)}
                </span>
                <span className="text-[18px] font-black tabular-nums text-[color:var(--brand)]">{d.score}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">可借力</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.favors.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">宜注意</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {pack.watchouts.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
        </div>

        <p className="text-[12px] leading-relaxed text-[color:var(--ink-4)]">{pack.elementNote}</p>
        <div className="flex flex-wrap gap-3 text-[13px]">
          <Link href={pack.aWeekHref} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            {sa.zh}周运
          </Link>
          <Link href={pack.bWeekHref} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            {sb.zh}周运
          </Link>
          <Link href={pack.pairPath} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            配对结构
          </Link>
          <Link href="/hehun" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            合婚双盘
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
