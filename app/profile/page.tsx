// 用户档案页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-indigo-700 flex items-center justify-center text-white font-bold font-serif">
                K
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                人生K线
              </div>
            </Link>

            <h1 className="hidden md:block text-xl font-bold text-slate-900 font-serif">
              我的命理档案
            </h1>

            <div className="flex items-center gap-4 text-sm">
              <Link href="/chat" className="text-slate-600 hover:text-indigo-600">AI咨询</Link>
              <Link href="/events" className="text-slate-600 hover:text-indigo-600">事件</Link>
              <Link href="/history" className="text-slate-600 hover:text-indigo-600">历史</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 命理K线图 */}
          <section className="mb-8">
            <Suspense fallback={<ChartSkeleton />}>
              <FortuneKLineChart data={chartData} />
            </Suspense>
          </section>

          {/* 用户档案和重要事件 */}
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
        </div>
      </main>
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
