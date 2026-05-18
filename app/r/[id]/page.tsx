import { notFound } from 'next/navigation';
import { getCurrentUserId } from '@/lib/user-utils';
import Link from 'next/link';
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
      <main className="mx-auto max-w-4xl px-4 py-6 pb-28 md:px-6 md:py-10 md:pb-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-xs text-[color:var(--ink-3)] shadow-sm">
          <Link href="/profile" className="rounded-full px-2 py-1 font-semibold transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--brand-strong)]">
            我的档案
          </Link>
          <Link href={`/result/${id}?view=full`} className="rounded-full px-2 py-1 font-semibold transition hover:bg-[color:var(--brand-soft)] hover:text-[color:var(--brand-strong)]">
            展开完整细节
          </Link>
        </div>

        <section className="overflow-hidden rounded-[calc(var(--radius-md)+10px)] border border-[color:var(--brand-soft-2)] bg-[radial-gradient(circle_at_top_left,rgba(196,151,74,0.20),transparent_34%),linear-gradient(135deg,var(--paper),var(--brand-tint))] p-4 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] md:items-stretch">
            <PortraitBlock
              baziPillars={record.baziPillars}
              pattern={pattern || undefined}
            />

            <div className="flex flex-col justify-between rounded-[var(--radius-md)] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  下一步
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
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
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--brand)] px-5 py-3 text-center text-sm font-black text-white shadow-[0_10px_30px_rgba(147,97,32,0.22)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-strong)] hover:shadow-[0_14px_34px_rgba(147,97,32,0.28)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-soft-2)]"
              >
                {sourceCtaStrategy.reportPrimaryLabel}
              </ResultCtaLink>
            </div>
          </div>
        </section>

        <div className="mt-5 space-y-5">
          <PastValidationBlock validations={record.past_validations} />

          <Next30DaysBlock points={record.next_30_days} />

          <Next12MonthsBlock points={record.next_12_months} />

          <Next5YearsBlock
            transitions={record.next_5_years}
            baziPillars={record.baziPillars}
          />

          <DetailedFoldBlock baziPillars={record.baziPillars} />

          <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-[color:var(--ink-1)] mb-2">
              上面这些时点，我们会在邮件里提前告诉你
            </p>
            <p className="text-xs text-[color:var(--ink-3)]">
              完全免费 · 随时可退订 · 留邮箱即可（在屏幕底部）
            </p>
          </div>
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
