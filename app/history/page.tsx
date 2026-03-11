'use client';

import Link from 'next/link';
import { Calendar, Clock, ChevronRight, History, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

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
        const response = await fetch('/api/history', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok || !data.success) {
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
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="新建分析" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              留存复访页
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              用户回来看历史时，
              <span className="font-serif text-[color:var(--accent-strong)]">应该一眼看到价值。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里不再只是冷冰冰的列表，而是一个帮助用户复盘自己命理趋势、重新进入结果页和再次测算的中转站。
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-[color:var(--accent-strong)]" />
              <div className="font-semibold text-[color:var(--ink)]">历史会话价值</div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                '快速回到完整报告页',
                '查看不同时间的判断变化',
                '对照关键建议与现实结果',
                '作为下一次 AI 追问的起点',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="soft-card rounded-[2rem] p-5 md:p-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[1.5rem] bg-slate-200" />
              ))}
            </div>
          ) : historyList.length > 0 ? (
            <div className="space-y-4">
              {historyList.map((item) => (
                <Link href={`/result/${item.id}`} key={item.id} className="block">
                  <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                            {item.type}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(item.date).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="mt-3 text-base font-medium text-[color:var(--ink)]">{item.summary}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          <Star className="h-4 w-4 fill-current" />
                          {item.result}
                        </div>
                        <ChevronRight className="h-5 w-5 text-[color:var(--muted)]" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">还没有分析历史</h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">先完成一次测算，后续历史、咨询和事件都会围绕这份结果继续展开。</p>
              <Link href="/analyze" className="action-primary mt-6">
                开始第一次测算
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
