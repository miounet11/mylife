'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, Bot, CalendarClock, History, Sparkles } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
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
          setError(data.error || '加载档案失败');
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
          setError('网络异常，无法加载档案');
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
        ctaLabel: latestResultId ? '顾问开场' : '问顾问',
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
        eyebrow="我的档案"
        title="恢复下一步"
        description="续接最新报告、工具历史与事件反馈。"
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
              {latestResultId ? '打开最新报告' : '开始分析'}
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
              顾问开场
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
              编辑资料
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
              请老师
            </ResultCtaLink>
          </>
        }
      />

      {resumeTarget ? <ResumeBar target={resumeTarget} surface="profile" /> : null}

      <div className="mb-4">
        <PageIllustrationStrip surface="profile/hub" title="资料怎么补" compact limit={1} />
      </div>

      <PortalLayout
        main={
          <div className="space-y-4">
            <ProfileSettingsSummaryBanner />
            <ProgressiveProfileHub />
            {error ? <AlertBanner>{error}</AlertBanner> : null}

            <FreeMembershipClaimBanner source="profile_page" />

            {!loading ? (
            <RetentionResumePanel
              page="/profile"
              source={pageSource}
              ctaStrategyKey={sourceCtaStrategy.strategyKey}
              sourceFamily={sourceCtaStrategy.sourceFamily}
              title={latestResultId ? '接着你的最新报告继续推进' : '先生成第一份个人底盘'}
              description={latestResultId
                ? '档案页的价值不是静态查看，而是直接恢复上次没完成的判断任务。先接回聊天，再回到报告和事件验证，不要重新从零浏览。'
                : '还没有报告时，档案页不能形成复访闭环。先完成第一份分析，再让报告、事件、工具和邮件召回形成连续路径。'}
              stats={[
                { label: '历史报告', value: fortunes.length, helper: '可恢复的判断底盘' },
                { label: '关键事件', value: mappedEvents.length, helper: '可验证和纠偏的节点' },
                { label: '订阅状态', value: updatesSummary?.subscription?.status === 'active' ? '已激活' : '未激活', helper: updatesSummary?.email || '尚未绑定邮箱' },
              ]}
              actions={[
                {
                  href: profileChatHref,
                  label: latestResultId ? '带报告开场' : '先问顾问如何建档',
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
                  label: latestResultId ? '打开最新报告' : '开始第一份分析',
                  target: latestResultId ? 'retention_resume_latest_report' : 'retention_resume_analyze',
                  meta: { reportId: latestResultId || null },
                },
                {
                  href: appendSourceToHref('/events', pageSource),
                  label: '进入事件验证',
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
              title="下一步：进入场景维度研判"
              description="结合你的档案主题与已探索进度，优先推荐最值得先做的窄场景研判。"
            />

            <section className="fb-card p-4 md:p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
                长期档案
              </div>
              <p className="mb-3 text-[13px] text-[color:var(--ink-3)]">
                记录真实人生事件、验证历史预测，让下次报告记住你的处境与命中率。
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileAction
                  href={appendSourceToHref('/profile/events', pageSource)}
                  label="人生事件回填"
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
                  label="预测验证"
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
                个人底盘指标
              </div>
              <StatGrid
                items={[
                  { label: '累计分析', value: fortunes.length, mono: true },
                  { label: '关键事件', value: mappedEvents.length, mono: true },
                  { label: '趋势年份', value: chartData.length || 0, mono: true },
                  { label: '最近格局', value: `${latestFortune?.pattern?.type || '待生成'}` },
                ]}
              />
            </section>

          <section>
            <PriorityDisclosure
              label="继续操作"
              title="工具、事件、历史和订阅"
              description="主动作已经放在顶部；低频入口默认收起。"
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
                  label="顾问开场"
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
                  label="工具中心"
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
                  label="管理事件"
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
                  label="查看历史"
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
                  label={user?.email ? '管理订阅' : '绑定邮箱'}
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
                  label={latestResultId ? '查看最新报告' : '开始分析'}
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
            title="工具运行结果"
            description="已完成的工具结论可点开回看；浏览记录附在下方。"
            limit={8}
          />

          <PriorityDisclosure
            label="个人路径"
            title="工具、文章和案例推荐"
            description="用户先恢复任务，再展开推荐路径。"
            defaultOpen
          >
            <PersonalJourneyHub
              title="你的主测算、工具和文章已经开始形成个人路径"
              description="这里会把主报告、工具结果和阅读记录接回一条持续复访的个人路径，不再是分散的单次页面。"
              page="/profile"
            />
          </PriorityDisclosure>

          <section className="fb-card p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <SectionHeader
                eyebrow={
                  <span className="inline-flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-[color:var(--accent-strong)]" />
                    更新状态
                  </span>
                }
                title="我的更新状态"
                description="订阅、月度回执与最新可回访报告一览。"
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
                {user?.email ? '进入更新中心' : '登录查看更新'}
                <ArrowRight className="h-4 w-4" />
              </ResultCtaLink>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatusTile
                label="订阅状态"
                value={updatesSummary?.subscription?.status === 'active' ? '已激活' : '未激活'}
                helper={updatesSummary?.email || '尚未绑定邮箱'}
                tone={updatesSummary?.subscription?.status === 'active' ? 'success' : 'neutral'}
              />
              <StatusTile
                label="内容补全中"
                value={`${updatesSummary?.activeUpgradeCount || 0}`}
                helper="正在继续完善的报告数量"
                tone={(updatesSummary?.activeUpgradeCount || 0) > 0 ? 'accent' : 'neutral'}
              />
              <StatusTile
                label="最近月度更新"
                value={updatesSummary?.latestDigest?.cycleKey || '暂无'}
                helper={mapDigestStatus(updatesSummary?.latestDigest?.status)}
                tone={updatesSummary?.latestDigest?.status === 'sent' ? 'success' : updatesSummary?.latestDigest?.status === 'error' ? 'warning' : 'neutral'}
              />
              <StatusTile
                label="最新报告"
                value={updatesSummary?.latestReport ? '可回访' : '待生成'}
                helper={updatesSummary?.latestReport?.qualityScore
                  ? `可信度 ${updatesSummary.latestReport.qualityScore}`
                  : '还没有生成可复访的结果'}
                tone={updatesSummary?.latestReport ? 'accent' : 'neutral'}
              />
            </div>

            {(updatesSummary?.latestReport || updatesSummary?.latestDigest) ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink-1)]">最近一次可回访报告</div>
                  <div className="mt-2 text-sm text-[color:var(--ink-2)]">
                    {updatesSummary?.latestReport
                      ? `${updatesSummary.latestReport.name || '我的报告'}，可以继续回看和追问。`
                      : '当前还没有最近报告。'}
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
                      打开最新报告
                      <ArrowRight className="h-4 w-4" />
                    </ResultCtaLink>
                  ) : null}
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink-1)]">最近一次更新回执</div>
                  <div className="mt-2 text-sm text-[color:var(--ink-2)]">
                    {updatesSummary?.latestDigest
                      ? `${updatesSummary.latestDigest.cycleKey || '本周期'}：${mapDigestStatus(updatesSummary.latestDigest.status)}`
                      : '当前还没有月度更新回执。'}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--ink-3)]">{updatesSummary?.latestDigest?.reason || '暂无回执说明'}</div>
                </div>
              </div>
            ) : null}
          </section>

          <ProductSurfaceRolePanel
            surface="profile"
            title="档案页先恢复任务，不做静态资料堆叠"
            description="用户回到这里时，最重要的是续接最新报告、工具历史和事件反馈，而不是重新理解整套系统。"
            compact
          />

          {!loading && !hasProfileData && (
            <section className="fb-card p-8 text-center">
              <h2 className="text-xl font-black text-[color:var(--ink-1)]">你的档案还没有形成</h2>
              <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">完成第一次分析后，报告、事件和工具历史会在这里形成可恢复的连续路径。</p>
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
                开始第一次分析
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

function mapDigestStatus(status?: string | null) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}
