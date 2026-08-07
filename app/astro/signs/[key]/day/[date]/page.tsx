import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroDailyMatchView from '@/components/astro/astro-daily-match-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { rollingIsoDates } from '@/lib/astro/daily-window';
import { ASTRO_SIGNS, getSignByKey } from '@/lib/astro/signs-data';
import type { SignKey } from '@/lib/astro/types';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ key: string; date: string }> };

export function generateStaticParams() {
  const dates = rollingIsoDates(3, 3);
  const out: Array<{ key: string; date: string }> = [];
  for (const s of ASTRO_SIGNS) {
    for (const date of dates) out.push({ key: s.key, date });
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, date } = await params;
  const pack = buildAstroDailyMatchPack(date, { kind: 'sign', key: key as SignKey });
  if (!pack) return { title: '星座日运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/signs/${key}/day/${date}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

export default async function SignDayPage({ params }: Props) {
  const { key, date } = await params;
  if (!getSignByKey(key)) notFound();
  const pack = buildAstroDailyMatchPack(date, { kind: 'sign', key: key as SignKey });
  if (!pack) notFound();
  const path = `/astro/signs/${key}/day/${date}`;

  return (
    <AppPage header={{ ctaHref: pack.bridges.analyze, ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView
        eventName="astro_sign_day"
        page={path}
        meta={{ sign: key, date, score: pack.scores.composite }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: pack.identity.title, path: `/astro/signs/${key}` },
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
            { href: `/astro/signs/${key}`, label: pack.identity.title },
            { href: path, label: date },
          ]}
        />
      </div>
    </AppPage>
  );
}
