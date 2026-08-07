import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroMonthGrid from '@/components/astro/astro-month-grid';
import { AppPage } from '@/components/layout/app-page';
import {
  buildAstroMonthPack,
  currentYearMonth,
  parseYearMonth,
  shiftYearMonth,
} from '@/lib/astro/month-engine';
import { getShengxiaoBySlug, SHENGXIAO_CATALOG } from '@/lib/astro/shengxiao-catalog';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string; ym: string }> };

export function generateStaticParams() {
  const cur = currentYearMonth();
  const months = [shiftYearMonth(cur, -1), cur, shiftYearMonth(cur, 1)];
  return SHENGXIAO_CATALOG.flatMap((s) => months.map((ym) => ({ slug: s.slug, ym })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ym } = await params;
  const sx = getShengxiaoBySlug(slug);
  const p = parseYearMonth(ym);
  if (!sx || !p) return { title: '生肖月历' };
  return buildPageMetadata({
    title: `属${sx.zh}${p.year}年${p.month}月运势月历｜人生K线`,
    description: `属${sx.zh}${p.year}年${p.month}月：地支冲合×通书引擎月历。`,
    path: `/astro/shengxiao/${slug}/month/${ym}`,
  });
}

export default async function ShengxiaoMonthPage({ params }: Props) {
  const { slug, ym } = await params;
  const sx = getShengxiaoBySlug(slug);
  const p = parseYearMonth(ym);
  if (!sx || !p) notFound();
  const pack = buildAstroMonthPack(
    p.year,
    p.month,
    { kind: 'shengxiao', slug },
    `属${sx.zh}`,
    (date) => `/astro/shengxiao/${slug}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/shengxiao/${slug}/month/${ym}`;

  return (
    <AppPage header={{ ctaHref: '/astro/shengxiao', ctaLabel: '生肖', compact: true }}>
      <AnalyticsPageView eventName="astro_shengxiao_month" page={path} meta={{ slug, ym }} />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro/shengxiao" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            生肖
          </Link>
          {' / '}
          属{sx.zh} / {pack.label}
        </div>
        <AstroMonthGrid pack={pack} basePath={`/astro/shengxiao/${slug}/month`} />
      </div>
    </AppPage>
  );
}
