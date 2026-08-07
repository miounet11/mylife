import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroMonthGrid from '@/components/astro/astro-month-grid';
import { AppPage } from '@/components/layout/app-page';
import { ELEMENT_CATALOG, getElementBySlug } from '@/lib/astro/elements-catalog';
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
  return ELEMENT_CATALOG.flatMap((e) => months.map((ym) => ({ slug: e.slug, ym })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ym } = await params;
  const el = getElementBySlug(slug);
  const p = parseYearMonth(ym);
  if (!el || !p) return { title: '四象月历' };
  return buildPageMetadata({
    title: `${el.zh}象${p.year}年${p.month}月运势月历｜人生K线`,
    description: `${el.zh}象${p.year}年${p.month}月：群组引擎日分、可推进/守成天、最佳与谨慎日。`,
    path: `/astro/elements/${slug}/month/${ym}`,
  });
}

export default async function ElementMonthPage({ params }: Props) {
  const { slug, ym } = await params;
  const el = getElementBySlug(slug);
  const p = parseYearMonth(ym);
  if (!el || !p) notFound();
  const pack = buildAstroMonthPack(
    p.year,
    p.month,
    { kind: 'element', slug },
    `${el.zh}象`,
    (date) => `/astro/elements/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/elements/${slug}/month/${ym}`;

  return (
    <AppPage header={{ ctaHref: '/astro/elements', ctaLabel: '四象', compact: true }}>
      <AnalyticsPageView eventName="astro_element_month" page={path} meta={{ slug, ym }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/elements" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            四象
          </Link>
          {' / '}
          {el.zh}象 / {pack.label}
        </div>
        <AstroMonthGrid pack={pack} basePath={`/astro/elements/${slug}/month`} />
      </div>
    </AppPage>
  );
}
