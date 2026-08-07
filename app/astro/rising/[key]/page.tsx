import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { getRisingByKey, RISING_PROFILES } from '@/lib/astro/rising-data';
import { getSignByKey } from '@/lib/astro/signs-data';
import { currentIsoWeekId } from '@/lib/astro/week-engine';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ key: string }> };

export function generateStaticParams() {
  return RISING_PROFILES.map((r) => ({ key: r.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const r = getRisingByKey(key);
  if (!r) return { title: '上升星座' };
  return buildPageMetadata({
    title: `上升${r.zh}｜第一印象与人格面具｜人生K线`,
    description: `上升${r.zh}：${r.firstImpression} ${r.worldYiBridge.slice(0, 60)}`,
    path: `/astro/rising/${r.key}`,
    type: 'article',
    keywords: [`上升${r.zh}`, '上升星座', 'ASC', r.en],
  });
}

export default async function AstroRisingPage({ params }: Props) {
  const { key } = await params;
  const r = getRisingByKey(key);
  if (!r) notFound();
  const sign = getSignByKey(r.key);
  const path = `/astro/rising/${r.key}`;
  const today = todayIsoLocal();
  const weekId = currentIsoWeekId();

  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView
        eventName="astro_rising_viewed"
        page={path}
        meta={{ surfaceKey: 'astro_rising_detail', sign: r.key }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: '上升', path: '/astro/rising' },
          { name: `上升${r.zh}`, path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: `上升${r.zh}`,
          description: r.firstImpression,
          path,
          keywords: [`上升${r.zh}`, '上升星座'],
        })}
      />

      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[13px] text-[color:var(--ink-4)]">
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            星座
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/astro/rising" className="underline-offset-2 hover:underline">
            上升
          </Link>
          <span className="mx-1.5">/</span>
          <span>上升{r.zh}</span>
        </div>

        <header className="rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-violet-50 via-white to-[color:var(--paper)] p-5 md:p-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-violet-700">
            ASCENDANT · {r.en.toUpperCase()}
          </p>
          <h1 className="mt-1 text-[26px] font-black text-[color:var(--ink-1)]">
            {sign?.symbol} 上升{r.zh}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--ink-2)]">{r.firstImpression}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-semibold">
            <Link
              href={`/astro/rising/${r.key}/day/${today}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              今日呈现 →
            </Link>
            <Link
              href={`/astro/rising/${r.key}/week/${weekId}`}
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              本周呈现 →
            </Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h2 className="text-[13px] font-bold">体态与风格印象</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{r.bodyStyle}</p>
          </section>
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h2 className="text-[13px] font-bold">社交模式</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{r.socialMode}</p>
          </section>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">优势呈现</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-emerald-950/90">
              {r.strengths.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">易被误读</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-amber-950/90">
              {r.watchouts.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)]/30 p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--brand-strong)]">世界易 · 角色呈现</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-2)]">{r.worldYiBridge}</p>
        </section>

        {sign ? (
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h2 className="text-[13px] font-bold">对照太阳{sign.zh}</h2>
            <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">{sign.summary}</p>
            <Link
              href={`/astro/signs/${sign.key}`}
              className="mt-2 inline-block text-[12px] font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              太阳{sign.zh}详解 →
            </Link>
          </section>
        ) : null}

        <AstroRelatedLinks signKey={r.key} />
      </div>
    </AppPage>
  );
}
