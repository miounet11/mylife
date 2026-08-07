import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { ELEMENT_CATALOG, getElementBySlug } from '@/lib/astro/elements-catalog';
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
  return ELEMENT_CATALOG.flatMap((e) => weeks.map((weekId) => ({ slug: e.slug, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, weekId } = await params;
  const el = getElementBySlug(slug);
  if (!el || !parseIsoWeekId(weekId)) return { title: '元素周运' };
  return buildPageMetadata({
    title: `${el.zh}象${weekId}周运｜四象引擎｜人生K线`,
    description: `${el.zh}象${weekId}：7 日群组匹配分与较顺/谨慎日。`,
    path: `/astro/elements/${slug}/week/${weekId}`,
  });
}

export default async function ElementWeekPage({ params }: Props) {
  const { slug, weekId } = await params;
  const el = getElementBySlug(slug);
  if (!el || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'element', slug },
    `${el.zh}象`,
    (date) => `/astro/elements/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/elements/${slug}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: '/astro/elements', ctaLabel: '四象', compact: true }}>
      <AnalyticsPageView eventName="astro_element_week" page={path} meta={{ slug, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/elements" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            四象
          </Link>
          {' / '}
          {el.zh}象 / {weekId}
        </div>
        <AstroWeekView pack={pack} basePath={`/astro/elements/${slug}/week`} />
        <Link href={`/astro/week/${weekId}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          本周十二座总榜 →
        </Link>
      </div>
    </AppPage>
  );
}
