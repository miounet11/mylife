import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroMonthGrid from '@/components/astro/astro-month-grid';
import { AppPage } from '@/components/layout/app-page';
import { buildAstroMonthPack, currentYearMonth, parseYearMonth, shiftYearMonth } from '@/lib/astro/month-engine';
import { ASTRO_SIGNS, getSignByKey } from '@/lib/astro/signs-data';
import type { SignKey } from '@/lib/astro/types';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ key: string; ym: string }> };

export function generateStaticParams() {
  const cur = currentYearMonth();
  const months = [shiftYearMonth(cur, -1), cur, shiftYearMonth(cur, 1)];
  return ASTRO_SIGNS.flatMap((s) => months.map((ym) => ({ key: s.key, ym })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, ym } = await params;
  const s = getSignByKey(key);
  const p = parseYearMonth(ym);
  if (!s || !p) return { title: '月历' };
  return buildPageMetadata({
    title: `${s.zh}${p.year}年${p.month}月运势月历｜引擎评分｜人生K线`,
    description: `${s.zh}${p.year}年${p.month}月：每日匹配分、可推进/守成天数、最佳与谨慎日，数据来自通书×队列引擎。`,
    path: `/astro/signs/${key}/month/${ym}`,
  });
}

export default async function SignMonthPage({ params }: Props) {
  const { key, ym } = await params;
  const s = getSignByKey(key);
  const p = parseYearMonth(ym);
  if (!s || !p) notFound();
  const pack = buildAstroMonthPack(
    p.year,
    p.month,
    { kind: 'sign', key: key as SignKey },
    s.zh,
    (date) => `/astro/signs/${key}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/signs/${key}/month/${ym}`;

  return (
    <AppPage header={{ ctaHref: `/astro/signs/${key}`, ctaLabel: s.zh, compact: true }}>
      <AnalyticsPageView eventName="astro_sign_month" page={path} meta={{ sign: key, ym }} />
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
          {pack.label}
        </div>
        <AstroMonthGrid pack={pack} basePath={`/astro/signs/${key}/month`} />
        <p className="text-[11px] text-[color:var(--ink-5)]">
          月历每个格子均链接到当日引擎页（证据链+时辰+通书）。非医疗投资建议。
        </p>
      </div>
    </AppPage>
  );
}
