'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, ChevronRight, Clock, History, Sparkles, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

type HistoryFortune = {
  id: string;
  pattern?: {
    type?: string;
    strength?: string;
    description?: string;
  };
  fortune?: {
    currentDaYun?: string;
  };
  analysis?: {
    opening?: string;
    explanation?: string;
    qualityAudit?: {
      overallScore?: number;
      grade?: 'S' | 'A' | 'B' | 'C';
      deliveryTier?: 'basic' | 'enhanced' | 'expert';
    };
    feedbackLoop?: {
      validationInsights?: {
        totalLinkedEvents?: number;
        accurateCount?: number;
        driftCount?: number;
        pendingCount?: number;
      };
      correctionInsight?: {
        level?: 'healthy' | 'watch' | 'action';
      };
    };
  };
  reportVersion?: string;
};

type HistoryEvent = {
  id: string;
  title: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  date: string;
  description?: string;
  fortuneAnalysis?: {
    reportId?: string;
    reason?: string;
  };
  followUpAdvice?: {
    shortTerm?: string;
  };
  userFeedback?: {
    wasAccurate?: boolean;
    userNotes?: string;
  };
};

type HistoryReportCard = {
  id: string;
  createdAt: string;
  title: string;
  result: string;
  summary: string;
  stage: string;
  scoreLabel: string;
  deliveryTierLabel: string;
  reportVersion: string;
  feedbackLabel: string;
  feedbackTone: string;
};

const mapStrengthToResult = (strength?: string) => {
  if (strength === 'strong') return '大吉';
  if (strength === 'medium') return '中吉';
  if (strength === 'weak') return '平';
  return '吉';
};

