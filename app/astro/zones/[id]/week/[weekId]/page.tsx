import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { ASTRO_ZONES_48, getZoneById } from '@/lib/astro/zones-48';
import {
  buildAstroWeekPack,
  currentIsoWeekId,
  parseIsoWeekId,
  shiftIsoWeek,
} from '@/lib/astro/week-engine';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ id: string; weekId: string }> };

export function generateStaticParams() {
  const cur = currentIsoWeekId();
  const weeks = [shiftIsoWeek(cur, -1), cur];
  // Phase-4 zones only for SSG bound
  return ASTRO_ZONES_48.filter((z) => z.phase === 4).flatMap((z) =>
    weeks.map((weekId) => ({ id: z.id, weekId })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, weekId } = await params;
  const z = getZoneById(id);
  if (!z || !parseIsoWeekId(weekId)) return { title: '星区周运' };
  return buildPageMetadata({
    title: `${z.title}${weekId}周运｜48星区引擎｜人生K线`,
    description: `${z.title}${weekId}：7 日匹配分、较顺/谨慎日，与通书同一引擎。`,
    path: `/astro/zones/${id}/week/${weekId}`,
  });
}

export default async function ZoneWeekPage({ params }: Props) {
  const { id, weekId } = await params;
  const z = getZoneById(id);
  if (!z || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'zone', id },
    z.title,
    (date) => `/astro/zones/${id}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/zones/${id}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: `/astro/zones/${id}`, ctaLabel: z.title, compact: true }}>
      <AnalyticsPageView eventName="astro_zone_week" page={path} meta={{ zone: id, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/zones" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            48星区
          </Link>
          {' / '}
          <Link href={`/astro/zones/${id}`} className="underline-offset-2 hover:underline">
            {z.title}
          </Link>
          {' / '}
          {weekId}
        </div>
        <AstroWeekView pack={pack} basePath={`/astro/zones/${id}/week`} />
        <Link
          href={`/astro/signs/${z.signKey}/week/${weekId}`}
          className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          对照主星座周运 →
        </Link>
      </div>
    </AppPage>
  );
}
