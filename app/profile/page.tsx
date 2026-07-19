'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, Bot, CalendarClock, History, Sparkles } from 'lucide-react';
import { useLocale } from '@/components/i18n/locale-provider';
import { AppPage } from '@/components/layout/app-page';
import { AlertBanner } from '@/components/layout/alert-banner';
import { FocusHero } from '@/components/layout/focus-hero';
import { PortalLayout } from '@/components/layout/portal-layout';
import { SectionHeader } from '@/components/layout/section-header';
import { StatGrid } from '@/components/layout/stat-grid';
import { StatusTile } from '@/components/layout/status-tile';
import { ProfileRailRight } from '@/components/profile/profile-rail';
import FreeMembershipClaimBanner from '@/components/membership/free-membership-claim-banner';
import AnalyticsPageView from '@/components/analytics-page-view';
import PersonalJourneyHub from '@/components/personal-journey-hub';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import ResultCtaLink from '@/components/result-cta-link';
import RetentionResumePanel from '@/components/retention-resume-panel';
import ProfileSettingsSummaryBanner from '@/components/profile-settings-summary-banner';
import ProgressiveProfileHub from '@/components/profile/progressive-profile-hub';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import ResumeBar from '@/components/resume-bar';
import DimensionRecommendations from '@/components/dimensions/dimension-recommendations';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import {
  profileDigestStatusLabel,
  profilePageCopy,
} from '@/lib/i18n/profile-copy';
import { buildTeacherChatHref } from '@/lib/teachers';
import { buildProfileChartData, hasProfileContent } from '@/lib/profile-page';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { resolveResumeTarget } from '@/lib/resume-target';
import { appendSourceToHref } from '@/lib/source-url';
import { toEventViewModels, type EventTransportRecord } from '@/lib/event-view';
import { abortControllerRef, fetchJsonWithTimeout } from '@/lib/utils';

// 动态导入
const UserProfile = dynamic(() => import('@/components/user-profile'), {
  loading: () => <ProfileSkeleton />,
});

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

const FortuneKLineChart = dynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <ChartSkeleton />,
});

type ProfileResponse = {
  success: boolean;
  data?: {
    user: Record<string, unknown>;
    fortunes: Record<string, unknown>[];
    events: EventTransportRecord[];
  };
  // 兼容 history API 的扁平结构
  user?: Record<string, unknown>;
  fortunes?: Record<string, unknown>[];
  events?: EventTransportRecord[];
  error?: string;
};

type UpdatesSummaryResponse = {
  success: boolean;
  authenticated?: boolean;
  data?: {
    email?: string | null;
    subscription?: {
      email: string;
      status: string;
      source?: string;
      tags?: string[];
      updatedAt?: string | null;
    } | null;
    reportCount?: number;
    activeUpgradeCount?: number;
    completedUpgradeCount?: number;
    latestReport?: {
      id: string;
      name?: string | null;
      qualityScore?: number | null;
      qualityGrade?: string | null;
    } | null;
    latestDigest?: {
      id: string;
      cycleKey?: string | null;
      status?: string | null;
      reason?: string | null;
      reportId?: string | null;
      createdAt?: string | null;
    } | null;
  } | null;
};

const PROFILE_HISTORY_TIMEOUT_MS = 12_000;
const PROFILE_UPDATES_SUMMARY_TIMEOUT_MS = 5_000;