const truncate = (text: string, max = 58) => {
  if (!text) return '已完成命理综合分析，建议重新进入结果页查看完整阶段判断与行动建议。';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const parseReportCreatedAt = (reportId: string) => {
  const matched = reportId.match(/^report_(\d+)_/);
  if (!matched) {
    return new Date(0).toISOString();
  }

  const timestamp = Number(matched[1]);
  if (!Number.isFinite(timestamp)) {
    return new Date(0).toISOString();
  }

  return new Date(timestamp).toISOString();
};

export default function HistoryPage() {
  const [reports, setReports] = useState<HistoryFortune[]>([]);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
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

        setReports((data.fortunes || []) as HistoryFortune[]);
        setEvents((data.events || []) as HistoryEvent[]);
      } catch {
        setError('网络异常，无法加载历史数据');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const reportCards = useMemo<HistoryReportCard[]>(() => {
    return reports
      .map((item) => {
        const qualityAudit = item.analysis?.qualityAudit;
        return {
          id: item.id,
          createdAt: parseReportCreatedAt(item.id),
          title: item.pattern?.type ? `命理 · ${item.pattern.type}` : '命理综合分析',
          result: mapStrengthToResult(item.pattern?.strength),
          summary: truncate(item.analysis?.opening || item.analysis?.explanation || item.pattern?.description || ''),
          stage: item.fortune?.currentDaYun || '当前阶段信息已写入报告正文',
          scoreLabel: qualityAudit?.overallScore ? `${qualityAudit.overallScore} / ${qualityAudit.grade || 'B'}` : '待补充',
          deliveryTierLabel: qualityAudit?.deliveryTier === 'expert'
            ? 'S级专家版'
            : qualityAudit?.deliveryTier === 'enhanced'
              ? '增强版'
              : '基础版',
          reportVersion: item.reportVersion || 'v1',
          feedbackLabel: item.analysis?.feedbackLoop?.correctionInsight?.level === 'action'
            ? `待纠偏 ${item.analysis?.feedbackLoop?.validationInsights?.driftCount || 0}`
            : item.analysis?.feedbackLoop?.correctionInsight?.level === 'watch'
              ? `待验证 ${item.analysis?.feedbackLoop?.validationInsights?.pendingCount || 0}`
              : `反馈稳定 ${item.analysis?.feedbackLoop?.validationInsights?.accurateCount || 0}`,
          feedbackTone: item.analysis?.feedbackLoop?.correctionInsight?.level === 'action'
            ? 'bg-rose-50 text-rose-700'
            : item.analysis?.feedbackLoop?.correctionInsight?.level === 'watch'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700',
        };
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [reports]);

  const reviewWorkbench = useMemo(() => {
    const now = Date.now();
    const overduePending = events
      .filter((event) => event.userFeedback?.wasAccurate === undefined && new Date(event.date).getTime() < now)
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
    const driftEvents = events
      .filter((event) => event.userFeedback?.wasAccurate === false)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    const accurateCount = events.filter((event) => event.userFeedback?.wasAccurate === true).length;
    const pendingCount = events.filter((event) => event.userFeedback?.wasAccurate === undefined).length;
    const driftCount = driftEvents.length;
    const linkedReportIds = new Set(events.map((event) => event.fortuneAnalysis?.reportId).filter(Boolean));

    return {
      accurateCount,
      pendingCount,
      driftCount,
      overduePending,
      driftEvents,
      linkedReportCount: linkedReportIds.size,
    };
  }, [events]);

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="history_page_viewed" page="/history" meta={{ reports: reportCards.length, events: events.length }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="新建分析" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              复盘工作台
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              用户回来看历史时，
              <span className="font-serif text-[color:var(--accent-strong)]">应该立刻知道现在该处理什么。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里不再只是冷冰冰的历史列表，而是把报告、已发生事件、待验证样本和偏差纠正合到同一处，让每次回访都能继续推进。
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-[color:var(--accent-strong)]" />
              <div className="font-semibold text-[color:var(--ink)]">复访价值概览</div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                '先回看最关键的一份报告',
                '把已发生事件补回验证结果',
                '对偏差样本做纠偏分析',
                '再带着上下文继续问 AI',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: '历史报告', value: reportCards.length, detail: '已生成、可继续复访的报告数量。', tone: 'text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]' },
            { label: '验证准确', value: reviewWorkbench.accurateCount, detail: '已被现实事件验证为准确的判断。', tone: 'text-emerald-700 bg-emerald-50' },
            { label: '待验证', value: reviewWorkbench.pendingCount, detail: '已经进入验证期，但还没有回填结果的事件。', tone: 'text-amber-700 bg-amber-50' },
            { label: '待纠偏', value: reviewWorkbench.driftCount, detail: '已经出现偏差，最值得继续追问和修正的样本。', tone: 'text-rose-700 bg-rose-50' },
          ].map((item) => (
            <div key={item.label} className="soft-card rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${item.tone}`}>{item.value}</div>
              </div>
              <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.detail}</div>
            </div>
          ))}
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && (reviewWorkbench.overduePending.length > 0 || reviewWorkbench.driftEvents.length > 0) ? (
          <section className="mb-8 grid gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-700" />
                <div>
                  <div className="font-semibold text-[color:var(--ink)]">当前最该补回验证的事件</div>
                  <div className="mt-1 text-sm leading-7 text-[color:var(--muted)]">这些事件已经过了发生时间，但还没有记录实际结果。</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {reviewWorkbench.overduePending.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-[1.5rem] bg-white/80 p-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{new Date(event.date).toLocaleDateString('zh-CN')}</div>
                    <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                      {event.fortuneAnalysis?.reason || event.followUpAdvice?.shortTerm || event.description || '回到事件页补回验证结果。'}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href={`/events${event.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}` : ''}`} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink)]">
                        打开事件页
                      </Link>
                      {event.fortuneAnalysis?.reportId ? (
                        <Link href={`/result/${event.fortuneAnalysis.reportId}`} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink)]">
                          回到关联报告
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-700" />
                <div>
                  <div className="font-semibold text-[color:var(--ink)]">当前最该纠偏的样本</div>
                  <div className="mt-1 text-sm leading-7 text-[color:var(--muted)]">这些事件已经出现偏差，最适合继续做纠偏分析和深问。</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {reviewWorkbench.driftEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-[1.5rem] bg-white/80 p-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{new Date(event.date).toLocaleDateString('zh-CN')}</div>
                    <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                      {event.userFeedback?.userNotes || event.fortuneAnalysis?.reason || '进入聊天页继续做偏差修正。'}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {event.fortuneAnalysis?.reportId ? (
                        <Link href={`/chat?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}&eventId=${encodeURIComponent(event.id)}`} className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-2 text-xs font-semibold text-white">
                          进入纠偏分析
                        </Link>
                      ) : null}
                      <Link href={`/events${event.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}` : ''}`} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink)]">
                        查看事件详情
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="soft-card rounded-[2rem] p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="section-label">历史报告</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">继续回看最值得复用的报告</div>
              <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                当前已关联 {reviewWorkbench.linkedReportCount} 份进入现实验证链路的报告。优先回看已经沉淀过事件、能继续产生新判断的那几份。
              </div>
            </div>
            <Link href="/analyze" className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white">
              新建一份分析
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-slate-200" />
              ))}
            </div>
          ) : reportCards.length > 0 ? (
            <div className="space-y-4">
              {reportCards.map((item) => (
                <Link href={`/result/${item.id}`} key={item.id} className="block">
                  <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                            {item.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                            {item.reportVersion}
                          </span>
                          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                            {item.deliveryTierLabel}
                          </span>
                        </div>
                        <p className="mt-3 text-base font-medium text-[color:var(--ink)]">{item.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                            <Target className="h-3.5 w-3.5" />
                            {item.stage}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            质量 {item.scoreLabel}
                          </span>
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${item.feedbackTone}`}>
                            {item.feedbackLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
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
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">先完成一次测算，后续历史、咨询、事件和复盘都会围绕这份结果继续展开。</p>
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
