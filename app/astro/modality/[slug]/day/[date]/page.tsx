import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroDailyMatchView from '@/components/astro/astro-daily-match-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { rollingIsoDates } from '@/lib/astro/daily-window';
import { getModalityBySlug, MODALITY_CATALOG } from '@/lib/astro/elements-catalog';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ slug: string; date: string }> };

export function generateStaticParams() {
  const dates = rollingIsoDates(5, 5);
  return MODALITY_CATALOG.flatMap((m) => dates.map((date) => ({ slug: m.slug, date })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, date } = await params;
  const pack = buildAstroDailyMatchPack(date, { kind: 'modality', slug });
  if (!pack) return { title: '模式日运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/modality/${slug}/day/${date}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

export default async function ModalityDayPage({ params }: Props) {
  const { slug, date } = await params;
  if (!getModalityBySlug(slug)) notFound();
  const pack = buildAstroDailyMatchPack(date, { kind: 'modality', slug });
  if (!pack) notFound();
  const path = `/astro/modality/${slug}/day/${date}`;
  return (
    <AppPage header={{ ctaHref: pack.bridges.analyze, ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView eventName="astro_modality_day" page={path} meta={{ slug, date }} />
      <JsonLd data={buildBreadcrumbJsonLd([{ name: '星座', path: '/astro' }, { name: '模式', path: '/astro/modality' }, { name: date, path }])} />
      <JsonLd data={buildArticleJsonLd({ title: pack.seo.title, description: pack.seo.description, path, keywords: pack.seo.keywords })} />
      <JsonLd data={buildFaqJsonLd(pack.seo.faqs)} />
      <div className="page-content py-6 pb-16 md:py-8">
        <AstroDailyMatchView pack={pack} breadcrumbs={[{ href: '/astro', label: '星座' }, { href: '/astro/modality', label: '模式' }, { href: path, label: date }]} />
      </div>
    </AppPage>
  );
}
