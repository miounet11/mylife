import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionGrid from '@/components/dimensions/dimension-grid';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { listDimensionsByPriority, MVP_DIMENSION_SLUGS, DIMENSIONS } from '@/lib/dimensions/config';
import type { DimensionSlug } from '@/lib/dimensions/types';
import { parseSourceIntent } from '@/lib/dimensions/intent-source';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import {
  dimensionUiCopy,
  dimensionsHubSeo,
  intentUiCopy,
} from '@/lib/i18n/dimensions-copy';
import { dimensionsHubCopy } from '@/lib/i18n/hub-copy';
import { illustStripTitle, toIllustLocale } from '@/lib/page-illustrations/locale';
import {
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildPageMetadata,
  buildServiceJsonLd,
  withLocalePrefix,
} from '@/lib/seo';
import { buildTeacherChatHref } from '@/lib/teachers';

/** Compact hub CTAs — opening mode, no reportId */
const DIMENSIONS_CONSULTANT_IDS = [
  'overview',
  'career',
  'timing',
  'wealth',
] as const satisfies ReadonlyArray<keyof ReturnType<typeof dimensionsHubCopy>['consultants']>;

interface DimensionsPageProps {
  searchParams?: Promise<{ source?: string; intent?: string; lang?: string }>;
}

export async function generateMetadata({ searchParams }: DimensionsPageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const seo = dimensionsHubSeo(locale);
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: withLocalePrefix('/dimensions', locale),
    locale,
    keywords: seo.keywords,
  });
}

export default async function DimensionsPage({ searchParams }: DimensionsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const source = `${sp.source || sp.intent || ''}`.trim();
  const intent = parseSourceIntent(source);
  const uiLocale = await getRequestLocale(sp.lang);
  const copy = dimensionsHubCopy(uiLocale);
  const intentCopy = intentUiCopy(uiLocale);
  const illustLocale = toIllustLocale(uiLocale);
  const p0 = listDimensionsByPriority('p0');
  const p1Count = listDimensionsByPriority('p1').length;
  const p2Count = listDimensionsByPriority('p2').length;
  const primary = intentCopy.primaryCta[intent];
  const primaryHref = source
    ? `${primary.href}${primary.href.includes('?') ? '&' : '?'}source=${encodeURIComponent(source)}`
    : primary.href;
  const intentLabel = intentCopy.labels[intent];

  const itemList = buildItemListJsonLd(
    '人生K线十维度深度研判',
    DIMENSIONS.map((item) => ({ name: item.title, path: `/dimensions/${item.slug}` })),
  );
  const service = buildServiceJsonLd({
    name: '人生K线十维度深度研判',
    description: '问题导向的命理场景研判，输出结构判断、行动建议与可回访预测。',
    path: '/dimensions',
    areaServed: ['中国', '北美华人社区', '澳洲华人社区', '欧洲华人社区', '东亚华人社区'],
  });
  const faq = buildFaqJsonLd([
    {
      question: '十维度和完整八字报告有什么区别？',
      answer:
        '完整报告看全局结构；十维度先回答一个具体问题（如行业、投资、婚恋）。可先维度后报告，也可先报告后维度深挖。',
    },
    {
      question: '十维度结论可以验证吗？',
      answer: '可以。每条场景会输出带时间窗的预测，并同步到预测回访，支持命中/部分/未命中反馈。',
    },
    {
      question: '适合海外用户吗？',
      answer:
        '适合。结构判断基于出生信息；环境层可结合城市观察与迁移维度，用于海外华人阶段决策参考。',
    },
  ]);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: copy.ctaFullReport, compact: true }}>
      <AnalyticsPageView
        eventName="dimensions_page_viewed"
        page="/dimensions"
        meta={{
          surfaceKey: 'dimensions',
          p0Count: p0.length,
          p1Count,
          p2Count,
          source: source || null,
          intent,
        }}
      />
      <JsonLd data={itemList} />
      <JsonLd data={service} />
      <JsonLd data={faq} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-16 md:space-y-6 md:py-8">
        <FocusHero
          eyebrow={copy.eyebrow}
          title={intent === 'general' ? copy.titleGeneral : intentLabel}
          description={intentCopy.hints[intent]}
          actions={
            <>
              <Link
                href={primaryHref}
                className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                {primary.label}
              </Link>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkPredictions}
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.linkTools}
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.ctaFullReport}
              </Link>
            </>
          }
        />

        {intent !== 'general' ? (
          <p className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
            {copy.sourceWorkbench(intentLabel)}
            <Link href={primaryHref} className="mx-1 text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {primary.label}
            </Link>
            {uiLocale === 'en' ? '.' : '。'}
          </p>
        ) : null}

        <PageIllustrationStrip
          surface="dimensions/hub"
          title={illustStripTitle(uiLocale, {
            'zh-CN': '场景拆解',
            'zh-Hant': '場景拆解',
            en: 'Scene map',
          })}
          compact
          limit={1}
          locale={illustLocale}
          priority
        />

        <DimensionGrid intent={intent} source={source} locale={uiLocale} />

        <section className="space-y-2 border-t border-[color:var(--hairline)] pt-4">
          <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{copy.askTeachers}</h2>
          <p className="text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
            {copy.askTeachersDesc}
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {DIMENSIONS_CONSULTANT_IDS.map((teacherId) => (
              <Link
                key={teacherId}
                href={buildTeacherChatHref({
                  teacherId,
                  source: 'dimensions_hub_consultant',
                })}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
              >
                {copy.consultants[teacherId]}
              </Link>
            ))}
            <Link
              href="/teachers"
              className="text-[12px] text-[color:var(--ink-5)] underline-offset-2 hover:text-[color:var(--ink-3)] hover:underline"
            >
              {copy.allConsultants}
            </Link>
          </nav>
        </section>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.ctaFullReport}
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkTeachers}
          </Link>
          <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkHehun}
          </Link>
          <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            {copy.linkLearn}
          </Link>
        </nav>

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          {copy.openScenes(MVP_DIMENSION_SLUGS.length)}
          {p0.length
            ? ` · ${copy.commonPrefix}：${p0
                .map((item) => dimensionUiCopy(uiLocale, item.slug as DimensionSlug).title)
                .join(uiLocale === 'en' ? ', ' : '、')}`
            : ''}
          {p1Count || p2Count ? ` · ${copy.expandingCount(p1Count + p2Count)}` : ''}
          {uiLocale === 'en' ? '.' : '。'}
        </p>
      </div>
    </AppPage>
  );
}
