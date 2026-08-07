import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { getRisingByKey, RISING_PROFILES } from '@/lib/astro/rising-data';
import type { SignKey } from '@/lib/astro/types';
import {
  buildAstroWeekPack,
  currentIsoWeekId,
  parseIsoWeekId,
  shiftIsoWeek,
} from '@/lib/astro/week-engine';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ key: string; weekId: string }> };

export function generateStaticParams() {
  const cur = currentIsoWeekId();
  const weeks = [shiftIsoWeek(cur, -1), cur, shiftIsoWeek(cur, 1)];
  return RISING_PROFILES.flatMap((r) => weeks.map((weekId) => ({ key: r.key, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, weekId } = await params;
  const r = getRisingByKey(key);
  if (!r || !parseIsoWeekId(weekId)) return { title: '上升周运' };
  return buildPageMetadata({
    title: `上升${r.zh}${weekId}周运｜呈现节奏｜人生K线`,
    description: `上升${r.zh}${weekId}：7 日对外呈现/节奏引擎分，链到每日证据页。`,
    path: `/astro/rising/${key}/week/${weekId}`,
  });
}

export default async function RisingWeekPage({ params }: Props) {
  const { key, weekId } = await params;
  const r = getRisingByKey(key);
  if (!r || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'rising', key: key as SignKey },
    `上升${r.zh}`,
    (date) => `/astro/rising/${key}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/rising/${key}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: `/astro/rising/${key}`, ctaLabel: `上升${r.zh}`, compact: true }}>
      <AnalyticsPageView eventName="astro_rising_week" page={path} meta={{ rising: key, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/rising" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            上升
          </Link>
          {' / '}
          <Link href={`/astro/rising/${key}`} className="underline-offset-2 hover:underline">
            上升{r.zh}
          </Link>
          {' / '}
          {weekId}
        </div>
        <AstroWeekView pack={pack} basePath={`/astro/rising/${key}/week`} />
        <Link
          href={`/astro/week/${weekId}`}
          className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          本周十二座总榜 →
        </Link>
      </div>
    </AppPage>
  );
}
