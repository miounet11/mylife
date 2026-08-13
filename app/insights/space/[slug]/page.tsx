import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import {
  articleSeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo';
import { SpaceSeoPlanSvg } from '@/components/fengshui/space-seo-plan-svg';
import { SpaceSeoStage } from '@/components/fengshui/space-seo-stage';
import { getSpaceSeoScenario, listSpaceSeoScenarios } from '@/lib/fengshui/space/seo-catalog';
import { buildSpaceSeoReport, snapshotSpaceSeoScene } from '@/lib/fengshui/space/seo-report';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listSpaceSeoScenarios().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getSpaceSeoScenario(slug);
  if (!s) return { title: '空间场报告' };
  const report = buildSpaceSeoReport(s);
  return articleSeo({
    title: `${s.title}｜空间场｜人生K线`,
    summary: report.summary.slice(0, 160),
    path: report.path,
    type: 'insight',
    keywords: s.keywords.slice(0, 8),
    answerSummary: report.answerSummary,
    searchIntents: [s.intent, ...s.keywords.slice(0, 3)],
    entityKeywords: s.keywords,
    geoPlaceName: s.cityName || null,
  });
}

export default async function SpaceSeoReportPage({ params }: Props) {
  const { slug } = await params;
  const s = getSpaceSeoScenario(slug);
  if (!s) notFound();
  const report = buildSpaceSeoReport(s);
  const snapshot = snapshotSpaceSeoScene(s);

  return (
    <AppPage header={{ ctaHref: report.ctaHref, ctaLabel: '打开工作台', compact: true }}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '空间场报告', path: '/insights/space' },
          { name: s.title, path: report.path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: s.title,
          description: report.answerSummary,
          path: report.path,
        })}
      />
      <JsonLd data={buildFaqJsonLd(report.faqs)} />
      <AnalyticsPageView
        eventName="space_seo_report_viewed"
        page={report.path}
        meta={{ cluster: s.cluster, layout: s.layout, facing: s.facing, geoReady: true }}
      />

      <article className="page-content space-y-6 py-6 pb-16 md:py-8">
        <header className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            空间场结构报告
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
            {s.title}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-3)]">{report.answerSummary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
            <Link
              href={report.ctaHref}
              className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {report.ctaLabel}
            </Link>
            <Link href="/insights/space" className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
              全部结构报告
            </Link>
            <Link href="/analyze?source=space_seo" className="text-[color:var(--ink-4)] underline-offset-2 hover:underline">
              用我的命盘做人宅合参
            </Link>
          </div>
        </header>

        <SpaceSeoStage slug={s.slug} snapshot={snapshot} />
        <noscript>
          <div className="overflow-hidden rounded-[12px] border border-[color:var(--hairline)]">
            <SpaceSeoPlanSvg snap={snapshot} className="h-auto w-full" />
          </div>
        </noscript>

        <dl className="grid grid-cols-2 divide-x divide-[color:var(--hairline)] border border-[color:var(--hairline)] text-center sm:grid-cols-4">
          <div className="p-3">
            <dt className="text-[11px] text-[color:var(--ink-5)]">峰值</dt>
            <dd className="text-[18px] font-semibold tabular-nums">{(report.metrics.peakEnergy * 100).toFixed(0)}</dd>
          </div>
          <div className="p-3">
            <dt className="text-[11px] text-[color:var(--ink-5)]">均值</dt>
            <dd className="text-[18px] font-semibold tabular-nums">{(report.metrics.avgEnergy * 100).toFixed(0)}</dd>
          </div>
          <div className="p-3">
            <dt className="text-[11px] text-[color:var(--ink-5)]">滞留</dt>
            <dd className="text-[18px] font-semibold tabular-nums">
              {(report.metrics.stagnationRatio * 100).toFixed(0)}%
            </dd>
          </div>
          <div className="p-3">
            <dt className="text-[11px] text-[color:var(--ink-5)]">面积</dt>
            <dd className="text-[18px] font-semibold tabular-nums">{report.metrics.areaSqm.toFixed(0)}㎡</dd>
          </div>
        </dl>

        {report.sections.map((sec) => (
          <section key={sec.id} className="border-t border-[color:var(--hairline)] pt-4">
            <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">{sec.heading}</h2>
            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[color:var(--ink-3)]">{sec.body}</p>
          </section>
        ))}

        {report.priorityActions.length ? (
          <section className="border-t border-[color:var(--hairline)] pt-4">
            <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">优先动作</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] text-[color:var(--ink-3)]">
              {report.priorityActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="border-t border-[color:var(--hairline)] pt-4">
          <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">常见问题</h2>
          <dl className="mt-2 space-y-3">
            {report.faqs.map((f) => (
              <div key={f.question}>
                <dt className="text-[14px] font-medium text-[color:var(--ink-1)]">{f.question}</dt>
                <dd className="mt-0.5 text-[13px] leading-relaxed text-[color:var(--ink-4)]">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {report.related.length ? (
          <section className="border-t border-[color:var(--hairline)] pt-4">
            <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">相关结构报告</h2>
            <ul className="mt-2 divide-y divide-[color:var(--hairline)]">
              {report.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="block py-2 text-[14px] text-[color:var(--ink-2)] hover:underline">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-[12px] leading-relaxed text-[color:var(--ink-5)]">{report.disclaimer}</p>
      </article>
    </AppPage>
  );
}
