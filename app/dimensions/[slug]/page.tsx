import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentActionRail from '@/components/content/content-action-rail';
import JourneyStrip from '@/components/content/journey-strip';
import { CapabilityIllustrationPanel } from '@/components/content/capability-illustration-panel';
import DimensionPageBody from '@/components/dimensions/dimension-page-body';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { getDimension } from '@/lib/dimensions/config';
import { isDimensionRunnable } from '@/lib/dimensions/run-dimension-advisor';
import { resolveDimensionOutbound } from '@/lib/content-crosslinks';
import type { DimensionSlug } from '@/lib/dimensions/types';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import {
  dimensionDetailCopy,
  dimensionDetailSeo,
  dimensionUiCopy,
} from '@/lib/i18n/dimensions-copy';
import { dimensionCapabilitySurface } from '@/lib/page-illustrations/capability-map';
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
  buildServiceJsonLd,
  withLocalePrefix,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const dimension = getDimension(slug);
  if (!dimension) {
    return {
      title: locale === 'en' ? 'Dimension analysis' : '维度研判',
    };
  }
  const seo = dimensionDetailSeo(locale, slug as DimensionSlug);
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: withLocalePrefix(`/dimensions/${slug}`, locale),
    locale,
    keywords: seo.keywords,
  });
}

export default async function DimensionDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const uiLocale = await getRequestLocale(sp.lang);
  const dimension = getDimension(slug);
  if (!dimension) notFound();

  const ui = dimensionUiCopy(uiLocale, slug as DimensionSlug);
  const copy = dimensionDetailCopy(uiLocale);
  const runnable = isDimensionRunnable(slug);
  const outbound = resolveDimensionOutbound(slug as DimensionSlug);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '十维度', path: '/dimensions' },
    { name: ui.title, path: `/dimensions/${slug}` },
  ]);
  const service = buildServiceJsonLd({
    name: `${ui.title}深度研判`,
    description: ui.description,
    path: `/dimensions/${slug}`,
  });
  const faq = buildFaqJsonLd([
    {
      question: ui.question,
      answer: `${ui.description} 系统会基于命盘结构与大运流年给出结论、行动建议与可验证预测。`,
    },
    {
      question: `如何验证「${ui.title}」判断？`,
      answer: '研判结果会生成带时间窗的预测，同步到预测回访后可对命中情况进行反馈校准。',
    },
  ]);

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: copy.allDimensions }}>
      <AnalyticsPageView
        eventName="dimension_page_viewed"
        page={`/dimensions/${slug}`}
        meta={{
          surfaceKey: 'dimensions',
          slug,
          title: dimension.title,
          priority: dimension.priority,
          runnable,
        }}
      />
      <JsonLd data={breadcrumb} />
      <JsonLd data={service} />
      <JsonLd data={faq} />
      <FocusHero
        eyebrow={dimension.priority === 'p0' ? copy.eyebrowP0 : copy.eyebrowDefault}
        title={ui.title}
        description={ui.question}
        actions={
          <>
            {runnable ? (
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {copy.predictions}
              </Link>
            ) : null}
            <Link href={outbound.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {copy.fullReport}
            </Link>
            <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {copy.tools}
            </Link>
            <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {copy.consultants}
            </Link>
          </>
        }
        footer={
          <div className="space-y-1">
            <p>{ui.description}</p>
            {ui.disclaimer ? (
              <p className="text-[color:var(--ink-4)]">{ui.disclaimer}</p>
            ) : null}
          </div>
        }
      />
      <JourneyStrip active="dimensions" locale={uiLocale} />
      <div className="mx-auto max-w-3xl px-4">
        <CapabilityIllustrationPanel
          surface={dimensionCapabilitySurface(slug)}
          title={copy.capabilityTitle(ui.title)}
          compact
          priority
          showCopy={false}
        />
      </div>
      <DimensionPageBody dimension={dimension} runnable={runnable} locale={uiLocale} />
      <div className="mt-4">
        <ContentActionRail
          crosslinks={outbound}
          title={copy.afterRailTitle}
          description={copy.afterRailDescription}
        />
      </div>
    </AppPage>
  );
}
