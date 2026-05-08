'use client';

import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import AnalyticsPageView from '@/components/analytics-page-view';
import PersonalJourneyHub from '@/components/personal-journey-hub';
import ResultCtaLink from '@/components/result-cta-link';
import RetentionResumePanel from '@/components/retention-resume-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolHistoryPanel from '@/components/tool-history-panel';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Stack } from '@/components/ui/stack';
import { Stat } from '@/components/ui/stat';
import { Tag } from '@/components/ui/tag';

import { buildChatHref } from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { appendSourceToHref } from '@/lib/source-url';
import { resolveResumeTarget } from '@/lib/resume-target';
import ResumeBar from '@/components/resume-bar';
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
  feedbackTone: 'up' | 'signal' | 'down';
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
  if (!matched) return new Date(0).toISOString();
  const timestamp = Number(matched[1]);
  if (!Number.isFinite(timestamp)) return new Date(0).toISOString();
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
        const data = (await response.json()) as HistoryResponse;
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
        const correctionLevel = item.analysis?.feedbackLoop?.correctionInsight?.level;
        const validationInsights = item.analysis?.feedbackLoop?.validationInsights;
        return {
          id: item.id,
          createdAt: parseReportCreatedAt(item.id),
          title: item.pattern?.type ? `结构 · ${item.pattern.type}` : '综合判断',
          result: mapStrengthToResult(item.pattern?.strength),
          summary: truncate(
            item.analysis?.opening ||
              item.analysis?.explanation ||
              item.pattern?.description ||
              '',
          ),
          stage: item.fortune?.currentDaYun || '当前阶段信息已写入报告正文',
          scoreLabel: qualityAudit?.overallScore
            ? `${qualityAudit.overallScore} / ${qualityAudit.grade || 'B'}`
            : '待补充',
          deliveryTierLabel:
            qualityAudit?.deliveryTier === 'expert'
              ? 'S 级专家版'
              : qualityAudit?.deliveryTier === 'enhanced'
                ? '增强版'
                : '基础版',
          reportVersion: item.reportVersion || 'v1',
          feedbackLabel:
            correctionLevel === 'action'
              ? `待纠偏 ${validationInsights?.driftCount || 0}`
              : correctionLevel === 'watch'
                ? `待验证 ${validationInsights?.pendingCount || 0}`
                : `反馈稳定 ${validationInsights?.accurateCount || 0}`,
          feedbackTone:
            correctionLevel === 'action'
              ? ('down' as const)
              : correctionLevel === 'watch'
                ? ('signal' as const)
                : ('up' as const),
        };
      })
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  }, [reports]);

  // v5-C4 决策台风「继续上次」恢复条
  const resumeTarget = useMemo(() => {
    if (!reports.length && !events.length) return null;
    return resolveResumeTarget({
      recentChat: [],
      events: (events as any[]) || [],
      reports: (reports as any[]) || [],
    });
  }, [reports, events]);

  const reviewWorkbench = useMemo(() => {
    const unresolved = events
      .filter((event) => event.userFeedback?.wasAccurate === undefined)
      .sort((left, right) => getEventViewSortTime(left) - getEventViewSortTime(right));
    const overduePending =
      reviewAnchorMs === null
        ? []
        : unresolved.filter((event) => getEventViewSortTime(event) < reviewAnchorMs);
    const driftEvents = events
      .filter((event) => event.userFeedback?.wasAccurate === false)
      .sort((left, right) => getEventViewSortTime(right) - getEventViewSortTime(left));
    const accurateCount = events.filter((event) => event.userFeedback?.wasAccurate === true).length;
    const pendingCount = unresolved.length;
    const driftCount = driftEvents.length;
    const linkedReportIds = new Set(
      events.map((event) => event.fortuneAnalysis?.reportId).filter(Boolean),
    );
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
      <AnalyticsPageView
        eventName="history_page_viewed"
        page="/history"
        meta={{ reports: reportCards.length, events: events.length }}
      />
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

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="mb-6 md:mb-8">
          <Inline justify="between" align="end" wrap className="gap-4">
            <Stack gap={3}>
              <Eyebrow icon={<History className="h-3 w-3" />}>复盘工作台</Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                历史记录 · 把过去的判断转成下一轮质量
              </h1>
            </Stack>
            <Inline gap={2} wrap justify="end">
              <ResultCtaLink
                href={appendSourceToHref('/events', pageSource)}
                page="/history"
                target="history_header_events"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'history_header',
                  pendingCount: reviewWorkbench.pendingCount,
                }}
              >
                进入事件页
              </ResultCtaLink>
              <ResultCtaLink
                href={historyResumeChatHref}
                page="/history"
                target="history_header_chat"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'history_header',
                  pendingCount: reviewWorkbench.pendingCount,
                  driftCount: reviewWorkbench.driftCount,
                }}
              >
                继续追问
              </ResultCtaLink>
              <ResultCtaLink
                href="/docs/profile-history"
                page="/history"
                target="history_header_docs"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'history_header',
                }}
              >
                <BookOpenText className="h-4 w-4" />
                使用方法
              </ResultCtaLink>
            </Inline>
          </Inline>
        </section>

        {/* v5-C4 决策台风「继续上次」恢复条 */}
        {resumeTarget ? (
          <div className="mb-6">
            <ResumeBar target={resumeTarget} surface="history" />
          </div>
        ) : null}

        {/* 4-stat 决策台 */}
        <Card variant="default" padding="lg" className="mb-6 bg-[color:var(--bg-elevated)]">
          <Eyebrow tone="muted" className="mb-4">复盘指标</Eyebrow>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="历史报告" value={String(reportCards.length)} size="md" />
            <Stat
              label="验证准确"
              value={String(reviewWorkbench.accurateCount)}
              size="md"
              deltaDirection="up"
            />
            <Stat
              label="待验证"
              value={String(reviewWorkbench.pendingCount)}
              size="md"
              deltaDirection="flat"
            />
            <Stat
              label="待纠偏"
              value={String(reviewWorkbench.driftCount)}
              size="md"
              deltaDirection={reviewWorkbench.driftCount > 0 ? 'down' : 'flat'}
            />
          </div>
        </Card>

        {/* 接力面板 */}
        {!isLoading && (
          <div className="mb-6">
            <RetentionResumePanel
              page="/history"
              source={pageSource}
              ctaStrategyKey={sourceCtaStrategy.strategyKey}
              sourceFamily={sourceCtaStrategy.sourceFamily}
              title={
                topDriftEvent
                  ? '先把最关键的偏差样本纠回来'
                  : topOverdueEvent
                    ? '先把最该回收的验证结果补回来'
                    : '从最近一份报告继续复盘'
              }
              description={
                topDriftEvent
                  ? '历史页最有价值的不是回看列表，而是直接恢复到那条已经出现偏差的样本，把结构、阶段、触发条件和执行动作拆开重判。'
                  : topOverdueEvent
                    ? '先把已过期但还没确认结果的事件补回反馈，再决定哪些判断应该继续放大，哪些要进入纠偏分析。'
                    : '如果当前没有强烈的待修样本，最好的下一步就是从最近一份报告恢复追问，把历史记录重新接成行动路径。'
              }
              stats={[
                { label: '待验证', value: reviewWorkbench.pendingCount, helper: '还没回收真实结果' },
                { label: '待纠偏', value: reviewWorkbench.driftCount, helper: '已确认存在偏差' },
                {
                  label: '已联动报告',
                  value: reviewWorkbench.linkedReportCount,
                  helper: '进入验证链路的报告',
                },
              ]}
              actions={[
                {
                  href: historyResumeChatHref,
                  label: topDriftEvent ? '恢复纠偏分析' : '恢复复盘追问',
                  target: topDriftEvent
                    ? 'retention_resume_drift_chat'
                    : 'retention_resume_history_chat',
                  meta: {
                    reportId:
                      topDriftEvent?.fortuneAnalysis?.reportId || latestReportCard?.id || null,
                    eventId: topDriftEvent?.id || null,
                    driftCount: reviewWorkbench.driftCount,
                    pendingCount: reviewWorkbench.pendingCount,
                  },
                },
                {
                  href: topOverdueEvent
                    ? appendSourceToHref(
                        `/events${
                          topOverdueEvent.fortuneAnalysis?.reportId
                            ? `?reportId=${encodeURIComponent(topOverdueEvent.fortuneAnalysis.reportId)}`
                            : ''
                        }`,
                        pageSource,
                      )
                    : appendSourceToHref('/events', pageSource),
                  label: topOverdueEvent ? '补回验证结果' : '进入事件页',
                  target: 'retention_resume_events',
                  meta: { overduePendingCount: reviewWorkbench.overduePending.length },
                },
                {
                  href: latestReportCard
                    ? appendSourceToHref(`/result/${latestReportCard.id}`, pageSource)
                    : '/analyze',
                  label: latestReportCard ? '打开最近报告' : '新建一份分析',
                  target: latestReportCard
                    ? 'retention_resume_latest_report'
                    : 'retention_resume_analyze',
                  meta: { reportId: latestReportCard?.id || null },
                },
              ]}
            />
          </div>
        )}

        {/* 单项工具复访 */}
        <div className="mb-6">
          <ToolHistoryPanel
            compact
            title="单项工具复访区"
            description="把做过的单项工具判断放回一起复看，方便你确认哪些问题已经验证、哪些还要继续追踪。"
          />
        </div>

        {error && (
          <Card
            variant="default"
            padding="md"
            className="mb-6 border-[color:var(--alert)] bg-[color:var(--alert-soft)]"
          >
            <p className="text-sm font-semibold text-[color:var(--alert)]">{error}</p>
          </Card>
        )}

        {/* 待补回 / 待纠偏（双栏） */}
        {!isLoading &&
          (reviewWorkbench.overduePending.length > 0 || reviewWorkbench.driftEvents.length > 0) && (
            <section className="mb-8 grid gap-5 xl:grid-cols-2">
              {reviewWorkbench.overduePending.length > 0 && (
                <Card variant="default" padding="lg">
                  <Inline gap={2} className="mb-4">
                    <Clock className="h-4 w-4 text-[color:var(--signal-strong)]" />
                    <Eyebrow tone="signal">最该补回验证的事件</Eyebrow>
                  </Inline>
                  <Stack gap={3}>
                    {reviewWorkbench.overduePending.slice(0, 3).map((event) => (
                      <Card key={event.id} variant="sunken" padding="md">
                        <div className="text-sm font-bold text-[color:var(--ink-1)]">
                          {event.title}
                        </div>
                        <div className="mt-1 font-mono text-xs tabular-nums text-[color:var(--ink-5)]">
                          {formatDateLabel(event.dateKey || '')}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                          {event.fortuneAnalysis?.reason ||
                            event.followUpAdvice?.shortTerm ||
                            event.description ||
                            '回到事件页补回验证结果。'}
                        </p>
                        <Inline gap={2} wrap className="mt-3">
                          <ResultCtaLink
                            href={appendSourceToHref(
                              `/events${
                                event.fortuneAnalysis?.reportId
                                  ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}`
                                  : ''
                              }`,
                              pageSource,
                            )}
                            page="/history"
                            target="history_overdue_event_queue"
                            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
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
                          {event.fortuneAnalysis?.reportId && (
                            <ResultCtaLink
                              href={appendSourceToHref(
                                `/result/${event.fortuneAnalysis.reportId}`,
                                pageSource,
                              )}
                              page="/history"
                              target="history_overdue_report"
                              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
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
                          )}
                        </Inline>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              )}

              {reviewWorkbench.driftEvents.length > 0 && (
                <Card variant="default" padding="lg" className="border-[color:var(--alert)]">
                  <Inline gap={2} className="mb-4">
                    <AlertTriangle className="h-4 w-4 text-[color:var(--alert)]" />
                    <Eyebrow tone="brand" className="text-[color:var(--alert)]">
                      最该纠偏的样本
                    </Eyebrow>
                  </Inline>
                  <Stack gap={3}>
                    {reviewWorkbench.driftEvents.slice(0, 3).map((event) => (
                      <Card key={event.id} variant="sunken" padding="md">
                        <div className="text-sm font-bold text-[color:var(--ink-1)]">
                          {event.title}
                        </div>
                        <div className="mt-1 font-mono text-xs tabular-nums text-[color:var(--ink-5)]">
                          {formatDateLabel(event.dateKey || '')}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                          {event.userFeedback?.userNotes ||
                            event.fortuneAnalysis?.reason ||
                            '进入聊天页继续做偏差修正。'}
                        </p>
                        <Inline gap={2} wrap className="mt-3">
                          {event.fortuneAnalysis?.reportId && (
                            <ResultCtaLink
                              href={buildChatHref({
                                reportId: event.fortuneAnalysis.reportId,
                                eventId: event.id,
                                question:
                                  '请围绕这条偏差事件继续做纠偏分析，告诉我这次最该修的是结构判断、阶段判断、环境判断，还是执行动作。',
                                source: 'history_drift_review',
                                ctaStrategyKey: sourceCtaStrategy.strategyKey,
                                sourceFamily: sourceCtaStrategy.sourceFamily,
                              })}
                              page="/history"
                              target="history_drift_panel_chat"
                              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--alert)] px-3 text-xs font-semibold text-white hover:opacity-95"
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
                          )}
                          <ResultCtaLink
                            href={appendSourceToHref(
                              `/events${
                                event.fortuneAnalysis?.reportId
                                  ? `?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}`
                                  : ''
                              }`,
                              pageSource,
                            )}
                            page="/history"
                            target="history_drift_panel_events"
                            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
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
                        </Inline>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              )}
            </section>
          )}

        {/* 报告列表 */}
        <Card variant="default" padding="lg" className="mb-6">
          <Inline justify="between" align="end" wrap className="mb-5">
            <div>
              <Eyebrow>历史报告</Eyebrow>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">
                <span className="font-mono tabular-nums">{reportCards.length}</span> 份报告
              </h2>
              <p className="mt-1 text-sm text-[color:var(--ink-4)]">
                已进入验证链路{' '}
                <span className="font-mono">{reviewWorkbench.linkedReportCount}</span> 份
              </p>
            </div>
            <ResultCtaLink
              href="/analyze"
              page="/history"
              target="history_reports_analyze"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
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
          </Inline>

          {isLoading ? (
            <Stack gap={3}>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]"
                />
              ))}
            </Stack>
          ) : reportCards.length > 0 ? (
            <Stack gap={3}>
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
                  <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-4 transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:shadow-[var(--shadow-card)] md:px-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <Inline gap={2} wrap>
                          <Tag tone="brand" variant="soft" size="sm">
                            {item.title}
                          </Tag>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums text-[color:var(--ink-5)]">
                            <Calendar className="h-3 w-3" />
                            {formatDateLabel(item.createdAt)}
                          </span>
                          <Tag tone="default" variant="outline" size="xs">
                            <span className="font-mono">{item.reportVersion}</span>
                          </Tag>
                          <Tag tone="default" variant="soft" size="xs">
                            {item.deliveryTierLabel}
                          </Tag>
                        </Inline>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                          {item.summary}
                        </p>
                        <Inline gap={2} wrap className="mt-3">
                          <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-4)]">
                            <Target className="h-3 w-3" />
                            {item.stage}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--ink-4)]">
                            <CheckCircle2 className="h-3 w-3" />
                            质量 {item.scoreLabel}
                          </span>
                          <Tag tone={item.feedbackTone} variant="soft" size="xs">
                            {item.feedbackLabel}
                          </Tag>
                        </Inline>
                      </div>

                      <Inline gap={2} className="shrink-0">
                        <Tag tone="signal" variant="soft" size="sm">
                          {item.result}
                        </Tag>
                        <ChevronRight className="h-4 w-4 text-[color:var(--ink-5)]" />
                      </Inline>
                    </div>
                  </div>
                </ResultCtaLink>
              ))}
            </Stack>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[color:var(--bg-sunken)]">
                <Clock className="h-6 w-6 text-[color:var(--ink-5)]" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[color:var(--ink-1)]">
                还没有分析历史
              </h3>
              <ResultCtaLink
                href="/analyze"
                page="/history"
                target="history_empty_analyze"
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
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
        </Card>

        {/* 个人路径 */}
        <PersonalJourneyHub
          title="后续入口"
          description="根据你已经生成的报告和验证记录，继续安排最适合现在推进的内容、工具和追问入口。"
          page="/history"
        />
      </main>

      <SiteFooter />
    </div>
  );
}
