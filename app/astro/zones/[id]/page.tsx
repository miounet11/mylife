import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroRelatedLinks from '@/components/astro/astro-related-links';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { getSignByKey } from '@/lib/astro/signs-data';
import { ASTRO_ZONES_48, getZoneById } from '@/lib/astro/zones-48';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return ASTRO_ZONES_48.map((z) => ({ id: z.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const z = getZoneById(id);
  if (!z) return { title: '星区' };
  const sign = getSignByKey(z.signKey);
  return buildPageMetadata({
    title: `${z.title}｜48星区第${z.index}区｜${sign?.zh || ''}｜人生K线`,
    description: z.summary.slice(0, 150),
    path: `/astro/zones/${z.id}`,
    type: 'article',
    keywords: [z.title, '48星区', sign?.zh || '', '星座细分'],
  });
}

export default async function AstroZonePage({ params }: Props) {
  const { id } = await params;
  const z = getZoneById(id);
  if (!z) notFound();
  const sign = getSignByKey(z.signKey);
  if (!sign) notFound();
  const path = `/astro/zones/${z.id}`;
  const cusp = z.cuspWith ? getSignByKey(z.cuspWith) : null;

  return (
    <AppPage header={{ ctaHref: '/astro', ctaLabel: '星座首页', compact: true }}>
      <AnalyticsPageView
        eventName="astro_zone_viewed"
        page={path}
        meta={{ surfaceKey: 'astro_zone', zone: z.id, sign: z.signKey }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: '48星区', path: '/astro/zones' },
          { name: z.title, path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: z.title,
          description: z.summary,
          path,
          keywords: [z.title, '48星区', sign.zh],
        })}
      />

      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[13px] text-[color:var(--ink-4)]">
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            星座
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/astro/zones" className="underline-offset-2 hover:underline">
            48星区
          </Link>
          <span className="mx-1.5">/</span>
          <span>{z.title}</span>
        </div>

        <header className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5 shadow-sm md:p-6">
          <p className="text-[11px] font-bold text-[color:var(--brand)]">
            48 ZONES · #{z.index} · Phase {z.phase}
          </p>
          <h1 className="mt-1 text-[24px] font-black text-[color:var(--ink-1)] md:text-[28px]">
            {sign.symbol} {z.title}
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">
            约 {z.start} – {z.end}（公历民用） · 隶属{' '}
            <Link
              href={`/astro/signs/${sign.key}`}
              className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              {sign.zh}
            </Link>
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--ink-2)]">{z.summary}</p>
          {cusp ? (
            <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">
              交界对照：
              <Link
                href={`/astro/signs/${cusp.key}`}
                className="ml-1 text-[color:var(--brand)] underline-offset-2 hover:underline"
              >
                {cusp.zh}
              </Link>
            </p>
          ) : null}
        </header>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[13px] font-bold">区段特质</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] text-[color:var(--ink-3)]">
            {z.traits.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)]/25 p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--brand-strong)]">行动提示</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-2)]">{z.actionTip}</p>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">主星座摘要</h2>
          <p className="mt-2">{sign.summary}</p>
          <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">{sign.worldYiBridge}</p>
        </section>

        <AstroRelatedLinks signKey={sign.key} />
      </div>
    </AppPage>
  );
}
