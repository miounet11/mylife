// 用户档案页面
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Settings, History, Bell, TrendingUp } from 'lucide-react';

// 动态导入以减少首屏加载
const UserProfile = dynamic(() => import('@/components/user-profile'), {
  loading: () => <ProfileSkeleton />,
});

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 返回按钮 */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">返回首页</span>
            </Link>

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-900">
              我的命理档案
            </h1>

            {/* 设置按钮 */}
            <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition">
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline font-semibold">设置</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* 用户档案 */}
          <Suspense fallback={<ProfileSkeleton />}>
            <UserProfile />
          </Suspense>

          {/* 重要事件 */}
          <Suspense fallback={<EventsSkeleton />}>
            <ImportantEvents />
          </Suspense>
        </div>
      </main>

      {/* 浮动操作按钮 */}
      <div className="fixed bottom-8 right-8 space-y-3">
        <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <Bell className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">提醒</span>
        </button>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <History className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">历史</span>
        </button>
        <Link href="/chat" className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <TrendingUp className="w-5 h-5" />
          <span className="hidden md:inline font-semibold">AI助手</span>
        </Link>
      </div>
    </div>
  );
}

// 用户档案组件
function UserProfileComponent() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* 柱头 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">张先生</h2>
              <p className="text-white opacity-80">男 · 35岁 · 北京</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? '保存' : '编辑'}
          </button>
        </div>
      </div>

      {/* 命理摘要 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-bold text-purple-900 mb-2">日主</h3>
            <p className="text-2xl font-bold text-purple-600">甲木</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">格局</h3>
            <p className="text-lg font-semibold text-blue-700">从杀格</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-2">大运</h3>
            <p className="text-lg font-semibold text-green-700">丙子大运</p>
          </div>
        </div>

        {/* 出生信息 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">出生信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">出生日期</span>
                <span className="font-semibold text-gray-900">1989年3月15日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">出生时间</span>
                <span className="font-semibold text-gray-900">上午8:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">出生地</span>
                <span className="font-semibold text-gray-900">北京市</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">统计信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">使用天数</span>
                <span className="font-semibold text-gray-900">127天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">分析次数</span>
                <span className="font-semibold text-gray-900">34次</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">保存事件</span>
                <span className="font-semibold text-gray-900">8个</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 重要事件组件
function ImportantEventsComponent() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* 柱头 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">重要事件</h2>
          <button className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
            <span>添加事件</span>
            <span>+</span>
          </button>
        </div>
      </div>

      {/* 事件列表 */}
      <div className="p-6">
        <div className="space-y-4">
          {[
            {
              type: 'career',
              icon: '👔',
              title: '升职通过',
              date: '2024-01-15',
              impact: 'positive',
              description: '顺利通过技术总监面试，薪资上涨30%',
            },
            {
              type: 'wealth',
              icon: '💰',
              title: '投资收益',
              date: '2023-12-20',
              impact: 'positive',
              description: '投资科技股，收益率达25%',
            },
            {
              type: 'marriage',
              icon: '❤️',
              title: '遇到心动对象',
              date: '2023-11-10',
              impact: 'neutral',
              description: '在公司年会上遇到一位心仪的同事',
            },
            {
              type: 'health',
              icon: '💪',
              title: '完成体检',
              date: '2023-10-05',
              impact: 'neutral',
              description: '完成年度体检，各项指标正常',
            },
          ].map((event, index) => (
            <EventCard key={index} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 事件卡片组件
function EventCard({ event }: any) {
  const impactColors = {
    positive: 'border-green-400 bg-green-50',
    negative: 'border-red-400 bg-red-50',
    neutral: 'border-gray-400 bg-gray-50',
  };

  const impactLabels = {
    positive: '积极',
    negative: '消极',
    neutral: '中性',
  };

  return (
    <div className={`border-2 ${impactColors[event.impact]} rounded-lg p-4 hover:shadow-lg transition`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-3xl">{event.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{event.title}</h3>
            <span className="text-sm text-gray-500">{event.date}</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200">
              {event.type === 'career' && '事业'}
              {event.type === 'wealth' && '财富'}
              {event.type === 'marriage' && '感情'}
              {event.type === 'health' && '健康'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200">
              {impactLabels[event.impact]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 骨架组件
function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-24 bg-gray-200 animate-pulse"></div>
      <div className="p-6 space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-24 bg-gray-200 animate-pulse"></div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
