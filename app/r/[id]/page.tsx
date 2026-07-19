import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import ReportEmailCapture from '@/components/report/report-email-capture';
import ReportMembershipPanel from '@/components/membership/report-membership-panel';
import ReportChapterDock, {
  type ReportChapterDockItem,
} from '@/components/report/report-chapter-dock';
import ReportMetaSidebar from '@/components/report/report-meta-sidebar';
import ResultLocaleSummary from '@/components/report/result-locale-summary';
import { getCurrentUserId } from '@/lib/user-utils';
import { fortuneOperations } from '@/lib/database';
import { resolveTimingProfileForFortune } from '@/lib/life-timing/resolve-timing-profile';
import {
  buildReportChatSource,
  buildReportContinueChatHref,
} from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { resultChrome } from '@/lib/i18n/result-chrome';
import { buildResultPageMetadata } from '@/lib/i18n/result-metadata';
import { localizePublicReportSeo } from '@/lib/i18n/public-report-seo';
import { buildPublicReportSeo } from '@/lib/public-growth-feed';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ source?: string; lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const locale = await getRequestLocale(sp.lang);
  try {
    const fortune = fortuneOperations.getById(id);
    if (fortune) {
      const isPublic = fortune.isPublic !== false;
      const publicSeo = buildPublicReportSeo(fortune);
      const localized = localizePublicReportSeo(publicSeo, locale, id);
      return buildResultPageMetadata({
        id,
        locale,
        publicTitle: localized.title,
        publicDescription: localized.description,
        patternType: publicSeo.patternType || localized.patternType,
        dayMaster: publicSeo.dayMaster || localized.dayMaster,
        isPublic,
        pathBase: '/r',
      });
    }
  } catch {
    // ignore
  }
  return buildResultPageMetadata({ id, locale, isPublic: false, pathBase: '/r' });
}

