'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, ChevronRight, Clock, History, Sparkles, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PersonalJourneyHub from '@/components/personal-journey-hub';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicSurfaceHero from '@/components/public-surface-hero';
import ResultCtaLink from '@/components/result-cta-link';
import RetentionResumePanel from '@/components/retention-resume-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildChatHref } from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { appendSourceToHref } from '@/lib/source-url';
import {
  formatEventDateKey,
  getEventViewSortTime,
  toEventViewModels,
  type EventTransportRecord,
  type EventViewModel,
} from '@/lib/event-view';

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

type HistoryEvent = EventViewModel;

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

type HistoryResponse = {
  success: boolean;
  fortunes?: HistoryFortune[];
  events?: EventTransportRecord[];
  error?: string;
};

const mapStrengthToResult = (strength?: string) => {
  if (strength === 'strong') return '大吉';
  if (strength === 'medium') return '中吉';
  if (strength === 'weak') return '平';
  return '吉';
};

const truncate = (text: string, max = 58) => {
  if (!text) return '已完成综合判断，建议重新进入结果页查看完整阶段判断与行动建议。';
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

const formatDateLabel = (value?: string) => {
  if (!value) return '未记录';

  return formatEventDateKey(value);
};

export default function HistoryPage() {
  const [reports, setReports] = useState<HistoryFortune[]>([]);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewAnchorMs, setReviewAnchorMs] = useState<number | null>(null);
  const pageSource = 'history_page';
  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);

  useEffect(() => {
    setReviewAnchorMs(Date.now());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/history', { cache: 'no-store' });
        const data = await response.json() as HistoryResponse;

        if (!response.ok || !data.success) {
          setError(data.error || '加载历史失败');
          return;
        }

        setReports((data.fortunes || []) as HistoryFortune[]);
        setEvents(toEventViewModels(data.events || []));
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
          title: item.pattern?.type ? `结构 · ${item.pattern.type}` : '综合判断',
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
    const unresolved = events
      .filter((event) => event.userFeedback?.wasAccurate === undefined)
      .sort((left, right) => getEventViewSortTime(left) - getEventViewSortTime(right));
    const overduePending = reviewAnchorMs === null
      ? []
      : unresolved.filter((event) => getEventViewSortTime(event) < reviewAnchorMs);
    const driftEvents = events
      .filter((event) => event.userFeedback?.wasAccurate === false)
      .sort((left, right) => getEventViewSortTime(right) - getEventViewSortTime(left));
    const accurateCount = events.filter((event) => event.userFeedback?.wasAccurate === true).length;
    const pendingCount = unresolved.length;
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
  }, [events, reviewAnchorMs]);
  const topOverdueEvent = reviewWorkbench.overduePending[0];
  const topDriftEvent = reviewWorkbench.driftEvents[0];
  const latestReportCard = reportCards[0];
  const historyResumeChatHref = buildChatHref({
    reportId: topDriftEvent?.fortuneAnalysis?.reportId || latestReportCard?.id || undefined,
    eventId: topDriftEvent?.id || undefined,
    question: topDriftEvent
      ? '请围绕这条已经出现偏差的历史事件继续做纠偏分析，并告诉我这次最应该修哪一层判断。'
      : '请根据我历史里的报告、事件和偏差样本，直接告诉我现在最值得先复盘的一条主线，以及为什么要从它开始。',
    source: topDriftEvent ? 'history_drift_review' : pageSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="history_page_viewed" page="/history" meta={{ reports: reportCards.length, events: events.length }} />
      <SiteHeader
        ctaHref="/analyze"
        ctaLabel="新建分析"
        ctaAnalytics={{
          page: '/history',
          target: 'history_header_analyze',
          meta: {
            source: pageSource,
            ctaStrategyKey: sourceCtaStrategy.strategyKey,
            sourceFamily: sourceCtaStrategy.sourceFamily,
            reportCount: reportCards.length,
          },
        }}
      />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              复盘工作台
            </>
          )}
          title="历史记录"
          description="把已经生成的报告、事件和追问记录放回同一个复盘工作台，方便你持续校准判断。"
          hint="建议先回看最关键的一份报告，再补充已经发生的事件，最后带上下文继续追问。"
          actions={[
            <ResultCtaLink
              key="events"
              href={appendSourceToHref('/events', pageSource)}
              page="/history"
              target="history_hero_events"
              className="action-primary action-main"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'history_hero',
                pendingCount: reviewWorkbench.pendingCount,
              }}
            >
              进入事件页
            </ResultCtaLink>,
            <ResultCtaLink
              key="chat"
              href={buildChatHref({
                question: '请根据我历史里的报告、事件和偏差样本，帮我判断：现在最值得优先复盘哪一条主线，为什么？',
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
              })}
              page="/history"
              target="history_hero_chat"
              className="action-secondary"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'history_hero',
                pendingCount: reviewWorkbench.pendingCount,
                driftCount: reviewWorkbench.driftCount,
              }}
            >
              继续追问
            </ResultCtaLink>,
            <ResultCtaLink
              key="analyze"
              href="/analyze"
              page="/history"
              target="history_hero_analyze"
              className="action-secondary"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'history_hero',
              }}
            >
              新建分析
            </ResultCtaLink>,
          ]}
          highlights={[
            { body: '先回看最关键的一份报告' },
            { body: '把已发生事件补回验证结果' },
            { body: '对偏差样本做纠偏分析' },
            { body: '再带着上下文继续问 AI' },
          ]}
        />

        <ProductSurfaceRolePanel
          surface="history"
          className="mb-8 mt-8"
          title="历史页先处理待验证和偏差样本"
          description="历史不是归档列表，而是把过去的报告与现实事件转成下一轮判断质量提升。"
          compact
        />

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: '历史报告', value: reportCards.length, tone: 'text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]' },
            { label: '验证准确', value: reviewWorkbench.accurateCount, tone: 'text-emerald-700 bg-emerald-50' },
            { label: '待验证', value: reviewWorkbench.pendingCount, tone: 'text-amber-700 bg-amber-50' },
            { label: '待纠偏', value: reviewWorkbench.driftCount, tone: 'text-rose-700 bg-rose-50' },
          ].map((item) => (
            <div key={item.label} className="soft-card rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            </div>
          ))}
        </section>

        {!isLoading ? (
          <div className="mb-8">
            <RetentionResumePanel
              page="/history"
              source={pageSource}
              ctaStrategyKey={sourceCtaStrategy.strategyKey}
              sourceFamily={sourceCtaStrategy.sourceFamily}
              title={topDriftEvent ? '先把最关键的偏差样本纠回来' : topOverdueEvent ? '先把最该回收的验证结果补回来' : '从最近一份报告继续复盘'}
              description={topDriftEvent
                ? '历史页最有价值的不是回看列表，而是直接恢复到那条已经出现偏差的样本，把结构、阶段、触发条件和执行动作拆开重判。'
                : topOverdueEvent
                  ? '先把已过期但还没确认结果的事件补回反馈，再决定哪些判断应该继续放大，哪些要进入纠偏分析。'
                  : '如果当前没有强烈的待修样本，最好的下一步就是从最近一份报告恢复追问，把历史记录重新接成行动路径。'}
              stats={[
                { label: '待验证', value: reviewWorkbench.pendingCount, helper: '还没回收真实结果' },
                { label: '待纠偏', value: reviewWorkbench.driftCount, helper: '已确认存在偏差' },
                { label: '已联动报告', value: reviewWorkbench.linkedReportCount, helper: '进入验证链路的报告' },
              ]}
              actions={[
                {
                  href: historyResumeChatHref,
                  label: topDriftEvent ? '恢复纠偏分析' : '恢复复盘追问',
                  target: topDriftEvent ? 'retention_resume_drift_chat' : 'retention_resume_history_chat',
                  meta: {
                    reportId: topDriftEvent?.fortuneAnalysis?.reportId || latestReportCard?.id || null,
                    eventId: topDriftEvent?.id || null,
                    driftCount: reviewWorkbench.driftCount,
                    pendingCount: reviewWorkbench.pendingCount,
                  },
                },
                {
                  href: topOverdueEvent
                    ? appendSourceToHref(`/events${topOverdueEvent.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(topOverdueEvent.fortuneAnalysis.reportId)}` : ''}`, pageSource)
                    : appendSourceToHref('/events', pageSource),
                  label: topOverdueEvent ? '补回验证结果' : '进入事件页',
                  target: 'retention_resume_events',
                  meta: { overduePendingCount: reviewWorkbench.overduePending.length },
                },
                {
                  href: latestReportCard ? appendSourceToHref(`/result/${latestReportCard.id}`, pageSource) : '/analyze',
                  label: latestReportCard ? '打开最近报告' : '新建一份分析',
                  target: latestReportCard ? 'retention_resume_latest_report' : 'retention_resume_analyze',
                  meta: { reportId: latestReportCard?.id || null },
                },
              ]}
            />
          </div>
        ) : null}

        <div className="mb-8">
          <ToolHistoryPanel
            title="单项工具复访区"
            description="把做过的单项工具判断放回一起复看，方便你确认哪些问题已经验证、哪些还要继续追踪。"
          />
        </div>

        <div className="mb-8">
          <PersonalJourneyHub
            title="后续入口"
            description="根据你已经生成的报告和验证记录，继续安排最适合现在推进的内容、工具和追问入口。"
            page="/history"
          />
        </div>

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
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {reviewWorkbench.overduePending.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-[1.5rem] bg-white/80 p-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{formatDateLabel(event.dateKey || '')}</div>
                    <div className="mt-3 text-sm text-[color:var(--ink)]">
                      {event.fortuneAnalysis?.reason || event.followUpAdvice?.shortTerm || event.description || '回到事件页补回验证结果。'}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ResultCtaLink
                        href={appendSourceToHref(`/events${event.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}` : ''}`, pageSource)}
                        page="/history"
                        target="history_overdue_event_queue"
                        className="action-secondary"
                        meta={{
                          source: pageSource,
                          ctaStrategyKey: sourceCtaStrategy.strategyKey,
                          sourceFamily: sourceCtaStrategy.sourceFamily,
                          surface: 'history_overdue_panel',
                          eventId: event.id,
                          reportId: event.fortuneAnalysis?.reportId || null,
                        }}
                      >
                        打开事件页
                      </ResultCtaLink>
                      {event.fortuneAnalysis?.reportId ? (
                        <ResultCtaLink
                          href={appendSourceToHref(`/result/${event.fortuneAnalysis.reportId}`, pageSource)}
                          page="/history"
                          target="history_overdue_report"
                          className="action-secondary"
                          meta={{
                            source: pageSource,
                            ctaStrategyKey: sourceCtaStrategy.strategyKey,
                            sourceFamily: sourceCtaStrategy.sourceFamily,
                            surface: 'history_overdue_panel',
                            eventId: event.id,
                            reportId: event.fortuneAnalysis.reportId,
                          }}
                        >
                          回到关联报告
                        </ResultCtaLink>
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
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {reviewWorkbench.driftEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-[1.5rem] bg-white/80 p-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{formatDateLabel(event.dateKey || '')}</div>
                    <div className="mt-3 text-sm text-[color:var(--ink)]">
                      {event.userFeedback?.userNotes || event.fortuneAnalysis?.reason || '进入聊天页继续做偏差修正。'}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {event.fortuneAnalysis?.reportId ? (
                        <ResultCtaLink
                          href={buildChatHref({
                            reportId: event.fortuneAnalysis.reportId,
                            eventId: event.id,
                            question: '请围绕这条偏差事件继续做纠偏分析，告诉我这次最该修的是结构判断、阶段判断、环境判断，还是执行动作。',
                            source: 'history_drift_review',
                            ctaStrategyKey: sourceCtaStrategy.strategyKey,
                            sourceFamily: sourceCtaStrategy.sourceFamily,
                          })}
                          page="/history"
                          target="history_drift_panel_chat"
                          className="action-primary"
                          meta={{
                            source: 'history_drift_review',
                            ctaStrategyKey: sourceCtaStrategy.strategyKey,
                            sourceFamily: sourceCtaStrategy.sourceFamily,
                            surface: 'history_drift_panel',
                            eventId: event.id,
                            reportId: event.fortuneAnalysis.reportId,
                          }}
                        >
                          进入纠偏分析
                        </ResultCtaLink>
                      ) : null}
                      <ResultCtaLink
                        href={appendSourceToHref(`/events${event.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}` : ''}`, pageSource)}
                        page="/history"
                        target="history_drift_panel_events"
                        className="action-secondary"
                        meta={{
                          source: pageSource,
                          ctaStrategyKey: sourceCtaStrategy.strategyKey,
                          sourceFamily: sourceCtaStrategy.sourceFamily,
                          surface: 'history_drift_panel',
                          eventId: event.id,
                          reportId: event.fortuneAnalysis?.reportId || null,
                        }}
                      >
                        查看事件详情
                      </ResultCtaLink>
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
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">报告</div>
              <div className="mt-2 text-sm text-[color:var(--muted)]">{`已进入验证链路 ${reviewWorkbench.linkedReportCount} 份`}</div>
            </div>
            <ResultCtaLink
              href="/analyze"
              page="/history"
              target="history_reports_analyze"
              className="action-primary"
              meta={{
                source: pageSource,
                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                sourceFamily: sourceCtaStrategy.sourceFamily,
                surface: 'history_reports_section',
              }}
            >
              新建一份分析
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
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
                <ResultCtaLink
                  href={appendSourceToHref(`/result/${item.id}`, pageSource)}
                  key={item.id}
                  page="/history"
                  target="history_report_card"
                  className="block"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    surface: 'history_report_list',
                    reportId: item.id,
                  }}
                >
                  <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                            {item.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--muted)]">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateLabel(item.createdAt)}
                          </span>
                          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                            {item.reportVersion}
                          </span>
                          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                            {item.deliveryTierLabel}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{item.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
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
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {item.result}
                        </div>
                        <ChevronRight className="h-5 w-5 text-[color:var(--muted)]" />
                      </div>
                    </div>
                  </div>
                </ResultCtaLink>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">还没有分析历史</h2>
              <ResultCtaLink
                href="/analyze"
                page="/history"
                target="history_empty_analyze"
                className="action-primary mt-6"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'history_empty_state',
                }}
              >
                开始第一次判断
              </ResultCtaLink>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
