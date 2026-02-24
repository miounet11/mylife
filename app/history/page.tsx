'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Star, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock data for demonstration
const mockHistory = [
  {
    id: '1',
    date: '2024-03-15T10:30:00Z',
    type: '综合命理分析',
    result: '大吉',
    summary: '近期事业运势旺盛，有贵人相助，适宜开拓新项目。',
  },
  {
    id: '2',
    date: '2024-02-28T14:15:00Z',
    type: '流年运程详解',
    result: '中吉',
    summary: '今年整体平稳，需注意防范小人，感情方面有新机遇。',
  },
  {
    id: '3',
    date: '2024-01-10T09:45:00Z',
    type: '事业财运专批',
    result: '吉',
    summary: '财运渐入佳境，但需注意理财，避免盲目投资。',
  }
];

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState(mockHistory);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch history from an API
    // setTimeout(() => setIsLoading(false), 500);
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition">
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <h1 className="ml-6 text-xl font-bold text-gray-900">
              分析历史
            </h1>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">我的足迹</h2>
                  <p className="text-purple-100 opacity-90">回顾您的每一次命理探索</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : historyList.length > 0 ? (
                <div className="space-y-4">
                  {historyList.map((item) => (
                    <Link href={`/result/${item.id}`} key={item.id} className="block">
                      <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                {item.type}
                              </span>
                              <span className="flex items-center text-gray-500 text-sm">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {new Date(item.date).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-gray-800 font-medium line-clamp-1">{item.summary}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center text-amber-500 mb-2">
                              <Star className="w-4 h-4 fill-current mr-1" />
                              <span className="font-bold text-sm">{item.result}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分析历史</h3>
                  <p className="text-gray-500 mb-6">您还没有进行过命理分析，快去测算一下吧</p>
                  <Link 
                    href="/analyze" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition"
                  >
                    开始测算
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
