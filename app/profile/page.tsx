// 用户档案页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, History, Bell, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <div className="text-xl font-bold text-gray-900">
                人生K线
              </div>
            </Link>

            <h1 className="hidden md:block text-xl font-bold text-gray-900">
              我的命理档案
            </h1>

            <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition">
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline font-semibold">设置</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* 命理K线图 */}
          <section className="mb-8">
            <Suspense fallback={<ChartSkeleton />}>
              <FortuneKLineChart />
            </Suspense>
          </section>

          {/* 用户档案和重要事件 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：用户档案 */}
            <div className="lg:col-span-2">
              <Suspense fallback={<ProfileSkeleton />}>
                <UserProfile />
              </Suspense>
            </div>

            {/* 右侧：重要事件 */}
            <div className="lg:col-span-1">
              <Suspense fallback={<EventsSkeleton />}>
                <ImportantEvents />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      {/* 悬浮操作按钮 */}
      <div className="fixed bottom-8 right-8 space-y-3">
        <Link href="/chat" className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <TrendingUp className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">AI助手</span>
        </Link>
        <Link href="/events" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <Bell className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">事件</span>
        </Link>
        <Link href="/history" className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <History className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">历史</span>
        </Link>
      </div>
    </div>
  );
}

// 骨架组件
function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  );
}
