import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import AstroWeekView from '@/components/astro/astro-week-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { isValidIsoDate } from '@/lib/astro/daily-window';
import {
  buildAstroWeekPack,
  parseIsoWeekId,
} from '@/lib/astro/week-engine';
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from '@/lib/seo';

type Props = { params: Promise<{ birthDate: string; weekId: string }> };

/** Dynamic only — never SSG birth × week matrix */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { birthDate, weekId } = await params;
  if (!isValidIsoDate(birthDate) || !parseIsoWeekId(weekId)) {
    return { title: '生日周运', robots: { index: false, follow: true } };
  }
  const meta = buildPageMetadata({
    title: `${birthDate} · ${weekId} 个人结构周运｜人生K线`,
    description: `出生日期 ${birthDate} 在 ${weekId} 的 7 日引擎匹配分：较顺/宜慎日与日主通书证据链。`,
    path: `/astro/birth/${birthDate}/week/${weekId}`,
  });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function BirthWeekPage({ params }: Props) {
  const { birthDate, weekId } = await params;
  if (!isValidIsoDate(birthDate) || !parseIsoWeekId(weekId)) notFound();

  const pack = buildAstroWeekPack(
    weekId,
    { kind: 'birth', birthDate },
    `生日 ${birthDate}`,
    (date) => `/astro/birth/${birthDate}/day/${date}`,
  );
  if (!pack) notFound();
  const path = `/astro/birth/${birthDate}/week/${weekId}`;
  const mid = pack.days[3]?.date || pack.startDate;

  return (
    <AppPage header={{ ctaHref: '/analyze?source=astro_birth_week', ctaLabel: '结构报告', compact: true }}>
      <AnalyticsPageView
        eventName="astro_birth_week"
        page={path}
        meta={{ birth: birthDate, weekId, avg: pack.avg }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '星座', path: '/astro' },
          { name: `${birthDate} 周运`, path },
        ])}
      />
      <div className="page-content space-y-5 py-6 pb-16 md:py-8">
        <div className="text-[12px] text-[color:var(--ink-4)]">
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            星座
          </Link>
          {' / '}
          生日 {birthDate} / {weekId}
        </div>
        <p className="max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          个人层周运：按出生日期 × 流日引擎聚合 7 天。
          <strong className="text-[color:var(--ink-2)]">不进入公开简报邮件</strong>
          （避免生日维度 bulk）；公共周榜请看十二座对比。
        </p>
        <AstroWeekView pack={pack} basePath={`/astro/birth/${birthDate}/week`} />
        <div className="flex flex-wrap gap-3 text-[13px]">
          <Link
            href={`/astro/birth/${birthDate}/day/${mid}`}
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            周中日运样例 →
          </Link>
          <Link
            href={`/astro/week/${weekId}`}
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            本周十二座总榜 →
          </Link>
          <Link href="/astro" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            重新查生日 →
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
