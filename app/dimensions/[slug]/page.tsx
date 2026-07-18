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
import { dimensionCapabilitySurface } from '@/lib/page-illustrations/capability-map';
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildServiceJsonLd,
  dimensionSeo,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dimension = getDimension(slug);
  if (!dimension) return { title: '维度研判' };
  return dimensionSeo(slug as DimensionSlug);
}

export default async function DimensionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dimension = getDimension(slug);
  if (!dimension) notFound();

  const runnable = isDimensionRunnable(slug);
  const outbound = resolveDimensionOutbound(slug as DimensionSlug);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '十维度', path: '/dimensions' },
    { name: dimension.title, path: `/dimensions/${slug}` },
  ]);
  const service = buildServiceJsonLd({
    name: `${dimension.title}深度研判`,
    description: dimension.description,
    path: `/dimensions/${slug}`,
  });
  const faq = buildFaqJsonLd([
    {
      question: dimension.question,
      answer: `${dimension.description} 系统会基于命盘结构与大运流年给出结论、行动建议与可验证预测。`,
    },
    {
      question: `如何验证「${dimension.title}」判断？`,
      answer: '研判结果会生成带时间窗的预测，同步到预测回访后可对命中情况进行反馈校准。',
    },
  ]);

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '全部维度' }}>
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
        eyebrow={dimension.priority === 'p0' ? '推荐 · 维度' : '维度'}
        title={dimension.title}
        description={dimension.question}
        actions={
          <>
            {runnable ? (
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
            ) : null}
            <Link href={outbound.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              完整报告
            </Link>
            <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              工具
            </Link>
            <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              请老师
            </Link>
          </>
        }
        footer={
          <div className="space-y-1">
            <p>{dimension.description}</p>
            {dimension.disclaimer ? (
              <p className="text-[color:var(--ink-4)]">{dimension.disclaimer}</p>
            ) : null}
          </div>
        }
      />
      <JourneyStrip active="dimensions" />
      <div className="mx-auto max-w-3xl px-4">
        <CapabilityIllustrationPanel
          surface={dimensionCapabilitySurface(slug)}
          title={`${dimension.title}：能解决什么`}
          compact
          priority
          showCopy={false}
        />
      </div>
      <DimensionPageBody dimension={dimension} runnable={runnable} />
      <div className="mt-4">
        <ContentActionRail
          crosslinks={outbound}
          title="研判之后：继续联动"
          description="相邻维度、免费工具与完整报告，帮助你把单一场景结论扩展成完整行动链路。"
        />
      </div>
    </AppPage>
  );
}
