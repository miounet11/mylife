// 用户档案页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, BookOpenText, Bot, CalendarClock, History, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import PersonalJourneyHub from '@/components/personal-journey-hub';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import ResultCtaLink from '@/components/result-cta-link';
import RetentionResumePanel from '@/components/retention-resume-panel';
import ResumeBar from '@/components/resume-bar';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildChatHref } from '@/lib/chat-entry';
import { buildProfileChartData, hasProfileContent } from '@/lib/profile-page';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { resolveResumeTarget } from '@/lib/resume-target';
import { appendSourceToHref } from '@/lib/source-url';
import { toEventViewModels, type EventTransportRecord } from '@/lib/event-view';

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
      reportVersion?: string | null;
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fortunes, setFortunes] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<EventTransportRecord[]>([]);
  const [updatesSummary, setUpdatesSummary] = useState<UpdatesSummaryResponse['data'] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, updatesRes] = await Promise.all([
          fetch('/api/history', { cache: 'no-store' }),
          fetch('/api/updates/summary', { cache: 'no-store' }),
        ]);
        const data: ProfileResponse = await historyRes.json();
        const updatesData: UpdatesSummaryResponse = await updatesRes.json();

        if (!historyRes.ok || !data.success) {
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
        if (updatesRes.ok && updatesData.success) {
          setUpdatesSummary(updatesData.data || null);
        }
      } catch {
        setError('网络异常，无法加载档案');
      } finally {
        setLoading(false);
      }
    };

    load();
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
  const profileChatHref = buildChatHref({
    reportId: latestResultId || undefined,
    question: '请根据我的档案、最近报告和事件记录，帮我判断：当前最值得优先推进的一条主线是什么，为什么？',
    source: pageSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const hasProfileData = hasProfileContent({
    user,
    fortunes,
    eventCount: mappedEvents.length,
  });
  const hasChartData = chartData.length > 0;

  return (
    <div className="page-shell">
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
      <SiteHeader
        ctaHref={profileChatHref}
        ctaLabel="继续追问"
        ctaAnalytics={{
          page: '/profile',
          target: 'profile_header_chat',
          meta: {
            source: pageSource,
            ctaStrategyKey: sourceCtaStrategy.strategyKey,
            sourceFamily: sourceCtaStrategy.sourceFamily,
            reportId: latestResultId || null,
          },
        }}
      />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Sparkles className="h-3 w-3" />
                我的档案
              </div>
              <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                恢复你的<span className="text-[color:var(--brand-strong)]">下一步</span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <ResultCtaLink
                href={latestReportHref}
                page="/profile"
                target={latestResultId ? 'profile_header_latest_report' : 'profile_header_analyze'}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'profile_header',
                  reportId: latestResultId || null,
                }}
              >
                继续追问
              </ResultCtaLink>
              <ResultCtaLink
                href="/docs/profile-history"
                page="/profile"
                target="profile_header_docs"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'profile_header',
                }}
              >
                <BookOpenText className="h-4 w-4" />
                使用方法
              </ResultCtaLink>
            </div>
          </div>
        </section>

        {/* v5-C2 决策台风「继续上次」恢复条 — 仅当有可恢复目标时显示 */}
        {resumeTarget ? (
          <div className="mb-6">
            <ResumeBar target={resumeTarget} surface="profile" />
          </div>
        ) : null}

        <div className="space-y-5">
          {error && (
            <div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--alert)]">
              {error}
            </div>
          )}

          <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 md:p-5">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
              个人底盘指标
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: '累计分析', value: `${fortunes.length}`, mono: true },
                { label: '关键事件', value: `${mappedEvents.length}`, mono: true },
                { label: '趋势年份', value: `${chartData.length || 0}`, mono: true },
                { label: '最近格局', value: `${latestFortune?.pattern?.type || '待生成'}`, mono: false },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.label}
                  </div>
                  <div
                    className={`text-xl font-black text-[color:var(--ink-1)] ${
 item.mono ? 'font-mono tabular-nums' : ''
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {!loading && (
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
                  href: buildChatHref({
                    reportId: latestResultId || undefined,
                    question: '请基于我的个人档案、最新报告、事件记录和工具历史，直接告诉我现在最该恢复推进的一个任务是什么，并给我一个三步行动顺序。',
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                  }),
                  label: latestResultId ? '恢复上次任务' : '先问如何建立档案',
                  target: 'retention_resume_chat',
                  meta: {
                    reportId: latestResultId || null,
                    profileReportCount: fortunes.length,
                    profileEventCount: mappedEvents.length,
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
          )}

          <section>
            <PriorityDisclosure
              label="继续操作"
              title="工具、事件、历史和订阅"
              description="主动作已经放在顶部；低频入口默认收起。"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileAction
                  href={buildChatHref({
                    reportId: latestResultId || undefined,
                    question: '请结合我的档案信息继续做结构追问，告诉我当前最值得先做的一步动作和最需要防的误判。',
                    source: 'profile_actions',
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                  })}
                  label="继续追问"
                  icon={Bot}
                  page="/profile"
                  target="profile_actions_chat"
                  meta={{
                    source: 'profile_actions',
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    reportId: latestResultId || null,
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
            title="最近使用的单项工具"
            description="最近做过的聚焦判断会沉淀在这里，方便继续深问与复访。"
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

          <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 text-[color:var(--accent-strong)]" />
                  <div className="text-lg font-bold text-[color:var(--ink)]">我的更新状态</div>
                </div>
              </div>
              <ResultCtaLink
                href={user?.email ? '/updates' : '/login?next=%2Fupdates'}
                page="/profile"
                target={user?.email ? 'profile_updates_center' : 'profile_updates_login'}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
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

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ProfileStatusTile
                label="订阅状态"
                value={updatesSummary?.subscription?.status === 'active' ? '已激活' : '未激活'}
                helper={updatesSummary?.email || '尚未绑定邮箱'}
                tone={updatesSummary?.subscription?.status === 'active' ? 'success' : 'neutral'}
              />
              <ProfileStatusTile
                label="活跃升级任务"
                value={`${updatesSummary?.activeUpgradeCount || 0}`}
                helper="后台增强中的报告数量"
                tone={(updatesSummary?.activeUpgradeCount || 0) > 0 ? 'accent' : 'neutral'}
              />
              <ProfileStatusTile
                label="最近月度更新"
                value={updatesSummary?.latestDigest?.cycleKey || '暂无'}
                helper={mapDigestStatus(updatesSummary?.latestDigest?.status)}
                tone={updatesSummary?.latestDigest?.status === 'sent' ? 'success' : updatesSummary?.latestDigest?.status === 'error' ? 'warning' : 'neutral'}
              />
              <ProfileStatusTile
                label="最新报告"
                value={updatesSummary?.latestReport?.reportVersion || '待生成'}
                helper={updatesSummary?.latestReport?.qualityScore
                  ? `质量 ${updatesSummary.latestReport.qualityScore} / ${updatesSummary.latestReport.qualityGrade || 'B'}`
                  : '还没有生成可复访的结果'}
                tone={updatesSummary?.latestReport ? 'accent' : 'neutral'}
              />
            </div>

            {(updatesSummary?.latestReport || updatesSummary?.latestDigest) ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">最近一次可回访报告</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">
                    {updatesSummary?.latestReport
                      ? `${updatesSummary.latestReport.name || '我的报告'}，当前版本 ${updatesSummary.latestReport.reportVersion || 'v1'}。`
                      : '当前还没有最近报告。'}
                  </div>
                  {updatesSummary?.latestReport?.id ? (
                    <ResultCtaLink
                      href={appendSourceToHref(`/result/${updatesSummary.latestReport.id}`, pageSource)}
                      page="/profile"
                      target="profile_updates_latest_report"
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-3"
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

                <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">最近一次更新回执</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">
                    {updatesSummary?.latestDigest
                      ? `${updatesSummary.latestDigest.cycleKey || '本周期'}：${mapDigestStatus(updatesSummary.latestDigest.status)}`
                      : '当前还没有月度更新回执。'}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--muted)]">{updatesSummary?.latestDigest?.reason || '暂无回执说明'}</div>
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
            <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-8 text-center">
              <h2 className="text-2xl font-black text-[color:var(--ink)]">你的档案还没有形成</h2>
              <ResultCtaLink
                href="/analyze"
                page="/profile"
                target="profile_empty_analyze"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] mt-6"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      </main>

      <SiteFooter />
    </div>
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
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
      meta={meta}
    >
      <Icon className="h-4 w-4" />
      {label}
    </ResultCtaLink>
  );
}

function ProfileStatusTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  return (
    <div className={`rounded-[var(--radius)] px-4 py-5 ${mapProfileStatusTone(tone)}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 break-all text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs leading-6 opacity-85">{helper}</div>
    </div>
  );
}

function mapProfileStatusTone(tone: 'neutral' | 'accent' | 'success' | 'warning') {
  if (tone === 'accent') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (tone === 'success') return 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  if (tone === 'warning') return 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'bg-[color:var(--paper)] text-[color:var(--ink)]';
}

function mapDigestStatus(status?: string | null) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}
