import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroDailyMatchView from '@/components/astro/astro-daily-match-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { isValidIsoDate } from '@/lib/astro/daily-window';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ birthDate: string; date: string }> };

/** Dynamic only — do not SSG all birth×day pairs */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { birthDate, date } = await params;
  const pack = buildAstroDailyMatchPack(date, { kind: 'birth', birthDate });
  if (!pack) return { title: '生日日运' };
  return buildPageMetadata({
    title: pack.seo.title,
    description: pack.seo.description,
    path: `/astro/birth/${birthDate}/day/${date}`,
    type: 'article',
    keywords: pack.seo.keywords,
  });
}

export default async function BirthDayPage({ params }: Props) {
  const { birthDate, date } = await params;
  if (!isValidIsoDate(birthDate) || !isValidIsoDate(date)) notFound();
  const pack = buildAstroDailyMatchPack(date, { kind: 'birth', birthDate });
  if (!pack) notFound();
  const path = `/astro/birth/${birthDate}/day/${date}`;

  return (
    <AppPage header={{ ctaHref: pack.bridges.analyze, ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView
        eventName="astro_birth_day"
        page={path}
        meta={{
          birth: birthDate,
          date,
          score: pack.scores.composite,
          dayMaster: pack.natal?.dayMaster,
        }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: pack.identity.title, path },
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
            { href: path, label: `${birthDate} → ${date}` },
          ]}
        />
      </div>
    </AppPage>
  );
}
