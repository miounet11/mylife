// 用户档案页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BellRing, Bot, CalendarClock, History, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import { buildProfileChartData, hasProfileContent } from '@/lib/profile-page';

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
    events: Record<string, unknown>[];
  };
  // 兼容 history API 的扁平结构
  user?: Record<string, unknown>;
  fortunes?: Record<string, unknown>[];
  events?: Record<string, unknown>[];
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
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
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
    return (events || []).map((event: any) => ({
      id: event.id,
      type: ['career', 'wealth', 'marriage', 'health', 'family', 'other'].includes(event.type) ? event.type : 'other',
      title: event.title,
      date: new Date(event.date),
      time: event.time || undefined,
      description: event.description || '',
      impact: ['positive', 'negative', 'neutral'].includes(event.impact) ? event.impact : 'neutral',
      reminder: {
        enabled: !!event.reminder_enabled,
        advanceDays: event.reminder_advance_days || 0,
        method: (event.reminder_method || 'app') as 'app' | 'email' | 'sms',
      },
    }));
  }, [events]);

  const chartData = useMemo(() => {
    return buildProfileChartData(fortunes);
  }, [fortunes]);

  const latestFortune = fortunes[0] as any;
  const latestResultId = latestFortune?.id;
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
      <SiteHeader ctaHref="/chat" ctaLabel="继续咨询" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              用户沉淀页
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              档案页的目标不是展示数据，
              <span className="font-serif text-[color:var(--accent-strong)]">而是让用户留下来。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              在这里，用户会看到自己过往的分析、关键事件和阶段趋势，逐步形成长期使用而不是一次性消费。
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">当前档案能承接的动作</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {['查看阶段趋势图', '回顾最近分析结果', '继续进入 AI 咨询', '把节点落到事件管理'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: '累计分析', value: `${fortunes.length}`, helper: '已沉淀的命理结果' },
              { label: '关键事件', value: `${mappedEvents.length}`, helper: '可回访的节点记录' },
              { label: '趋势年份', value: `${chartData.length || 0}`, helper: '可查看阶段波动' },
              { label: '最近格局', value: `${latestFortune?.pattern?.type || '待生成'}`, helper: '最近一次分析结果' },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">{item.helper}</div>
              </div>
            ))}
          </section>

          <section className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-[color:var(--ink)]">继续操作</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">把档案页变成下一步动作的中枢，而不是终点。</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <ProfileAction href="/chat" label="继续咨询" icon={Bot} />
                <ProfileAction href="/events" label="管理事件" icon={CalendarClock} />
                <ProfileAction href="/history" label="查看历史" icon={History} />
                <ProfileAction href={user?.email ? '/updates' : '/login'} label={user?.email ? '管理订阅' : '绑定邮箱'} icon={Sparkles} />
                <ProfileAction href={latestResultId ? `/result/${latestResultId}` : '/analyze'} label={latestResultId ? '查看最新报告' : '开始分析'} icon={ArrowRight} />
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 text-[color:var(--accent-strong)]" />
                  <div className="text-lg font-bold text-[color:var(--ink)]">我的更新状态</div>
                </div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  报告升级、月度更新和订阅状态，不应该只停留在邮箱里，这里直接给你看当前状态。
                </div>
              </div>
              <Link
                href={user?.email ? '/updates' : '/login?next=%2Fupdates'}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
              >
                {user?.email ? '进入更新中心' : '登录查看更新'}
                <ArrowRight className="h-4 w-4" />
              </Link>
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
                <div className="rounded-[1.4rem] bg-white px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">最近一次可回访报告</div>
                  <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {updatesSummary?.latestReport
                      ? `${updatesSummary.latestReport.name || '我的报告'}，当前版本 ${updatesSummary.latestReport.reportVersion || 'v1'}。`
                      : '当前还没有最近报告。'}
                  </div>
                  {updatesSummary?.latestReport?.id ? (
                    <Link
                      href={`/result/${updatesSummary.latestReport.id}`}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]"
                    >
                      打开最新报告
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>

                <div className="rounded-[1.4rem] bg-white px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">最近一次更新回执</div>
                  <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {updatesSummary?.latestDigest
                      ? `${updatesSummary.latestDigest.cycleKey || '本周期'}：${mapDigestStatus(updatesSummary.latestDigest.status)}`
                      : '当前还没有月度更新回执。'}
                  </div>
                  <div className="mt-1 text-sm leading-7 text-[color:var(--muted)]">
                    {updatesSummary?.latestDigest?.reason || '后续会在这里显示最近一次发送或跳过原因。'}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {!loading && !hasProfileData && (
            <section className="glass-panel rounded-[2rem] p-8 text-center">
              <h2 className="text-2xl font-black text-[color:var(--ink)]">你的档案还没有形成</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                先完成一次命理分析，结果页、趋势图、事件管理和 AI 咨询才会逐步沉淀成长期档案。
              </p>
              <Link href="/analyze" className="action-primary mt-6">
                开始第一次分析
              </Link>
            </section>
          )}

          {/* 命理K线图 */}
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
                {loading ? <EventsSkeleton /> : <ImportantEvents events={mappedEvents} />}
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
      <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="h-6 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
    </div>
  );
}

function ProfileAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Bot;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
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
    <div className={`rounded-[1.4rem] px-4 py-5 ${mapProfileStatusTone(tone)}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 break-all text-2xl font-black">{value}</div>
      <div className="mt-2 text-sm leading-7 opacity-85">{helper}</div>
    </div>
  );
}

function mapProfileStatusTone(tone: 'neutral' | 'accent' | 'success' | 'warning') {
  if (tone === 'accent') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  return 'bg-white text-[color:var(--ink)]';
}

function mapDigestStatus(status?: string | null) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}
