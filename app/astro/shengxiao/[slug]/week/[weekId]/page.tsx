import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { getShengxiaoBySlug, SHENGXIAO_CATALOG } from '@/lib/astro/shengxiao-catalog';
import {
  buildAstroWeekPack,
  currentIsoWeekId,
  parseIsoWeekId,
  shiftIsoWeek,
} from '@/lib/astro/week-engine';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string; weekId: string }> };

export function generateStaticParams() {
  const cur = currentIsoWeekId();
  const weeks = [shiftIsoWeek(cur, -1), cur, shiftIsoWeek(cur, 1)];
  return SHENGXIAO_CATALOG.flatMap((s) => weeks.map((weekId) => ({ slug: s.slug, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, weekId } = await params;
  const sx = getShengxiaoBySlug(slug);
  if (!sx || !parseIsoWeekId(weekId)) return { title: '生肖周运' };
  return buildPageMetadata({
    title: `属${sx.zh}${weekId}周运｜地支冲合×通书｜人生K线`,
    description: `属${sx.zh}${weekId}：7 日引擎分与冲合节奏，链接每日证据页。`,
    path: `/astro/shengxiao/${slug}/week/${weekId}`,
  });
}

export default async function ShengxiaoWeekPage({ params }: Props) {
  const { slug, weekId } = await params;
  const sx = getShengxiaoBySlug(slug);
  if (!sx || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'shengxiao', slug },
    `属${sx.zh}`,
    (date) => `/astro/shengxiao/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/shengxiao/${slug}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: '/astro/shengxiao', ctaLabel: '生肖', compact: true }}>
      <AnalyticsPageView eventName="astro_shengxiao_week" page={path} meta={{ slug, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/shengxiao" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            生肖
          </Link>
          {' / '}
          属{sx.zh} / {weekId}
        </div>
        <AstroWeekView pack={pack} basePath={`/astro/shengxiao/${slug}/week`} />
      </div>
    </AppPage>
  );
}