export default function ProfilePage() {
  const { locale } = useLocale();
  const copy = useMemo(() => profilePageCopy(locale), [locale]);

  const [loading, setLoading] = useState(true);
  /** Chrome error keys localize at render; raw API errors pass through. */
  const [error, setError] = useState('');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fortunes, setFortunes] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<EventTransportRecord[]>([]);
  const [updatesSummary, setUpdatesSummary] = useState<UpdatesSummaryResponse['data'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const historyControllerRef = { current: null as AbortController | null };
    const updatesControllerRef = { current: null as AbortController | null };

    const loadHistory = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileResponse>('/api/history', {
          cache: 'no-store',
          timeoutMs: PROFILE_HISTORY_TIMEOUT_MS,
          timeoutReason: 'profile-history-timeout',
          controllerRef: historyControllerRef,
        });
        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setError(data.error || '__load_failed__');
          return;
        }

        // 兼容两种响应结构
        const userData = data.data?.user || data.user || null;
        const fortunesData = data.data?.fortunes || data.fortunes || [];
        const eventsData = data.data?.events || data.events || [];

        setUser(userData);
        setFortunes(fortunesData);
        setEvents(eventsData);
      } catch {
        if (!cancelled) {
          setError('__network__');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const loadUpdatesSummary = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<UpdatesSummaryResponse>('/api/updates/summary', {
          cache: 'no-store',
          timeoutMs: PROFILE_UPDATES_SUMMARY_TIMEOUT_MS,
          timeoutReason: 'profile-updates-summary-timeout',
          controllerRef: updatesControllerRef,
        });
        if (!cancelled && response.ok && data.success) {
          setUpdatesSummary(data.data || null);
        }
      } catch {
        // 更新摘要是附加信息，失败时保留页面主内容和默认空状态。
      }
    };

    void loadHistory();
    void loadUpdatesSummary();

    return () => {
      cancelled = true;
      abortControllerRef(historyControllerRef, 'profile-page-unmounted');
      abortControllerRef(updatesControllerRef, 'profile-page-unmounted');
    };
  }, []);

  const displayError =
    error === '__load_failed__'
      ? copy.loadFailed
      : error === '__network__'
        ? copy.networkError
        : error;

  const mappedEvents = useMemo(() => {
    return toEventViewModels(events || []);
  }, [events]);

  const chartData = useMemo(() => {
    return buildProfileChartData(fortunes);
  }, [fortunes]);

  const latestFortune = fortunes[0] as any;
  const latestResultId = latestFortune?.id;
  const pageSource = 'profile_page';

  // v5-C2 决策台风「继续上次」恢复条 — client-side simple resolve (no chat data here)
  const resumeTarget = useMemo(() => {
    if (!fortunes.length && !events.length) return null;
    return resolveResumeTarget({
      recentChat: [],
      events: (events as any[]) || [],
      reports: (fortunes as any[]) || [],
    });
  }, [fortunes, events]);

  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);
  const latestReportHref = latestResultId ? appendSourceToHref(`/result/${latestResultId}`, pageSource) : '/analyze';
  /** Opening mode: consultant first_mes, not long prefilled task dump */
  const profileChatHref = latestResultId
    ? buildReportContinueChatHref({
        reportId: latestResultId,
        teacher: 'overview',
        source: pageSource,
        ctaStrategyKey: sourceCtaStrategy.strategyKey,
        sourceFamily: sourceCtaStrategy.sourceFamily,
      })
    : buildTeacherChatHref({
        teacherId: 'overview',
        source: `${pageSource || 'profile'}_opening`,
      });
  const hasProfileData = hasProfileContent({
    user,
    fortunes,
    eventCount: mappedEvents.length,
  });
  const hasChartData = chartData.length > 0;

  return (
    <AppPage
      header={{
        ctaHref: profileChatHref,
        ctaLabel: latestResultId ? copy.headerCtaOpen : copy.headerCtaAsk,
        ctaAnalytics: {
          page: '/profile',
          target: 'profile_header_chat_opening',
          meta: {
            source: pageSource,
            ctaStrategyKey: sourceCtaStrategy.strategyKey,
            sourceFamily: sourceCtaStrategy.sourceFamily,
            reportId: latestResultId || null,
            mode: 'opening',
          },
        },
      }}
    >
      <AnalyticsPageView
        eventName="profile_page_viewed"
        page="/profile"
        meta={{
          hasProfileData,
          fortuneCount: fortunes.length,
          eventCount: mappedEvents.length,
          hasSubscription: !!updatesSummary?.subscription,
        }}
      />
      <FocusHero
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
        actions={
          <>
            <ResultCtaLink
              href={latestReportHref}
              page="/profile"
              target={latestResultId ? 'profile_header_latest_report' : 'profile_header_analyze'}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'profile_header',
                reportId: latestResultId || null,
              }}
            >
              {latestResultId ? copy.openLatestReport : copy.startAnalyze}
            </ResultCtaLink>
            <ResultCtaLink
              href={profileChatHref}
              page="/profile"
              target="profile_header_chat"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'profile_header',
                reportId: latestResultId || null,
              }}
            >
              {copy.consultantOpen}
            </ResultCtaLink>
            <ResultCtaLink
              href={latestResultId ? `/profile/settings?fortuneId=${encodeURIComponent(latestResultId)}` : '/profile/settings'}
              page="/profile"
              target="profile_header_settings"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'profile_header',
                reportId: latestResultId || null,
              }}
            >
              {copy.editProfile}
            </ResultCtaLink>
            <ResultCtaLink
              href="/teachers"
              page="/profile"
              target="profile_header_teachers"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              meta={{
                source: pageSource,
                surface: 'profile_header',
              }}
            >
              {copy.askTeachers}
            </ResultCtaLink>
          </>
        }
      />

      {resumeTarget ? <ResumeBar target={resumeTarget} surface="profile" /> : null}

      <div className="mb-4">
        <PageIllustrationStrip surface="profile/hub" title={copy.stripTitle} compact limit={1} />
      </div>

      <PortalLayout
        main={
          <div className="space-y-4">
            <ProfileSettingsSummaryBanner />
            <ProgressiveProfileHub />
            {displayError ? <AlertBanner>{displayError}</AlertBanner> : null}

            <FreeMembershipClaimBanner source="profile_page" />

            {!loading ? (
            <RetentionResumePanel
              page="/profile"
              source={pageSource}
              ctaStrategyKey={sourceCtaStrategy.strategyKey}
              sourceFamily={sourceCtaStrategy.sourceFamily}
              title={latestResultId ? copy.resumeTitleWithReport : copy.resumeTitleWithoutReport}
              description={latestResultId ? copy.resumeDescWithReport : copy.resumeDescWithoutReport}
              stats={[
                { label: copy.statReports, value: fortunes.length, helper: copy.statReportsHelper },
                { label: copy.statEvents, value: mappedEvents.length, helper: copy.statEventsHelper },
                {
                  label: copy.statSubscription,
                  value:
                    updatesSummary?.subscription?.status === 'active'
                      ? copy.subscriptionActive
                      : copy.subscriptionInactive,
                  helper: updatesSummary?.email || copy.emailUnbound,
                },
              ]}
              actions={[
                {
                  href: profileChatHref,
                  label: latestResultId ? copy.openWithReport : copy.askHowToArchive,
                  target: 'retention_resume_chat_opening',
                  meta: {
                    reportId: latestResultId || null,
                    profileReportCount: fortunes.length,
                    profileEventCount: mappedEvents.length,
                    mode: 'opening',
                  },
                },
                {
                  href: latestReportHref,
                  label: latestResultId ? copy.openLatestReport : copy.startFirstAnalyze,
                  target: latestResultId ? 'retention_resume_latest_report' : 'retention_resume_analyze',
                  meta: { reportId: latestResultId || null },
                },
                {
                  href: appendSourceToHref('/events', pageSource),
                  label: copy.enterEventVerify,
                  target: 'retention_resume_events',
                  meta: { eventCount: mappedEvents.length },
                },
              ]}
            />
            ) : null}

            <DimensionRecommendations
              loadFromServer
              intent={(latestFortune?.intent as 'career' | 'wealth' | 'relationship' | 'yearly' | undefined) || null}
              limit={3}
              title={copy.dimensionsTitle}
              description={copy.dimensionsDescription}
            />

            <section className="fb-card p-4 md:p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
                {copy.longTermEyebrow}
              </div>
              <p className="mb-3 text-[13px] text-[color:var(--ink-3)]">
                {copy.longTermDesc}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileAction
                  href={appendSourceToHref('/profile/events', pageSource)}
                  label={copy.lifeEventsBackfill}
                  icon={CalendarClock}
                  page="/profile"
                  target="profile_life_events"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                  }}
                />
                <ProfileAction
                  href={appendSourceToHref('/predictions', pageSource)}
                  label={copy.predictionVerify}
                  icon={History}
                  page="/profile"
                  target="profile_predictions"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                  }}
                />
              </div>
            </section>

            <section className="fb-card p-4 md:p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
                {copy.statsEyebrow}
              </div>
              <StatGrid
                items={[
                  { label: copy.statAnalyses, value: fortunes.length, mono: true },
                  { label: copy.statEvents, value: mappedEvents.length, mono: true },
                  { label: copy.statTrendYears, value: chartData.length || 0, mono: true },
                  {
                    label: copy.statLatestPattern,
                    // pattern.type is engine/API data — keep as-is
                    value: `${latestFortune?.pattern?.type || copy.patternPending}`,
                  },
                ]}
              />
            </section>

          <section>
            <PriorityDisclosure
              label={copy.priorityLabel}
              title={copy.priorityTitle}
              description={copy.priorityDescription}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileAction
                  href={
                    latestResultId
                      ? buildReportContinueChatHref({
                          reportId: latestResultId,
                          teacher: 'practice',
                          source: 'profile_actions',
                          ctaStrategyKey: sourceCtaStrategy.strategyKey,
                          sourceFamily: sourceCtaStrategy.sourceFamily,
                        })
                      : buildTeacherChatHref({
                          teacherId: 'practice',
                          source: 'profile_actions_opening',
                        })
                  }
                  label={copy.consultantOpen}
                  icon={Bot}
                  page="/profile"
                  target="profile_actions_chat_opening"
                  meta={{
                    source: 'profile_actions',
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    reportId: latestResultId || null,
                    mode: 'opening',
                  }}
                />
                <ProfileAction
                  href={appendSourceToHref('/tools', pageSource)}
                  label={copy.toolsCenter}
                  icon={Sparkles}
                  page="/profile"
                  target="profile_actions_tools"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                  }}
                />
                <ProfileAction
                  href={appendSourceToHref('/events', pageSource)}
                  label={copy.manageEvents}
                  icon={CalendarClock}
                  page="/profile"
                  target="profile_actions_events"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    eventCount: mappedEvents.length,
                  }}
                />
                <ProfileAction
                  href={appendSourceToHref('/history', pageSource)}
                  label={copy.viewHistory}
                  icon={History}
                  page="/profile"
                  target="profile_actions_history"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    reportCount: fortunes.length,
                  }}
                />
                <ProfileAction
                  href={user?.email ? '/updates' : '/login'}
                  label={user?.email ? copy.manageSubscription : copy.bindEmail}
                  icon={Sparkles}
                  page="/profile"
                  target={user?.email ? 'profile_actions_updates' : 'profile_actions_login'}
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    hasSubscription: !!updatesSummary?.subscription,
                  }}
                />
                <ProfileAction
                  href={latestReportHref}
                  label={latestResultId ? copy.viewLatestReport : copy.startAnalyze}
                  icon={ArrowRight}
                  page="/profile"
                  target={latestResultId ? 'profile_actions_latest_report' : 'profile_actions_analyze'}
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    reportId: latestResultId || null,
                  }}
                />
              </div>
            </PriorityDisclosure>
          </section>

          <ToolHistoryPanel
            compact
            title={copy.toolHistoryTitle}
            description={copy.toolHistoryDescription}
            limit={8}
          />

          <PriorityDisclosure
            label={copy.journeyLabel}
            title={copy.journeyTitle}
            description={copy.journeyDescription}
            defaultOpen
          >
            <PersonalJourneyHub
              title={copy.journeyHubTitle}
              description={copy.journeyHubDescription}
              page="/profile"
            />
          </PriorityDisclosure>

          <section className="fb-card p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <SectionHeader
                eyebrow={
                  <span className="inline-flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-[color:var(--accent-strong)]" />
                    {copy.updatesEyebrow}
                  </span>
                }
                title={copy.updatesTitle}
                description={copy.updatesDescription}
              />
              <ResultCtaLink
                href={user?.email ? '/updates' : '/login?next=%2Fupdates'}
                page="/profile"
                target={user?.email ? 'profile_updates_center' : 'profile_updates_login'}
                className="fb-btn h-9 shrink-0 px-3 text-sm hover:no-underline"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'profile_updates_status',
                  hasSubscription: !!updatesSummary?.subscription,
                }}
              >
                {user?.email ? copy.enterUpdatesCenter : copy.loginForUpdates}
                <ArrowRight className="h-4 w-4" />
              </ResultCtaLink>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatusTile
                label={copy.tileSubscription}
                value={
                  updatesSummary?.subscription?.status === 'active'
                    ? copy.subscriptionActive
                    : copy.subscriptionInactive
                }
                helper={updatesSummary?.email || copy.emailUnbound}
                tone={updatesSummary?.subscription?.status === 'active' ? 'success' : 'neutral'}
              />
              <StatusTile
                label={copy.tileUpgradeActive}
                value={`${updatesSummary?.activeUpgradeCount || 0}`}
                helper={copy.tileUpgradeHelper}
                tone={(updatesSummary?.activeUpgradeCount || 0) > 0 ? 'accent' : 'neutral'}
              />
              <StatusTile
                label={copy.tileLatestDigest}
                value={updatesSummary?.latestDigest?.cycleKey || copy.noneYet}
                helper={profileDigestStatusLabel(locale, updatesSummary?.latestDigest?.status)}
                tone={updatesSummary?.latestDigest?.status === 'sent' ? 'success' : updatesSummary?.latestDigest?.status === 'error' ? 'warning' : 'neutral'}
              />
              <StatusTile
                label={copy.tileLatestReport}
                value={updatesSummary?.latestReport ? copy.reportReopenable : copy.reportPending}
                helper={updatesSummary?.latestReport?.qualityScore
                  ? copy.qualityScore(updatesSummary.latestReport.qualityScore)
                  : copy.noReopenableYet}
                tone={updatesSummary?.latestReport ? 'accent' : 'neutral'}
              />
            </div>

            {(updatesSummary?.latestReport || updatesSummary?.latestDigest) ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink-1)]">{copy.latestReopenableReport}</div>
                  <div className="mt-2 text-sm text-[color:var(--ink-2)]">
                    {updatesSummary?.latestReport
                      ? copy.latestReportContinue(
                          updatesSummary.latestReport.name || copy.defaultReportName
                        )
                      : copy.noLatestReport}
                  </div>
                  {updatesSummary?.latestReport?.id ? (
                    <ResultCtaLink
                      href={appendSourceToHref(`/result/${updatesSummary.latestReport.id}`, pageSource)}
                      page="/profile"
                      target="profile_updates_latest_report"
                      className="fb-btn mt-3 h-9 px-3 text-sm hover:no-underline"
                      meta={{
                        source: pageSource,
                        ctaStrategyKey: sourceCtaStrategy.strategyKey,
                        sourceFamily: sourceCtaStrategy.sourceFamily,
                        surface: 'profile_updates_status',
                        reportId: updatesSummary.latestReport.id,
                      }}
                    >
                      {copy.openLatestReport}
                      <ArrowRight className="h-4 w-4" />
                    </ResultCtaLink>
                  ) : null}
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink-1)]">{copy.latestDigestReceipt}</div>
                  <div className="mt-2 text-sm text-[color:var(--ink-2)]">
                    {updatesSummary?.latestDigest
                      ? `${updatesSummary.latestDigest.cycleKey || copy.thisCycle}：${profileDigestStatusLabel(locale, updatesSummary.latestDigest.status)}`
                      : copy.noDigestYet}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--ink-3)]">
                    {/* reason is API/ops text — keep as-is when present */}
                    {updatesSummary?.latestDigest?.reason || copy.noReceiptNote}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <ProductSurfaceRolePanel
            surface="profile"
            title={copy.roleTitle}
            description={copy.roleDescription}
            compact
          />

          {!loading && !hasProfileData && (
            <section className="fb-card p-8 text-center">
              <h2 className="text-xl font-black text-[color:var(--ink-1)]">{copy.emptyTitle}</h2>
              <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">{copy.emptyDescription}</p>
              <ResultCtaLink
                href="/analyze"
                page="/profile"
                target="profile_empty_analyze"
                className="fb-btn fb-btn-primary mt-6 h-10 px-4 text-sm hover:no-underline"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'profile_empty_state',
                }}
              >
                {copy.emptyCta}
              </ResultCtaLink>
            </section>
          )}

          {/* 人生K线图 */}
          {hasChartData && (
            <section className="mb-8">
              <Suspense fallback={<ChartSkeleton />}>
                <FortuneKLineChart data={chartData} />
              </Suspense>
            </section>
          )}

          {/* 用户档案和重要事件 */}
          {hasProfileData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 左侧：用户档案 */}
            <div className="lg:col-span-2">
              <Suspense fallback={<ProfileSkeleton />}>
                {loading ? (
                  <ProfileSkeleton />
                ) : (
                  <UserProfile user={user} fortunes={fortunes} eventCount={mappedEvents.length} />
                )}
              </Suspense>
            </div>

            {/* 右侧：重要事件 */}
            <div className="lg:col-span-1">
              <Suspense fallback={<EventsSkeleton />}>
                {loading ? (
                  <EventsSkeleton />
                ) : (
                  <ImportantEvents
                    events={mappedEvents}
                    source={pageSource}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                  />
                )}
              </Suspense>
            </div>
          </div>
          )}
          </div>
        }
        right={
          <ProfileRailRight
            latestReportHref={latestReportHref}
            chatHref={profileChatHref}
            settingsHref={latestResultId ? `/profile/settings?fortuneId=${encodeURIComponent(latestResultId)}` : '/profile/settings'}
            hasReport={!!latestResultId}
            locale={locale}
          />
        }
      />
    </AppPage>
  );
}

// 骨架组件
function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-96 bg-[color:var(--hairline-strong)] rounded-[var(--radius)] animate-pulse"></div>
      <div className="h-96 bg-[color:var(--hairline-strong)] rounded-[var(--radius)] animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-[color:var(--hairline-strong)] rounded-[var(--radius)] animate-pulse"></div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-[color:var(--paper)] rounded-[var(--radius)] border border-[color:var(--hairline-strong)] p-6">
      <div className="h-6 bg-[color:var(--hairline-strong)] rounded-lg animate-pulse mb-4"></div>
      <div className="h-64 bg-[color:var(--hairline-strong)] rounded-lg animate-pulse"></div>
    </div>
  );
}

function ProfileAction({
  href,
  label,
  icon: Icon,
  page,
  target,
  meta,
}: {
  href: string;
  label: string;
  icon: typeof Bot;
  page: string;
  target: string;
  meta?: Record<string, unknown>;
}) {
  return (
    <ResultCtaLink
      href={href}
      page={page}
      target={target}
      className="fb-btn h-10 w-full px-3 text-sm hover:no-underline"
      meta={meta}
    >
      <Icon className="h-4 w-4" />
      {label}
    </ResultCtaLink>
  );
}


