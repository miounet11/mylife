import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import {
  allPairKeyCombos,
  buildAstroPairPack,
  canonicalPairKeys,
} from '@/lib/astro/pair-engine';
import { getSignByKey } from '@/lib/astro/signs-data';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ a: string; b: string }> };

export function generateStaticParams() {
  return allPairKeyCombos().map(({ a, b }) => ({ a, b }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await params;
  const keys = canonicalPairKeys(a, b);
  if (!keys) return { title: '配对' };
  const pack = buildAstroPairPack(keys[0], keys[1]);
  if (!pack) return { title: '配对' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/pair/${keys[0]}/${keys[1]}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

export default async function PairPage({ params }: Props) {
  const { a, b } = await params;
  if (!getSignByKey(a) || !getSignByKey(b)) notFound();
  const keys = canonicalPairKeys(a, b)!;
  if (a !== keys[0] || b !== keys[1]) {
    redirect(`/astro/pair/${keys[0]}/${keys[1]}`);
  }
  const pack = buildAstroPairPack(keys[0], keys[1]);
  if (!pack) notFound();
  const path = `/astro/pair/${keys[0]}/${keys[1]}`;
  const sa = getSignByKey(keys[0])!;
  const sb = getSignByKey(keys[1])!;

  return (
    <AppPage header={{ ctaHref: '/hehun?source=astro_pair', ctaLabel: '合婚双盘', compact: true }}>
      <AnalyticsPageView eventName="astro_pair" page={path} meta={{ a: keys[0], b: keys[1], score: pack.score }} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '星座', path: '/astro' },
          { name: '配对', path: '/astro/pair' },
          { name: pack.title, path },
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
          <p className="text-[11px] font-bold text-[color:var(--brand)]">PAIR · STRUCTURE</p>
          <h1 className="mt-1 text-[24px] font-black text-[color:var(--ink-1)]">
            {sa.symbol}
            {sa.zh} × {sb.symbol}
            {sb.zh}
          </h1>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div>
              <div className="text-[11px] text-[color:var(--ink-5)]">协作结构分</div>
              <div className="text-[36px] font-black text-[color:var(--brand)]">{pack.score}</div>
            </div>
            <div className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-[12px] font-bold text-[color:var(--brand-strong)]">
              {pack.stance === 'ease' ? '较易协作' : pack.stance === 'work' ? '需设计边界' : '中性看阶段'}
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">元素结构</h2>
          <p className="mt-2">{pack.elementNote}</p>
          <h2 className="mt-4 text-[13px] font-bold text-[color:var(--ink-1)]">模式节奏</h2>
          <p className="mt-2">{pack.modalityNote}</p>
          <h2 className="mt-4 text-[13px] font-bold text-[color:var(--ink-1)]">资料库倾向</h2>
          <p className="mt-2">{pack.catalogNote}</p>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">可借力</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-emerald-950/90">
              {pack.favors.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">宜注意</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-amber-950/90">
              {pack.watchouts.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)]/25 p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--brand-strong)]">世界易</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-2)]">{pack.worldYi}</p>
        </section>

        <div className="flex flex-wrap gap-2">
          {pack.bridges.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1 text-[12px] font-semibold no-underline hover:border-[color:var(--brand)]/40"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-[color:var(--ink-5)]">
          配对为结构倾向，不等于现实关系命运。需要双盘细节请用合婚或完整报告。
        </p>
      </div>
    </AppPage>
  );
}
