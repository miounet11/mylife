import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { ASTRO_SIGNS, getSignByKey } from '@/lib/astro/signs-data';
import { getZonesBySign } from '@/lib/astro/zones-48';
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ key: string }> };

export function generateStaticParams() {
  return ASTRO_SIGNS.map((s) => ({ key: s.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const s = getSignByKey(key);
  if (!s) return { title: '星座' };
  return buildPageMetadata({
    title: `${s.zh}性格运势详解｜${s.en}｜十二星座｜人生K线`,
    description: `${s.zh}（${s.start}–${s.end}）：${s.summary.slice(0, 100)} 含事业关系、48星区、上升关联与世界易桥接。`,
    path: `/astro/signs/${s.key}`,
    type: 'article',
    keywords: [s.zh, s.en, '十二星座', '太阳星座', ...s.keywords],
  });
}

export default async function AstroSignPage({ params }: Props) {
  const { key } = await params;
  const s = getSignByKey(key);
  if (!s) notFound();
  const zones = getZonesBySign(s.key);
  const path = `/astro/signs/${s.key}`;

  return (
    <AppPage header={{ ctaHref: '/analyze?source=astro_sign', ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView
        eventName="astro_sign_viewed"
        page={path}
        meta={{ surfaceKey: 'astro_sign', sign: s.key }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: '十二星座', path: '/astro/signs' },
          { name: s.zh, path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: `${s.zh}详解`,
          description: s.summary,
          path,
          keywords: [s.zh, '太阳星座', ...s.keywords],
        })}
      />

      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[13px] text-[color:var(--ink-4)]">
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            星座
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/astro/signs" className="underline-offset-2 hover:underline">
            十二星座
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[color:var(--ink-2)]">{s.zh}</span>
        </div>

        <header className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-soft)]/40 via-white to-[color:var(--paper)] p-5 md:p-6">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[color:var(--brand)]">
            SUN SIGN · {s.en.toUpperCase()}
          </p>
          <h1 className="mt-1 text-[28px] font-black text-[color:var(--ink-1)] md:text-[32px]">
            {s.symbol} {s.zh}
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">
            {s.start} – {s.end} · 守护 {s.ruler} · {s.element}象 · {s.modality}宫
          </p>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-2)]">{s.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--ink-3)]"
              >
                {k}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">优势</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] text-emerald-950/90">
              {s.strengths.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">宜注意</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] text-amber-950/90">
              {s.watchouts.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h2 className="text-[13px] font-bold">事业节奏</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{s.career}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h2 className="text-[13px] font-bold">关系节奏</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{s.relationship}</p>
          </div>
        </section>

        <section className="rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)]/30 p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--brand-strong)]">世界易桥接</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-2)]">{s.worldYiBridge}</p>
          <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">{s.dailyRhythm}</p>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-[13px] font-bold">本座 48 星区（四区）</h2>
            <Link
              href="/astro/zones"
              className="text-[12px] text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              全部星区
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {zones.map((z) => (
              <li key={z.id}>
                <Link
                  href={`/astro/zones/${z.id}`}
                  className="block rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 no-underline hover:border-[color:var(--brand)]/40"
                >
                  <div className="text-[13px] font-bold text-[color:var(--ink-1)]">{z.title}</div>
                  <div className="text-[11px] text-[color:var(--ink-5)]">
                    {z.start}–{z.end}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[13px] font-bold">上升同名 · 对照</h2>
          <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">
            太阳是内核，上升是面具。同名时内外较一致；不同时看张力。
          </p>
          <Link
            href={`/astro/rising/${s.key}`}
            className="mt-2 inline-block text-[13px] font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            上升{s.zh}详解 →
          </Link>
        </section>

        <AstroRelatedLinks signKey={s.key} />

        <p className="text-[11px] text-[color:var(--ink-5)]">
          规范 URL：{absoluteUrl(path)} · 民用分界，交点前后建议核对精确星历。
        </p>
      </div>
    </AppPage>
  );
}
