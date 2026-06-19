import { notFound } from 'next/navigation';
import { getCurrentUserId } from '@/lib/user-utils';
import Link from 'next/link';
import { CalendarDays, History, Calendar, CalendarRange, Layers, Mail } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ResultCtaLink from '@/components/result-cta-link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import PortraitBlock from '@/components/result-v2/portrait-block';
import PastValidationBlock from '@/components/result-v2/past-validation-block';
import Next30DaysBlock from '@/components/result-v2/next-30-days-block';
import Next12MonthsBlock from '@/components/result-v2/next-12-months-block';
import Next5YearsBlock from '@/components/result-v2/next-5-years-block';
import DetailedFoldBlock from '@/components/result-v2/detailed-fold-block';
import TimingSubscribeBar from '@/components/result-v2/timing-subscribe-bar';
import TimingRecallTracker from '@/components/result-v2/timing-recall-tracker';
import ReportAnchorRail, { type ReportAnchorRailItem } from '@/components/report/report-anchor-rail';
import ReportMetaSidebar from '@/components/report/report-meta-sidebar';
import { fortuneOperations } from '@/lib/database';
import { resolveTimingProfileForFortune } from '@/lib/life-timing/resolve-timing-profile';
import { buildChatHref, buildReportChatSource } from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-cta';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ source?: string }>;
}

