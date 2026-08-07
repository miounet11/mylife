import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroDailyMatchView from '@/components/astro/astro-daily-match-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { rollingIsoDates } from '@/lib/astro/daily-window';
import { ASTRO_ZONES_48, getZoneById } from '@/lib/astro/zones-48';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ id: string; date: string }> };

export function generateStaticParams() {
  // Bound SSG: phase-4 zones × short window (sitemap covers more dynamically)
  const dates = rollingIsoDates(2, 2);
  const zones = ASTRO_ZONES_48.filter((z) => z.phase === 4);
  const out: Array<{ id: string; date: string }> = [];
  for (const z of zones) {
    for (const date of dates) out.push({ id: z.id, date });
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, date } = await params;
  const pack = buildAstroDailyMatchPack(date, { kind: 'zone', id });
  if (!pack) return { title: '星区日运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/zones/${id}/day/${date}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

export default async function ZoneDayPage({ params }: Props) {
  const { id, date } = await params;
  if (!getZoneById(id)) notFound();
  const pack = buildAstroDailyMatchPack(date, { kind: 'zone', id });
  if (!pack) notFound();
  const path = `/astro/zones/${id}/day/${date}`;

  return (
    <AppPage header={{ ctaHref: pack.bridges.analyze, ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView
        eventName="astro_zone_day"
        page={path}
        meta={{ zone: id, date, score: pack.scores.composite }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: '48星区', path: '/astro/zones' },
          { name: pack.identity.title, path: `/astro/zones/${id}` },
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
      <JsonLd data={buildFaqJsonLd(pack.seo.faqs)} />
      <div className="page-content py-6 pb-16 md:py-8">
        <AstroDailyMatchView
          pack={pack}
          breadcrumbs={[
            { href: '/astro', label: '星座' },
            { href: '/astro/zones', label: '48星区' },
            { href: `/astro/zones/${id}`, label: pack.identity.title },
            { href: path, label: date },
          ]}
        />
      </div>
    </AppPage>
  );
}
