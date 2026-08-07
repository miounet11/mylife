import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroMonthGrid from '@/components/astro/astro-month-grid';
import { AppPage } from '@/components/layout/app-page';
import { getModalityBySlug, MODALITY_CATALOG } from '@/lib/astro/elements-catalog';
import {
  buildAstroMonthPack,
  currentYearMonth,
  parseYearMonth,
  shiftYearMonth,
} from '@/lib/astro/month-engine';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string; ym: string }> };

export function generateStaticParams() {
  const cur = currentYearMonth();
  const months = [shiftYearMonth(cur, -1), cur, shiftYearMonth(cur, 1)];
  return MODALITY_CATALOG.flatMap((m) => months.map((ym) => ({ slug: m.slug, ym })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ym } = await params;
  const mod = getModalityBySlug(slug);
  const p = parseYearMonth(ym);
  if (!mod || !p) return { title: '模式月历' };
  return buildPageMetadata({
    title: `${mod.zh}宫${p.year}年${p.month}月运势月历｜人生K线`,
    description: `${mod.zh}宫${p.year}年${p.month}月：基本/固定/变动群组引擎月历。`,
    path: `/astro/modality/${slug}/month/${ym}`,
  });
}

export default async function ModalityMonthPage({ params }: Props) {
  const { slug, ym } = await params;
  const mod = getModalityBySlug(slug);
  const p = parseYearMonth(ym);
  if (!mod || !p) notFound();
  const pack = buildAstroMonthPack(
    p.year,
    p.month,
    { kind: 'modality', slug },
    `${mod.zh}宫`,
    (date) => `/astro/modality/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/modality/${slug}/month/${ym}`;

  return (
    <AppPage header={{ ctaHref: '/astro/modality', ctaLabel: '三模式', compact: true }}>
      <AnalyticsPageView eventName="astro_modality_month" page={path} meta={{ slug, ym }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/modality" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            三模式
          </Link>
          {' / '}
          {mod.zh} / {pack.label}
        </div>
        <AstroMonthGrid pack={pack} basePath={`/astro/modality/${slug}/month`} />
      </div>
    </AppPage>
  );
}
