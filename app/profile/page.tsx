// 用户档案页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, CalendarClock, History, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fortunes, setFortunes] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // 使用 profile API（语义正确），回退到 history API
        const res = await fetch('/api/history', { cache: 'no-store' });
        const data: ProfileResponse = await res.json();
        if (!res.ok || !data.success) {
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
    const strengthToBase = (strength?: string) => {
      if (strength === 'strong') return 85;
      if (strength === 'weak') return 55;
      return 70;
    };

    const points = (fortunes || []).map((item: any) => {
      const year = new Date(item.created_at || Date.now()).getFullYear();
      const base = strengthToBase(item?.pattern?.strength);
      return {
        year,
        career: base,
        wealth: Math.min(100, base + 5),
        marriage: Math.max(0, base - 5),
        health: base,
      };
    });

    const byYear = new Map<number, { year: number; career: number; wealth: number; marriage: number; health: number }>();
    points.forEach((p) => byYear.set(p.year, p));
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [fortunes]);

  const latestFortune = fortunes[0] as any;
  const latestResultId = latestFortune?.id;
  const hasProfileData = fortunes.length > 0 || mappedEvents.length > 0 || !!user;

  return (
    <div className="page-shell">
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
          {hasProfileData && (
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
