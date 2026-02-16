// 事件页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Plus, Filter, Search, Calendar, Grid } from 'lucide-react';
import { useState } from 'react';

// 动态导入
const EventCalendar = dynamic(() => import('@/components/event-calendar'), {
  loading: () => <CalendarSkeleton />,
});

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

export default function EventsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo和标题 */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <div className="text-xl font-bold text-gray-900">
                人生K线
              </div>
            </Link>

            {/* 标题 */}
            <h1 className="hidden md:block text-xl font-bold text-gray-900">
              命理事件
            </h1>

            {/* 返回按钮 */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">返回首页</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧：日历 */}
          <div className={`hidden md:block ${view === 'list' ? 'w-0' : 'w-1/3'} border-r border-gray-200 bg-white transition-all duration-300`}>
            <EventCalendar />
          </div>

          {/* 右侧：事件列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {view === 'calendar' ? '事件日历' : '事件列表'}
                </h2>
                <div className="flex items-center space-x-2 bg-purple-100 rounded-lg px-3 py-1">
                  <span className="text-sm text-purple-700">8个事件</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* 视图切换 */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setView('calendar')}
                    className={`p-2 rounded-md transition ${view === 'calendar' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-md transition ${view === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>

                {/* 添加按钮 */}
                <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">添加事件</span>
                </button>
              </div>
            </div>

            {/* 筛选和搜索 */}
            <div className="flex items-center space-x-4 mb-6 bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2">
                  <option>全部类型</option>
                  <option>事业</option>
                  <option>财富</option>
                  <option>感情</option>
                  <option>健康</option>
                  <option>家庭</option>
                </select>
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索事件..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 事件内容 */}
            {view === 'calendar' ? (
              <div className="space-y-6">
                {/* 今日事件 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-red-500">●</span>
                    <span className="ml-2">今日</span>
                    <span className="ml-4 text-sm text-gray-500">1个事件</span>
                  </h3>
                  <EventCard
                    event={{
                      id: '1',
                      type: 'career',
                      icon: '👔',
                      title: '面试技术总监职位',
                      date: '2024-01-15',
                      time: '14:00',
                      impact: 'positive',
                      description: '根据您的八字，今天事业运上升，面试成功率90%',
                      reminder: {
                        enabled: true,
                        advanceDays: 60,
                        method: 'app',
                      },
                    }}
                  />
                </div>

                {/* 即将到来 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-yellow-500">●</span>
                    <span className="ml-2">即将到来</span>
                    <span className="ml-4 text-sm text-gray-500">2个事件</span>
                  </h3>
                  <div className="space-y-3">
                    <EventCard
                      event={{
                        id: '2',
                        type: 'career',
                        icon: '👔',
                        title: '签订重要合同',
                        date: '2024-01-20',
                        time: '10:00',
                        impact: 'positive',
                        description: '根据您的八字，1月20日是签约吉日，事业运旺',
                        reminder: {
                          enabled: true,
                          advanceDays: 1440,
                          method: 'email',
                        },
                      }}
                    />
                    <EventCard
                      event={{
                        id: '3',
                        type: 'marriage',
                        icon: '❤️',
                        title: '第一次约会',
                        date: '2024-01-25',
                        time: '19:00',
                        impact: 'neutral',
                        description: '根据您的八字，1月下旬桃花运旺，适合恋爱',
                        reminder: {
                          enabled: true,
                          advanceDays: 60,
                          method: 'app',
                        },
                      }}
                    />
                  </div>
                </div>

                {/* 化灾预警 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-red-500">⚠️</span>
                    <span className="ml-2">化灾预警</span>
                    <span className="ml-4 text-sm text-gray-500">1个预警</span>
                  </h3>
                  <WarningCard
                    warning={{
                      type: 'health',
                      icon: '💪',
                      title: '注意脾胃健康',
                      date: '2024-02-01',
                      dateRange: '2024-02-01 至 2024-02-07',
                      impact: 'negative',
                      severity: 'medium',
                      description: '未来7天（农历二月初一至初七）注意脾胃健康，宜清淡饮食，避免暴饮暴食',
                      protectionMeasures: {
                        immediate: ['注意饮食', '避免暴饮暴食', '早点休息'],
                        shortTerm: ['定期体检', '多食黄色食物', '适当运动'],
                        longTerm: ['建立健康习惯', '购买健康保险', '定期检查'],
                        fortuneEnhancements: {
                          rituals: ['佩戴黄色手串', '供奉黄财神', '多晒太阳'],
                          amulets: ['健康符', '平安符', '黄玉'],
                          colors: ['黄色', '棕色'],
                          directions: ['东方', '东北方'],
                          dates: [new Date('2024-02-01'), new Date('2024-02-07')],
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              /* 列表视图 */
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <EventCard
                    key={i}
                    event={{
                      id: String(i),
                      type: i % 2 === 0 ? 'career' : 'wealth',
                      icon: i % 2 === 0 ? '👔' : '💰',
                      title: `事件 ${i}`,
                      date: `2024-01-${String(i + 10).padStart(2, '0')}`,
                      time: '10:00',
                      impact: i % 3 === 0 ? 'positive' : 'neutral',
                      description: `事件 ${i}的描述...`,
                      reminder: {
                        enabled: true,
                        advanceDays: 60 * (i % 3),
                        method: i % 2 === 0 ? 'app' : 'email',
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 辅助组件
function EventCard({ event }: { event: any }) {
  const impactColors = {
    positive: 'border-green-400 bg-green-50',
    negative: 'border-red-400 bg-red-50',
    neutral: 'border-gray-400 bg-gray-50',
  };

  return (
    <div className={`border-2 ${impactColors[event.impact]} rounded-lg p-4 hover:shadow-lg transition transform hover:scale-[1.02]`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-3xl">{event.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{event.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{event.date}</span>
              {event.time && (
                <>
                  <span className="text-gray-400">·</span>
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          {event.reminder?.enabled && (
            <div className="text-xs text-purple-600">
              ✓ 已设置提醒（{event.reminder.method === 'app' ? '应用' : event.reminder.method === 'email' ? '邮件' : '短信'}，提前{event.reminder.advanceDays}分钟）
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: any }) {
  const severityColors = {
    low: 'border-yellow-400 bg-yellow-50',
    medium: 'border-orange-400 bg-orange-50',
    high: 'border-red-400 bg-red-50',
    critical: 'border-red-600 bg-red-100',
  };

  return (
    <div className={`border-2 ${severityColors[warning.severity || 'medium']} rounded-lg p-4`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-2">
            ⚠️ {warning.type}化灾预警
          </h4>
          <p className="text-sm text-gray-600 mb-3">{warning.description}</p>
          <div className="flex items-center space-x-2 text-sm text-orange-700 font-medium">
            <span>严重程度：</span>
            <span className="font-bold">
              {warning.severity === 'critical' && '严重'}
              {warning.severity === 'high' && '高'}
              {warning.severity === 'medium' && '中等'}
              {warning.severity === 'low' && '轻'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}
