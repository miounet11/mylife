'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Star, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

type HistoryItem = {
  id: string;
  date: string;
  type: string;
  result: string;
  summary: string;
};

const mapStrengthToResult = (strength?: string) => {
  if (strength === 'strong') return '大吉';
  if (strength === 'medium') return '中吉';
  if (strength === 'weak') return '平';
  return '吉';
};

const truncate = (text: string, max = 42) => {
  if (!text) return '已完成命理综合分析，点击查看详情。';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/history', { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || '加载历史失败');
          return;
        }

        const mapped: HistoryItem[] = (data.fortunes || []).map((item: any) => ({
          id: item.id,
          date: item.created_at || new Date().toISOString(),
          type: item.pattern?.type ? `命理 · ${item.pattern.type}` : '命理综合分析',
          result: mapStrengthToResult(item.pattern?.strength),
          summary: truncate(item.analysis?.opening || item.analysis?.explanation || ''),
        }));

        setHistoryList(mapped);
      } catch {
        setError('网络异常，无法加载历史数据');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition">
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <h1 className="ml-6 text-xl font-bold text-slate-900 font-serif">
              分析历史
            </h1>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-900">我的分析历史</h2>
              <p className="text-sm text-slate-600 mt-1">回顾每一次命理分析报告</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : historyList.length > 0 ? (
                <div className="space-y-4">
                  {historyList.map((item) => (
                    <Link href={`/result/${item.id}`} key={item.id} className="block">
                      <div className="bg-white border border-slate-200 rounded-lg p-5 hover:border-indigo-200 transition group">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                {item.type}
                              </span>
                              <span className="flex items-center text-slate-500 text-sm">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {new Date(item.date).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium line-clamp-1">{item.summary}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center text-amber-500 mb-2">
                              <Star className="w-4 h-4 fill-current mr-1" />
                              <span className="font-bold text-sm">{item.result}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
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
                  <h3 className="text-lg font-medium text-slate-900 mb-2">暂无分析历史</h3>
                  <p className="text-slate-500 mb-6">您还没有进行过命理分析，快去测算一下吧</p>
                  <Link 
                    href="/analyze" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
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
