import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AlmanacApp from '@/components/almanac/almanac-app';
import AlmanacDayPanel from '@/components/almanac/almanac-day-panel';
import AlmanacLensPanel from '@/components/almanac/almanac-lens-panel';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAlmanacDayPack, todayDateString } from '@/lib/almanac/day-pack';
import { buildPersonalDayOverlay } from '@/lib/almanac/personal-day';
import { resolveUserChartForAlmanac } from '@/lib/almanac/resolve-user-chart';
import { getAuthSession } from '@/lib/auth';
import {
  articleSeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ date: string }>;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const pack = buildAlmanacDayPack(date);
  return Boolean(pack);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  if (!isValidDate(date)) {
    return { title: '万年历' };
  }
  const pack = buildAlmanacDayPack(date)!;
  const title = `${date}黄历｜${pack.lunar.dayGanZhi}日 · 宜忌时辰·个人日运｜人生K线万年历`;
  const description = `${date}（农历${pack.lunar.lunarText}）日柱${pack.lunar.dayGanZhi}。宜${pack.yi.slice(0, 4).join('、') || '—'}；忌${pack.ji.slice(0, 3).join('、') || '—'}。查十二时辰黄道黑道；绑定生辰看个人结构日运。`;
  return articleSeo({
    title,
    summary: description,
    path: `/almanac/${date}`,
    type: 'insight',
    keywords: [
      '万年历',
      '黄历',
      date,
      pack.lunar.dayGanZhi,
      '宜忌',
      '吉时',
      '个人日运',
      ...pack.yi.slice(0, 3),
    ],
    canonicalPath: `/almanac/${date}`,
    answerSummary: description,
    entityKeywords: [
      '万年历',
      '黄历',
      pack.lunar.dayGanZhi,
      '通书',
      '时辰',
      '日主',
      '人生K线',
    ],
  });
}

export default async function AlmanacDatePage({ params }: PageProps) {
  const { date } = await params;
  if (date === 'today') {
    redirect(`/almanac/${todayDateString()}`);
  }
  if (!isValidDate(date)) notFound();

  const pack = buildAlmanacDayPack(date)!;
  const year = pack.year;
  const month = pack.month;

  const session = await getAuthSession();
  const userId = session.user?.id || (await getOrCreateGuestUserId().catch(() => null));
  const chart = await resolveUserChartForAlmanac(userId);
  const personal = chart ? buildPersonalDayOverlay(pack, chart) : null;

  const faqs = [
    {
      question: `${date}适合做什么？`,
      answer: `通书宜：${pack.yi.slice(0, 6).join('、') || '从简行事'}。是否推进仍须结合你的日主结构与现实约束。`,
    },
    {
      question: `${date}有哪些吉时？`,
      answer: `黄道时辰：${
        pack.hours
          .filter((h) => h.luck === 'auspicious')
          .map((h) => `${h.timeLabel}${h.ganZhi}`)
          .join('、') || '见当日时辰表'
      }。绑定命盘后会按用神重排个人较顺时段。`,
    },
    {
      question: '个人黄历和公共黄历有什么区别？',
      answer: '公共层是通书宜忌与十二时辰；个人层用你的日主/用神叠流日，给出推进/守成倾向与时辰排序。',
    },
  ];

  return (
    <AppPage header={{ ctaHref: '/analyze?source=almanac_day', ctaLabel: '接到报告', compact: true }}>
      <AnalyticsPageView
        eventName="almanac_day_viewed"
        page={`/almanac/${date}`}
        meta={{ surfaceKey: 'almanac_day', date, hasPersonal: Boolean(personal) }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '万年历', path: '/almanac' },
          { name: date, path: `/almanac/${date}` },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: `${date}黄历 ${pack.lunar.dayGanZhi}`,
          description: pack.summary,
          path: `/almanac/${date}`,
          keywords: ['万年历', '黄历', date, pack.lunar.dayGanZhi],
          inLanguage: 'zh-CN',
        })}
      />
      <JsonLd data={buildFaqJsonLd(faqs)} />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <Link href="/almanac" className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
            ← 万年历今日
          </Link>
          <span className="text-[color:var(--ink-5)]">/</span>
          <span className="text-[color:var(--ink-3)]">{date}</span>
        </div>

        {/* SSR first paint for SEO crawlers */}
        <AlmanacDayPanel pack={pack} personal={personal} showCanonical={false} />

        {!personal ? (
          <LightBirthBridge
            source="almanac_day"
            page={`/almanac/${date}`}
            title="绑定生辰，生成你的个人黄历"
            description="引擎排盘取日主与用神，与当日流日通书匹配；可配合下方 AI 固定镜头每日回看。"
          />
        ) : null}

        <AlmanacLensPanel date={date} hasChart={Boolean(personal)} />

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">切换日期</h2>
          <AlmanacApp
            initialYear={year}
            initialMonth={month}
            initialDate={date}
            navigateOnSelect
          />
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">常见问题</h2>
          <ul className="mt-3 space-y-3">
            {faqs.map((f) => (
              <li key={f.question}>
                <h3 className="text-[13px] font-semibold text-[color:var(--ink-2)]">{f.question}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{f.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppPage>
  );
}