export default async function ResultV2Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const entrySource = resolvedSearchParams.source?.trim() || '';
  const locale = await getRequestLocale(resolvedSearchParams.lang);
  const chrome = resultChrome(locale);
  const t = (zh: string, en: string) =>
    locale === 'en' ? en : locale === 'zh-Hant' ? toSiteLocaleText(zh, 'zh-Hant') : zh;

  const fortune = fortuneOperations.getById(id);
  if (!fortune) notFound();

  const currentUserId = await getCurrentUserId();
  const canManage = !!currentUserId && fortune.userId === currentUserId;
  if (fortune.isPublic === false && !canManage) notFound();

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
  const reportChatHref = buildReportContinueChatHref({
    reportId: id,
    teacher: 'career',
    intent: 'next-action',
    window: locale === 'en' ? 'Next actions: today / 7d / 30d' : '下一步：今天 / 7天 / 30天',
    source: reportChatSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  // 完整报告默认即正常用户主报告（不必再带 view=full）
  const fullReportHref = entrySource
    ? `/result/${id}?source=${encodeURIComponent(entrySource)}`
    : `/result/${id}`;

  const pastCount = record.past_validations?.length || 0;
  const d30Count = record.next_30_days?.length || 0;
  const d12Count = record.next_12_months?.length || 0;
  const d5Count = record.next_5_years?.length || 0;

  // 悬浮导航：只传可序列化 iconKey
  const chapterDockItems: ReportChapterDockItem[] = [
    { id: 'portrait', label: t('① 命盘画像', '① Portrait'), iconKey: 'layers' },
    { id: 'past', label: t('② 过去验证', '② Past'), iconKey: 'check' },
    { id: 'next-30d', label: t('③ 未来 30 天', '③ 30 days'), iconKey: 'calendar' },
    { id: 'next-12m', label: t('④ 未来 12 月', '④ 12 months'), iconKey: 'calendar' },
    { id: 'next-5y', label: t('⑤ 未来 5 年', '⑤ 5 years'), iconKey: 'target' },
    { id: 'detailed', label: t('⑥ 四柱细节', '⑥ Details'), iconKey: 'compass' },
    { id: 'subscribe', label: t('⑦ 订阅提醒', '⑦ Alerts'), iconKey: 'bell' },
  ];

  const generatedAtIso =
    (displayFortune as { createdAt?: string }).createdAt ||
    (displayFortune as { updatedAt?: string }).updatedAt ||
    null;

  let publicSeo: ReturnType<typeof buildPublicReportSeo> | null = null;
  try {
    publicSeo = buildPublicReportSeo(displayFortune);
  } catch {
    publicSeo = null;
  }
  const localizedSeo = publicSeo ? localizePublicReportSeo(publicSeo, locale, id) : null;

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
          locale,
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel={chrome.ctaReanalyze} />

      <ReportChapterDock
        items={chapterDockItems}
        title={t('时间地图', 'Timing map')}
        locale={locale}
      />

      <main className="page-frame py-6 pb-28 md:py-8 md:pb-16">
        <ResultLocaleSummary
          locale={locale}
          reportId={id}
          publicSeo={localizedSeo || publicSeo}
          className="mb-3"
        />

        {/* 页首：极简导读 + 双入口 */}
        <section className="mb-4 fb-card border-t-2 border-t-[#3b5998] p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3b5998]">
                {t('摘要版 · 时间地图', 'Summary · Timing map')}
              </div>
              <h1 className="mt-1.5 text-[20px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[24px]">
                {t('先看关键时点，再进入完整报告', 'Key timing first, then the full report')}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
                {t(
                  '本页只整理：画像 → 过去验证 → 30 天 / 12 月 / 5 年窗口。结构总览、行动板与证据层在完整报告。',
                  'This page covers portrait, past checks, and 30-day / 12-month / 5-year windows. Structure and actions live in the full report.',
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={fullReportHref}
                className="fb-btn fb-btn-primary inline-flex h-9 items-center px-3.5 text-[12px]"
              >
                {t('查看完整报告', 'Open full report')}
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-9 items-center rounded-[3px] border border-[color:var(--hairline)] px-3 text-[12px] font-semibold text-[color:var(--ink-3)] transition hover:bg-[#e9ebee] hover:text-[#3b5998]"
              >
                {t('我的档案', 'My profile')}
              </Link>
            </div>
          </div>

          {/* 窗口数量速览 */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label={t('过去验证', 'Past')} value={pastCount} hint={t('条', 'items')} />
            <StatChip label={t('未来 30 天', '30 days')} value={d30Count} hint={t('时点', 'points')} />
            <StatChip label={t('未来 12 月', '12 months')} value={d12Count} hint={t('时点', 'points')} />
            <StatChip label={t('未来 5 年', '5 years')} value={d5Count} hint={t('节点', 'nodes')} />
          </div>
        </section>

        {/* 正文 + 右侧 meta */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:mx-auto 2xl:max-w-[1100px]">
          <div className="min-w-0 space-y-3 md:space-y-4">
            {/* ① 画像 + 行动入口 */}
            <section
              id="portrait"
              className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[13px] font-bold text-[color:var(--ink-1)]">
                  {t('① 命盘画像', '① Portrait')}
                </div>
                <span className="text-[11px] text-[color:var(--ink-4)]">
                  {t('一句话读懂主轴', 'One-line structural read')}
                </span>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
                <PortraitBlock
                  baziPillars={record.baziPillars}
                  pattern={pattern || undefined}
                  locale={locale}
                />
                <div className="flex flex-col justify-between rounded-[10px] border border-[color:var(--hairline)] bg-[#f7f9fc] p-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
                      {t('把地图变成动作', 'Turn map into action')}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">
                      {t(
                        '不要读完就停。把时间地图拆成今天、7 天内、30 天内三步。',
                        'Do not stop at reading. Split the map into today, 7 days, and 30 days.',
                      )}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <ResultCtaLink
                      href={reportChatHref}
                      page={`/r/${id}`}
                      target="result_timing_followup_chat"
                      meta={{
                        reportId: id,
                        source: reportChatSource,
                        ctaStrategyKey: sourceCtaStrategy.strategyKey,
                        sourceFamily: sourceCtaStrategy.sourceFamily,
                        locale,
                      }}
                      className="fb-btn fb-btn-primary inline-flex h-9 items-center justify-center text-[12px]"
                    >
                      {locale === 'en'
                        ? 'Break into 3 actions'
                        : sourceCtaStrategy.reportPrimaryLabel || '拆成三步动作'}
                    </ResultCtaLink>
                    <Link
                      href={fullReportHref}
                      className="inline-flex h-9 items-center justify-center rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 text-[12px] font-semibold text-[color:var(--ink-2)] transition hover:border-[#3b5998] hover:text-[#3b5998]"
                    >
                      {t('需要结构细节 → 完整报告', 'Need structure detail → full report')}
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 时间轴主线 */}
            <div className="rounded-[12px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3b5998]">
                    {t('时间主线', 'Timing spine')}
                  </div>
                  <h2 className="mt-0.5 text-[16px] font-bold text-[color:var(--ink-1)]">
                    {t('过去 → 近窗 → 年度 → 五年', 'Past → near → yearly → 5 years')}
                  </h2>
                </div>
                <p className="text-[11px] text-[color:var(--ink-4)]">
                  {t('右侧/底部可悬浮跳转', 'Jump via floating chapter nav')}
                </p>
              </div>

              <div className="space-y-3">
                <section id="past" className="scroll-mt-header">
                  <SectionLabel
                    index="②"
                    title={t('过去验证', 'Past validation')}
                    count={pastCount}
                    countLabel={t('条印证', 'checks')}
                  />
                  <PastValidationBlock validations={record.past_validations} locale={locale} />
                </section>

                <section id="next-30d" className="scroll-mt-header">
                  <SectionLabel
                    index="③"
                    title={t('未来 30 天', 'Next 30 days')}
                    count={d30Count}
                    countLabel={t('个时点', 'points')}
                    tone="now"
                  />
                  <Next30DaysBlock points={record.next_30_days} locale={locale} />
                </section>

                <section id="next-12m" className="scroll-mt-header">
                  <SectionLabel
                    index="④"
                    title={t('未来 12 个月', 'Next 12 months')}
                    count={d12Count}
                    countLabel={t('个时点', 'points')}
                    tone="mid"
                  />
                  <Next12MonthsBlock points={record.next_12_months} locale={locale} />
                </section>

                <section id="next-5y" className="scroll-mt-header">
                  <SectionLabel
                    index="⑤"
                    title={t('未来 5 年', 'Next 5 years')}
                    count={d5Count}
                    countLabel={t('个节点', 'nodes')}
                    tone="far"
                  />
                  <Next5YearsBlock
                    transitions={record.next_5_years}
                    baziPillars={record.baziPillars}
                    locale={locale}
                  />
                </section>
              </div>
            </div>

            <section id="detailed" className="scroll-mt-header">
              <SectionLabel
                index="⑥"
                title={t('四柱细节', 'Pillar details')}
                countLabel={t('可折叠', 'collapsible')}
              />
              <DetailedFoldBlock baziPillars={record.baziPillars} locale={locale} />
            </section>

            <section id="subscribe" className="scroll-mt-header space-y-3">
              <SectionLabel
                index="⑦"
                title={t('订阅与会员', 'Subscribe & membership')}
                countLabel={t('持续复访', 'follow-up')}
              />
              <ReportMembershipPanel reportId={id} source="r_summary_report" />
              <ReportEmailCapture
                reportId={id}
                surfaceKey={`r_inline:${id}`}
                locale={locale}
                variant="inline"
              />
            </section>

            {/* 底部双 CTA */}
            <section className="fb-card border border-[color:var(--hairline)] p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[color:var(--ink-1)]">
                    {t('读完摘要后', 'After the summary')}
                  </div>
                  <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                    {t(
                      '完整报告含结构总览、行动板、K 线与证据层；或先用 AI 拆动作。',
                      'Full report has structure, action board, K-line and evidence; or ask AI to break actions.',
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={fullReportHref}
                    className="fb-btn fb-btn-primary inline-flex h-9 items-center px-3.5 text-[12px]"
                  >
                    {t('进入完整报告', 'Open full report')}
                  </Link>
                  <ResultCtaLink
                    href={reportChatHref}
                    page={`/r/${id}`}
                    target="result_timing_followup_chat_footer"
                    meta={{
                      reportId: id,
                      source: reportChatSource,
                      ctaStrategyKey: sourceCtaStrategy.strategyKey,
                      sourceFamily: sourceCtaStrategy.sourceFamily,
                      locale,
                    }}
                    className="inline-flex h-9 items-center rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 text-[12px] font-semibold text-[color:var(--ink-2)]"
                  >
                    {t('AI 拆三步', 'AI 3 steps')}
                  </ResultCtaLink>
                </div>
              </div>
            </section>
          </div>

          <ReportMetaSidebar
            reportId={id}
            isPublic={displayFortune.isPublic !== false}
            generatedAt={generatedAtIso}
            reportVersion="timing-v2"
            modelChainLabel={null}
            qualityLabel={t('摘要版', 'Summary')}
            locale={locale}
          />
        </div>
      </main>

      <TimingSubscribeBar surfaceKey={`r:${id}`} reportId={id} locale={locale} />
      <TimingRecallTracker reportId={id} />
      <SiteFooter />
    </div>
  );
}

function StatChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[10px] border border-[color:var(--hairline)] bg-[#f7f9fc] px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-4)]">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[20px] font-bold tabular-nums text-[color:var(--ink-1)]">{value}</span>
        <span className="text-[11px] text-[color:var(--ink-4)]">{hint}</span>
      </div>
    </div>
  );
}

function SectionLabel({
  index,
  title,
  count,
  countLabel,
  tone = 'default',
}: {
  index: string;
  title: string;
  count?: number;
  countLabel?: string;
  tone?: 'default' | 'now' | 'mid' | 'far';
}) {
  const toneClass =
    tone === 'now'
      ? 'text-[color:var(--data-up)]'
      : tone === 'mid'
        ? 'text-[#3b5998]'
        : tone === 'far'
          ? 'text-[color:var(--ink-3)]'
          : 'text-[color:var(--ink-1)]';

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
      <div className={`text-[14px] font-bold ${toneClass}`}>
        <span className="mr-1.5 opacity-70">{index}</span>
        {title}
      </div>
      {typeof count === 'number' ? (
        <span className="rounded-full bg-[color:var(--bg-elevated)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
          {count} {countLabel}
        </span>
      ) : countLabel ? (
        <span className="text-[11px] text-[color:var(--ink-4)]">{countLabel}</span>
      ) : null}
    </div>
  );
}

function extractPatternFromAnalysis(analysis: unknown): string | undefined {
  if (!analysis) return undefined;
  if (typeof analysis === 'object' && analysis !== null) {
    const pattern = (analysis as { pattern?: { type?: string } }).pattern;
    if (pattern?.type) return pattern.type;
    return undefined;
  }
  if (typeof analysis === 'string') {
    try {
      const parsed = JSON.parse(analysis);
      if (parsed?.pattern?.type) return parsed.pattern.type;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
