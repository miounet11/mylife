import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import { getModalityBySlug, MODALITY_CATALOG } from '@/lib/astro/elements-catalog';
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
  return MODALITY_CATALOG.flatMap((m) => weeks.map((weekId) => ({ slug: m.slug, weekId })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, weekId } = await params;
  const mod = getModalityBySlug(slug);
  if (!mod || !parseIsoWeekId(weekId)) return { title: '模式周运' };
  return buildPageMetadata({
    title: `${mod.zh}宫${weekId}周运｜三模式引擎｜人生K线`,
    description: `${mod.zh}宫${weekId}：7 日启动/持守/调节节奏。`,
    path: `/astro/modality/${slug}/week/${weekId}`,
  });
}

export default async function ModalityWeekPage({ params }: Props) {
  const { slug, weekId } = await params;
  const mod = getModalityBySlug(slug);
  if (!mod || !parseIsoWeekId(weekId)) notFound();
  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'modality', slug },
    `${mod.zh}宫`,
    (date) => `/astro/modality/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/modality/${slug}/week/${weekId}`;

  return (
    <AppPage header={{ ctaHref: '/astro/modality', ctaLabel: '模式', compact: true }}>
      <AnalyticsPageView eventName="astro_modality_week" page={path} meta={{ slug, weekId }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <AstroWeekView pack={pack} basePath={`/astro/modality/${slug}/week`} />
        <Link href={`/astro/week/${weekId}`} className="text-[13px] text-[color:var(--brand)] underline-offset-2 hover:underline">
          本周十二座总榜 →
        </Link>
      </div>
    </AppPage>
  );
}
