import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { ASTRO_SIGNS, getSignByKey } from '@/lib/astro/signs-data';
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
  return ASTRO_SIGNS.flatMap((s) => weeks.map((weekId) => ({ key: s.key, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, weekId } = await params;
  const s = getSignByKey(key);
  if (!s || !parseIsoWeekId(weekId)) return { title: '周运' };
  return buildPageMetadata({
    title: `${s.zh}${weekId}周运势｜7日引擎评分｜人生K线`,
    description: `${s.zh}${weekId}：周均分、较顺/谨慎日、每日证据页入口。通书×队列引擎，非空泛运势。`,
    path: `/astro/signs/${key}/week/${weekId}`,
  });
}

export default async function SignWeekPage({ params }: Props) {
  const { key, weekId } = await params;
  const s = getSignByKey(key);
  if (!s || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'sign', key: key as SignKey },
    s.zh,
    (date) => `/astro/signs/${key}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/signs/${key}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: `/astro/signs/${key}`, ctaLabel: s.zh, compact: true }}>
      <AnalyticsPageView eventName="astro_sign_week" page={path} meta={{ sign: key, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            星座
          </Link>
          {' / '}
          <Link href={`/astro/signs/${key}`} className="underline-offset-2 hover:underline">
            {s.zh}
          </Link>
          {' / '}
          {weekId}
        </div>
        <AstroWeekView pack={pack} basePath={`/astro/signs/${key}/week`} />
        <div className="flex flex-wrap gap-3 text-[13px]">
          <Link
            href={`/astro/signs/${key}/month/${pack.startDate.slice(0, 7)}`}
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            本月月历 →
          </Link>
          <Link
            href={`/astro/day/${pack.startDate}/compare`}
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            周初十二座对比 →
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