export default async function ResultV2Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const entrySource = resolvedSearchParams.source?.trim() || '';
  const fortune = fortuneOperations.getById(id);
  if (!fortune) notFound();

  const currentUserId = await getCurrentUserId();
  const canManage = !!currentUserId && fortune.userId === currentUserId;
  if (fortune.isPublic === false && !canManage) notFound();

  // timing profile 必须用原始 fortune（含真 birthDate/userId）才能算并命中缓存
  // sanitize 只用于面向访客展示的字段（name/birthDate/birthPlace），但本页面只渲染
  // baziPillars + pattern，不展示 PII；为简单起见直接用原始 fortune
  const displayFortune = fortune;
  const resolved = resolveTimingProfileForFortune({
    id: displayFortune.id,
    userId: displayFortune.userId,
    birthDate: displayFortune.birthDate,
    birthTime: displayFortune.birthTime,
    gender: displayFortune.gender,
    analysis: displayFortune.analysis,
  });
  if (!resolved) notFound();

  const record = resolved.record;
  const pattern = extractPatternFromAnalysis(displayFortune.analysis);
  const sourceCtaStrategy = buildSourceCtaStrategy(entrySource);
  const reportChatSource = buildReportChatSource(entrySource);
  const reportChatHref = buildChatHref({
    reportId: id,
    intent: 'next-action',
    question: '请把这份报告接下来最该做的一步，拆成今天、7 天内、30 天内三个动作。',
    source: reportChatSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const fullReportHref = entrySource
    ? `/result/${id}?view=full&source=${encodeURIComponent(entrySource)}`
    : `/result/${id}?view=full`;

  // v5-D60 timeline 锚点
  const railItems: ReportAnchorRailItem[] = [
    { id: 'portrait', label: '画像', icon: Layers },
    { id: 'past', label: '过去验证', icon: History },
    { id: 'next-30d', label: '未来 30 天', icon: CalendarDays },
    { id: 'next-12m', label: '未来 12 个月', icon: Calendar },
    { id: 'next-5y', label: '未来 5 年', icon: CalendarRange },
    { id: 'detailed', label: '展开细节', icon: Layers },
    { id: 'subscribe', label: '邮件订阅', icon: Mail },
  ];

  const generatedAtIso = (displayFortune as { createdAt?: string }).createdAt
    || (displayFortune as { updatedAt?: string }).updatedAt
    || null;

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <AnalyticsPageView
        eventName="report_viewed"
        page={`/r/${id}`}
        meta={{
          reportId: id,
          isPublic: displayFortune.isPublic,
          reportVersion: 'timing-v2',
          source: entrySource || null,
        }}
      />
      <SiteHeader />
      <main className="page-frame py-6 pb-28 md:py-8 md:pb-12">
        <section className="mb-3 fb-card border-t-2 border-t-[#3b5998] p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#3b5998]">
                摘要版 · 时间地图
              </div>
              <h1 className="mt-2 text-[22px] font-bold leading-[1.28] text-[color:var(--ink-1)] md:text-[28px]">
                先看关键时点，再进入完整报告。
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
                当前页只整理过去验证、未来 30 天、12 个月和 5 年窗口。完整报告还包含个人结构总览、深入命理细节、行动建议和验证闭环。
              </p>
            </div>

            <div className="flex flex-col gap-2 md:min-w-[220px]">
              <Link
                href={fullReportHref}
                className="fb-btn fb-btn-primary inline-flex items-center justify-center"
              >
                查看完整报告
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-[3px] border border-[color:var(--hairline)] px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-3)] transition hover:bg-[#e9ebee] hover:text-[#3b5998]"
              >
                我的档案
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-[12px] font-semibold text-[color:var(--ink-3)] md:grid-cols-3">
            <div className="rounded-[3px] bg-[#f6f7f9] px-3 py-2">摘要版：时间窗口</div>
            <div className="rounded-[3px] bg-[#f6f7f9] px-3 py-2">完整版：结构与细节</div>
            <div className="rounded-[3px] bg-[#f6f7f9] px-3 py-2">下一步：行动与验证</div>
          </div>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          <ReportAnchorRail items={railItems} title="时间地图" />

          <div className="min-w-0 flex-1 lg:max-w-[680px] space-y-2">
            <section
              id="portrait"
              className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)] md:items-stretch">
                <PortraitBlock
                  baziPillars={record.baziPillars}
                  pattern={pattern || undefined}
                />

                <div className="flex flex-col justify-between rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] p-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#3b5998]">
                      下一步
                    </div>
                    <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--ink-2)]">
                      不要读完就停。把这份时间地图变成今天、7 天内、30 天内的动作。
                    </p>
                  </div>
                  <ResultCtaLink
                    href={reportChatHref}
                    page={`/r/${id}`}
                    target="result_timing_followup_chat"
                    meta={{
                      reportId: id,
                      source: reportChatSource,
                      ctaStrategyKey: sourceCtaStrategy.strategyKey,
                      sourceFamily: sourceCtaStrategy.sourceFamily,
                    }}
                    className="fb-btn fb-btn-primary mt-3 inline-flex items-center justify-center"
                  >
                    {sourceCtaStrategy.reportPrimaryLabel}
                  </ResultCtaLink>
                </div>
              </div>
            </section>

            <section id="past" className="scroll-mt-header">
              <PastValidationBlock validations={record.past_validations} />
            </section>

            <section id="next-30d" className="scroll-mt-header">
              <Next30DaysBlock points={record.next_30_days} />
            </section>

            <section id="next-12m" className="scroll-mt-header">
              <Next12MonthsBlock points={record.next_12_months} />
            </section>

            <section id="next-5y" className="scroll-mt-header">
              <Next5YearsBlock
                transitions={record.next_5_years}
                baziPillars={record.baziPillars}
              />
            </section>

            <section id="detailed" className="scroll-mt-header">
              <DetailedFoldBlock baziPillars={record.baziPillars} />
            </section>

            <section
              id="subscribe"
              className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 text-center"
            >
              <p className="text-[14px] font-bold text-[color:var(--ink-1)] mb-1 leading-[1.34]">
                上面这些时点，我们会在邮件里提前告诉你
              </p>
              <p className="text-[12px] text-[color:var(--ink-3)]">
                完全免费 · 随时可退订 · 留邮箱即可（在屏幕底部）
              </p>
            </section>
          </div>

          <ReportMetaSidebar
            reportId={id}
            isPublic={displayFortune.isPublic !== false}
            generatedAt={generatedAtIso}
            reportVersion="timing-v2"
            modelChainLabel={null}
            qualityLabel={null}
          />
        </div>
      </main>
      <TimingSubscribeBar
        surfaceKey={`r:${id}`}
        reportId={id}
      />
      <TimingRecallTracker reportId={id} />
      <SiteFooter />
    </div>
  );
}

function extractPatternFromAnalysis(analysis: unknown): string | undefined {
  if (typeof analysis !== 'string') return undefined;
  try {
    const parsed = JSON.parse(analysis);
    if (parsed?.pattern?.type) return parsed.pattern.type;
  } catch {
    return undefined;
  }
  return undefined;
}
