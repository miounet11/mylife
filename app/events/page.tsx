// 事件页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock3, Filter, Grid, Plus, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import ResultCtaLink from '@/components/result-cta-link';
import RetentionResumePanel from '@/components/retention-resume-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { buildChatHref } from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import { appendSourceToHref } from '@/lib/source-url';
import { formatLocalDateKey, getTodayLocalDateKey } from '@/lib/utils';
import {
  formatEventQueueDateKey,
  getEstimatedPastEventPrompt,
  getEventViewSortTime,
  toEventViewModels,
  type EventViewImpact,
  type EventViewModel,
  type EventTransportRecord,
  type EventViewType,
} from '@/lib/event-view';

// 动态导入
const EventCalendar = dynamic(() => import('@/components/event-calendar'), {
  loading: () => <CalendarSkeleton />,
});

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

type EventType = EventViewType;
type ImpactType = EventViewImpact;
type UIEvent = EventViewModel;

interface EventFormState {
  type: EventType;
  title: string;
  date: string;
  time: string;
  description: string;
  impact: ImpactType;
  reminderEnabled: boolean;
  reminderAdvanceDays: number;
  reminderMethod: 'app' | 'email' | 'sms';
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

type EventsResponse = {
  success: boolean;
  data?: {
    events?: EventTransportRecord[];
    total?: number;
  };
  error?: string;
};

const formatDateForInput = (date: Date) => formatLocalDateKey(date);

const DEFAULT_FORM: EventFormState = {
  type: 'career',
  title: '',
  date: '',
  time: '09:00',
  description: '',
  impact: 'neutral',
  reminderEnabled: true,
  reminderAdvanceDays: 7,
  reminderMethod: 'app',
};

const createDefaultForm = (): EventFormState => ({
  ...DEFAULT_FORM,
});

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageFallback />}>
      <EventsPageContent />
    </Suspense>
  );
}

function EventsPageContent() {
  const searchParams = useSearchParams();
  const focusedReportId = searchParams.get('reportId') || '';
  const pageSource = 'events_page';
  const sourceCtaStrategy = buildSourceCtaStrategy(pageSource);
  const shouldOpenCreate = searchParams.get('create') === '1';
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<UIEvent[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | EventType>('all');
  const [keyword, setKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [handledCreateIntent, setHandledCreateIntent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(createDefaultForm());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [validationAnchorMs, setValidationAnchorMs] = useState<number | null>(null);

  const showSuccess = (message: string) => {
    setToast({ type: 'success', message });
  };

  const showError = (message: string) => {
    setError(message);
    setToast({ type: 'error', message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setValidationAnchorMs(Date.now());
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setError('');
      const query = focusedReportId ? `?reportId=${encodeURIComponent(focusedReportId)}` : '';
      const res = await fetch(`/api/events${query}`, { cache: 'no-store' });
      const data = await res.json() as EventsResponse;
      if (!res.ok || !data.success) {
        showError(data.error || '加载事件失败');
        return;
      }

      setEvents(toEventViewModels(data.data?.events || []));
    } catch {
      showError('网络异常，无法加载事件');
    }
  }, [focusedReportId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadEvents();
      setLoading(false);
    };

    init();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    return events.filter((event) => {
      const reportMatched = focusedReportId ? event.fortuneAnalysis?.reportId === focusedReportId : true;
      const typeMatched = selectedType === 'all' ? true : event.type === selectedType;
      const searchMatched = keywordLower
        ? event.title.toLowerCase().includes(keywordLower) || event.description.toLowerCase().includes(keywordLower)
        : true;
      return reportMatched && typeMatched && searchMatched;
    });
  }, [events, focusedReportId, keyword, selectedType]);

  const workbenchEvents = focusedReportId ? filteredEvents : events;

  useEffect(() => {
    if (shouldOpenCreate && !handledCreateIntent && !showForm) {
      setShowForm(true);
      setHandledCreateIntent(true);
    }
  }, [handledCreateIntent, shouldOpenCreate, showForm]);

  const validationWorkbench = useMemo(() => {
    const unresolved = workbenchEvents
      .filter((event) => event.userFeedback?.wasAccurate === undefined)
      .sort((left, right) => getEventSortTime(left) - getEventSortTime(right));
    const overduePending = validationAnchorMs === null
      ? []
      : unresolved.filter((event) => getEventSortTime(event) < validationAnchorMs);
    const driftEvents = workbenchEvents
      .filter((event) => event.userFeedback?.wasAccurate === false)
      .sort((left, right) => getEventSortTime(right) - getEventSortTime(left));
    const upcomingValidation = validationAnchorMs === null
      ? unresolved.slice(0, 4)
      : unresolved.filter((event) => getEventSortTime(event) >= validationAnchorMs).slice(0, 4);

    return {
      overduePending,
      driftEvents,
      upcomingValidation,
      accurateCount: workbenchEvents.filter((event) => event.userFeedback?.wasAccurate === true).length,
      pendingCount: unresolved.length,
    };
  }, [validationAnchorMs, workbenchEvents]);
  const topOverdueEvent = validationWorkbench.overduePending[0];
  const topDriftEvent = validationWorkbench.driftEvents[0];
  const topUpcomingEvent = validationWorkbench.upcomingValidation[0];
  const eventsResumeChatHref = buildChatHref({
    reportId: topDriftEvent?.fortuneAnalysis?.reportId || topOverdueEvent?.fortuneAnalysis?.reportId || focusedReportId || undefined,
    eventId: topDriftEvent?.id || topOverdueEvent?.id || undefined,
    question: topDriftEvent
      ? '请围绕这条已经出现偏差的事件继续做纠偏分析，并告诉我接下来最应该修哪一层判断。'
      : topOverdueEvent
        ? '请结合这条已过期待验证的事件，告诉我现在最应该回收什么反馈，以及为什么。'
        : '请结合我事件中心里正在跟踪的节点，告诉我现在最值得优先推进或验证的是哪一件事，为什么？',
    source: topDriftEvent ? 'events_drift_queue' : pageSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });

  const openCreateForm = () => {
    setEditingEventId(null);
    setForm({
      ...createDefaultForm(),
      date: getTodayLocalDateKey(),
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (event: UIEvent) => {
    setEditingEventId(event.id);
    setForm({
      type: event.type,
      title: event.title,
      date: event.dateKey,
      time: event.time || '09:00',
      description: event.description,
      impact: event.impact,
      reminderEnabled: !!event.reminder?.enabled,
      reminderAdvanceDays: event.reminder?.advanceDays ?? 7,
      reminderMethod: event.reminder?.method || 'app',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEventId(null);
    setForm(createDefaultForm());
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;

    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        description: form.description.trim(),
        impact: form.impact,
        reminderEnabled: form.reminderEnabled,
        reminderAdvanceDays: form.reminderAdvanceDays,
        reminderMethod: form.reminderMethod,
        fortuneAnalysis: focusedReportId
          ? {
              source: 'manual',
              reportId: focusedReportId,
            }
          : undefined,
      };

      const isEditMode = !!editingEventId;
      const res = await fetch('/api/events', {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditMode ? { id: editingEventId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || (isEditMode ? '更新事件失败' : '创建事件失败'));
        return;
      }

      const editingEstimatedPastEvent = isEditMode && events.find((event) => event.id === editingEventId)?.isEstimatedPastEvent;
      closeForm();
      showSuccess(
        editingEstimatedPastEvent
          ? '真实日期已更新，这条历史印证样本现在可以正常参与复盘'
          : isEditMode
            ? '事件已更新'
            : '事件已创建'
      );
      await loadEvents();
    } catch {
      showError(editingEventId ? '网络异常，更新失败' : '网络异常，创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    const ok = window.confirm('确认删除该事件吗？');
    if (!ok) return;

    try {
      const res = await fetch(`/api/events?id=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || '删除失败');
        return;
      }
      showSuccess('事件已删除');
      await loadEvents();
    } catch {
      showError('网络异常，删除失败');
    }
  };

  const handleToggleReminder = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          reminderEnabled: !target.reminder?.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || '更新提醒失败');
        return;
      }
      showSuccess(target.reminder?.enabled ? '提醒已关闭' : '提醒已开启');
      await loadEvents();
    } catch {
      showError('网络异常，提醒更新失败');
    }
  };

  const handleMarkAccuracy = async (eventId: string, wasAccurate: boolean) => {
    const target = events.find((event) => event.id === eventId);
    if (!target) return;

    const notes = window.prompt(
      wasAccurate ? '补充一句这次判断为什么准确（可选）' : '补充一句这次判断哪里不准确（可选）',
      target.userFeedback?.userNotes || ''
    );
    if (notes === null) return;

    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          userFeedback: {
            ...target.userFeedback,
            wasAccurate,
            userNotes: notes.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || '记录验证结果失败');
        return;
      }
      showSuccess(wasAccurate ? '已记录为准确' : '已记录为待修正');
      await loadEvents();
    } catch {
      showError('网络异常，验证结果保存失败');
    }
  };

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="events_page_viewed" page="/events" meta={{ focusedReportId: focusedReportId || null }} />
      <SiteHeader
        ctaHref="/analyze"
        ctaLabel="重新判断"
        ctaAnalytics={{
          page: '/events',
          target: 'events_header_analyze',
          meta: {
            source: pageSource,
            ctaStrategyKey: sourceCtaStrategy.strategyKey,
            sourceFamily: sourceCtaStrategy.sourceFamily,
            focusedReportId: focusedReportId || null,
          },
        }}
      />

      <main className="page-frame py-6 pb-16 space-y-6 md:py-8 md:pb-20">
        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3 w-3" />
              事件中心
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              事件 · 提醒 · 验证
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
              不是日历，是把真实反馈接回报告质量。
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
              快速操作
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={openCreateForm}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
                type="button"
              >
                创建事件
              </button>
              <ResultCtaLink
                href={focusedReportId ? appendSourceToHref(`/result/${encodeURIComponent(focusedReportId)}`, pageSource) : '/analyze'}
                page="/events"
                target={focusedReportId ? 'events_hero_report' : 'events_hero_analyze'}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'events_hero',
                  reportId: focusedReportId || null,
                }}
              >
                {focusedReportId ? '返回关联报告' : '去生成一份报告'}
              </ResultCtaLink>
              <ResultCtaLink
                href={buildChatHref({
                  reportId: focusedReportId || undefined,
                  question: '请结合我事件中心里正在跟踪的这些节点，帮我判断：接下来最值得优先推进或验证的是哪一件事，为什么？',
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                })}
                page="/events"
                target="events_hero_chat"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: pageSource,
                  ctaStrategyKey: sourceCtaStrategy.strategyKey,
                  sourceFamily: sourceCtaStrategy.sourceFamily,
                  surface: 'events_hero',
                  reportId: focusedReportId || null,
                }}
              >
                进入结构追问
              </ResultCtaLink>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--alert)]">
            {error}
          </div>
        )}

        {focusedReportId && (
          <section className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="section-label">报告联动模式</div>
                <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">关联报告事件</div>
              </div>
              <div className="space-y-2">
                <div className="action-guide">快速操作</div>
                <div className="action-strip flex flex-wrap gap-3">
                <ResultCtaLink
                  href={appendSourceToHref(`/result/${encodeURIComponent(focusedReportId)}`, pageSource)}
                  page="/events"
                  target="events_focus_report"
                  className="action-secondary"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    surface: 'events_focus_mode',
                    reportId: focusedReportId,
                  }}
                >
                  返回关联报告
                </ResultCtaLink>
                <ResultCtaLink
                  href="/events"
                  page="/events"
                  target="events_focus_all_events"
                  className="action-secondary"
                  meta={{
                    source: pageSource,
                    ctaStrategyKey: sourceCtaStrategy.strategyKey,
                    sourceFamily: sourceCtaStrategy.sourceFamily,
                    surface: 'events_focus_mode',
                    reportId: focusedReportId,
                  }}
                >
                  查看全部事件
                </ResultCtaLink>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading && (
          <RetentionResumePanel
            page="/events"
            source={pageSource}
            ctaStrategyKey={sourceCtaStrategy.strategyKey}
            sourceFamily={sourceCtaStrategy.sourceFamily}
            title={topDriftEvent ? '先纠偏最关键的一条事件样本' : topOverdueEvent ? '先补回最该确认结果的事件' : '围绕下一条事件继续推进'}
            description={topDriftEvent
              ? '事件页最有价值的动作不是继续浏览，而是直接恢复到最关键的偏差样本，判断问题出在时机、执行、环境还是输入。'
              : topOverdueEvent
                ? '先回收已经过期但还没确认结果的事件反馈，把“准 / 偏”状态补回来，才能让后续报告越来越准。'
                : '如果当前没有明显待修样本，就围绕最近将发生的节点继续追问，让事件工作台真正变成持续使用入口。'}
            stats={[
              { label: '已过期待验证', value: validationWorkbench.overduePending.length, helper: '最该先回收结果的事件' },
              { label: '偏差样本', value: validationWorkbench.driftEvents.length, helper: '已确认要纠偏的事件' },
              { label: '未来待验证', value: validationWorkbench.upcomingValidation.length, helper: '即将进入验证期的节点' },
            ]}
            actions={[
              {
                href: eventsResumeChatHref,
                label: topDriftEvent ? '恢复纠偏分析' : '恢复事件追问',
                target: topDriftEvent ? 'retention_resume_drift_chat' : 'retention_resume_events_chat',
                meta: {
                  reportId: topDriftEvent?.fortuneAnalysis?.reportId || topOverdueEvent?.fortuneAnalysis?.reportId || focusedReportId || null,
                  eventId: topDriftEvent?.id || topOverdueEvent?.id || null,
                  driftCount: validationWorkbench.driftEvents.length,
                  overduePendingCount: validationWorkbench.overduePending.length,
                },
              },
              {
                href: topOverdueEvent
                  ? appendSourceToHref(`/events${topOverdueEvent.fortuneAnalysis?.reportId ? `?reportId=${encodeURIComponent(topOverdueEvent.fortuneAnalysis.reportId)}` : ''}`, pageSource)
                  : appendSourceToHref('/events', pageSource),
                label: topOverdueEvent ? '补回验证结果' : '查看全部事件',
                target: 'retention_resume_events_queue',
                meta: { overduePendingCount: validationWorkbench.overduePending.length },
              },
              {
                href: topUpcomingEvent?.fortuneAnalysis?.reportId
                  ? appendSourceToHref(`/result/${encodeURIComponent(topUpcomingEvent.fortuneAnalysis.reportId)}`, pageSource)
                  : focusedReportId
                    ? appendSourceToHref(`/result/${encodeURIComponent(focusedReportId)}`, pageSource)
                    : '/analyze',
                label: topUpcomingEvent?.fortuneAnalysis?.reportId || focusedReportId ? '回到关联报告' : '去生成一份报告',
                target: topUpcomingEvent?.fortuneAnalysis?.reportId || focusedReportId ? 'retention_resume_report' : 'retention_resume_analyze',
                meta: { reportId: topUpcomingEvent?.fortuneAnalysis?.reportId || focusedReportId || null },
              },
            ]}
          />
        )}

        {!loading && (
          <section id="validation-workbench" className="glass-panel scroll-mt-28 rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-label">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  验证工作台
                </div>
                <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)] md:text-3xl">
                  验证与纠偏
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <WorkbenchStat label="已过期待验证" value={validationWorkbench.overduePending.length} tone="bg-[color:var(--alert-soft)] text-[color:var(--alert)]" />
                <WorkbenchStat label="已记录偏差" value={validationWorkbench.driftEvents.length} tone="bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]" />
                <WorkbenchStat label="未来待验证" value={validationWorkbench.upcomingValidation.length} tone="bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]" />
                <WorkbenchStat label="已验证准确" value={validationWorkbench.accurateCount} tone="bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              <WorkbenchPanel
                icon={<Clock3 className="h-4 w-4" />}
                title="优先回收结果"
                empty="当前没有已过期待验证的事件。"
                items={validationWorkbench.overduePending.slice(0, 4).map((event) => (
                  <WorkbenchQueueItem
                    key={event.id}
                    event={event}
                    reason="事件日期已过，现在最重要的是回收用户反馈，判断这次预测到底准不准。"
                    actionSlot={
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleMarkAccuracy(event.id, true)}
                          className="rounded-full bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]"
                        >
                          记为准确
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMarkAccuracy(event.id, false)}
                          className="rounded-full bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]"
                        >
                          记录偏差
                        </button>
                      </div>
                    }
                  />
                ))}
              />

              <WorkbenchPanel
                icon={<AlertTriangle className="h-4 w-4" />}
                title="偏差纠偏队列"
                empty="当前没有已标记偏差的事件。"
                items={validationWorkbench.driftEvents.slice(0, 4).map((event) => (
                  <WorkbenchQueueItem
                    key={event.id}
                    event={event}
                    reason={event.userFeedback?.userNotes || event.fortuneAnalysis?.reason || '当前最适合回到聊天页，拆开时机、执行和输入偏差。'}
                    actionSlot={
                      <div className="flex flex-wrap gap-2">
                        {event.fortuneAnalysis?.reportId ? (
                          <ResultCtaLink
                            href={buildChatHref({
                              reportId: event.fortuneAnalysis.reportId,
                              eventId: event.id,
                              question: '请围绕这条已经出现偏差的事件做纠偏分析：这次偏差更像时机问题、执行问题、环境问题，还是输入判断失真？',
                              source: 'events_drift_queue',
                              ctaStrategyKey: sourceCtaStrategy.strategyKey,
                              sourceFamily: sourceCtaStrategy.sourceFamily,
                            })}
                            page="/events"
                            target="events_drift_queue_chat"
                            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)]"
                            meta={{
                              source: 'events_drift_queue',
                              ctaStrategyKey: sourceCtaStrategy.strategyKey,
                              sourceFamily: sourceCtaStrategy.sourceFamily,
                              surface: 'events_drift_queue',
                              eventId: event.id,
                              reportId: event.fortuneAnalysis.reportId,
                            }}
                          >
                            进入纠偏分析
                            <ArrowRight className="h-3.5 w-3.5" />
                          </ResultCtaLink>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleMarkAccuracy(event.id, false)}
                          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]"
                        >
                          补充备注
                        </button>
                      </div>
                    }
                  />
                ))}
              />

              <WorkbenchPanel
                icon={<Calendar className="h-4 w-4" />}
                title="即将进入验证期"
                empty="当前没有即将到来的待验证事件。"
                items={validationWorkbench.upcomingValidation.map((event) => (
                  <WorkbenchQueueItem
                    key={event.id}
                    event={event}
                    reason={event.fortuneAnalysis?.reason || '事件即将发生，建议提前看一次报告或聊天，明确这次要验证的是什么。'}
                    actionSlot={
                      <div className="flex flex-wrap gap-2">
                        {event.fortuneAnalysis?.reportId ? (
                          <ResultCtaLink
                            href={appendSourceToHref(`/result/${encodeURIComponent(event.fortuneAnalysis.reportId)}`, pageSource)}
                            page="/events"
                            target="events_upcoming_report"
                            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]"
                            meta={{
                              source: pageSource,
                              ctaStrategyKey: sourceCtaStrategy.strategyKey,
                              sourceFamily: sourceCtaStrategy.sourceFamily,
                              surface: 'events_upcoming_queue',
                              eventId: event.id,
                              reportId: event.fortuneAnalysis.reportId,
                            }}
                          >
                            查看关联报告
                          </ResultCtaLink>
                        ) : null}
                        <button
                          type="button"
                          onClick={openCreateForm}
                          className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                        >
                          新增配套事件
                        </button>
                      </div>
                    }
                  />
                ))}
              />
            </div>
          </section>
        )}

        {/* 工具栏 */}
        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-[color:var(--ink)]">
              {view === 'calendar' ? '事件日历' : '事件列表'}
            </h2>
            <div className="product-chip">
              <span className="text-sm text-[color:var(--muted)]">{filteredEvents.length} 个事件</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="action-strip flex p-1">
              <button
                onClick={() => setView('calendar')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${view === 'calendar' ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'text-[color:var(--muted)] hover:bg-white'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  日历
                </span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${view === 'list' ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'text-[color:var(--muted)] hover:bg-white'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  列表
                </span>
              </button>
            </div>

            <button
              onClick={openCreateForm}
              className="action-primary"
            >
              <Plus className="w-4 h-4" />
              <span>添加事件</span>
            </button>
          </div>
        </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="soft-card flex flex-col gap-4 rounded-[1.75rem] p-4 md:flex-row md:items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-[color:var(--muted)]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | EventType)}
              className="smooth-input rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm text-[color:var(--ink)]"
            >
              <option value="all">全部类型</option>
              <option value="career">事业</option>
              <option value="wealth">财富</option>
              <option value="marriage">感情</option>
              <option value="health">健康</option>
              <option value="family">家庭</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--ink-5)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索事件标题或描述..."
              className="w-full rounded-full border border-[color:var(--line)] bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>

        {loading ? (
          <EventsSkeleton />
        ) : view === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-[color:var(--hairline-strong)] overflow-hidden">
              <EventCalendar events={filteredEvents} />
            </div>
            <div className="lg:col-span-2">
              <ImportantEvents
                events={filteredEvents}
                onAdd={openCreateForm}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onToggleReminder={handleToggleReminder}
                onMarkAccuracy={handleMarkAccuracy}
                source={pageSource}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
            </div>
          </div>
        ) : (
          <ImportantEvents
            events={filteredEvents}
            onAdd={openCreateForm}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onToggleReminder={handleToggleReminder}
            onMarkAccuracy={handleMarkAccuracy}
            source={pageSource}
            ctaStrategyKey={sourceCtaStrategy.strategyKey}
            sourceFamily={sourceCtaStrategy.sourceFamily}
          />
        )}
      </main>

      <SiteFooter />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,18,14,0.45)] p-4 backdrop-blur-sm" onClick={closeForm}>
          <div
            className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:p-6">
              <div className="md:col-span-2 flex items-center justify-between border-b border-white/60 pb-3">
                <div>
                  <h3 className="text-xl font-black text-[color:var(--ink)]">
                  {editingEventId ? '编辑事件' : '添加事件'}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">把报告中的关键窗口期或现实中的重要节点存下来。</p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="action-secondary py-2 text-[color:var(--muted)]"
                >
                  取消
                </button>
              </div>

              {editingEventId && (() => {
                const editingEvent = events.find((event) => event.id === editingEventId);
                if (!editingEvent?.isEstimatedPastEvent) {
                  return null;
                }

                return (
                  <div className="md:col-span-2 rounded-[1.25rem] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-4 py-4 text-sm text-[color:var(--signal-strong)]">
                    <div className="font-semibold">这条历史印证还在使用暂估日期</div>
                    <div className="mt-1 leading-6">{getEstimatedPastEventPrompt(editingEvent)}</div>
                  </div>
                );
              })()}

              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="事件标题"
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as EventType }))}
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              >
                <option value="career">事业</option>
                <option value="wealth">财富</option>
                <option value="marriage">感情</option>
                <option value="health">健康</option>
                <option value="family">家庭</option>
                <option value="other">其他</option>
              </select>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <select
                value={form.impact}
                onChange={(e) => setForm((prev) => ({ ...prev, impact: e.target.value as ImpactType }))}
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              >
                <option value="positive">积极</option>
                <option value="neutral">中性</option>
                <option value="negative">消极</option>
              </select>
              <input
                type="number"
                min={0}
                value={form.reminderAdvanceDays}
                onChange={(e) => setForm((prev) => ({ ...prev, reminderAdvanceDays: Number(e.target.value) || 0 }))}
                placeholder="提前天数"
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                disabled={!form.reminderEnabled}
              />
              <select
                value={form.reminderMethod}
                onChange={(e) => setForm((prev) => ({ ...prev, reminderMethod: e.target.value as 'app' | 'email' | 'sms' }))}
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                disabled={!form.reminderEnabled}
              >
                <option value="app">应用通知</option>
                <option value="email">邮件通知</option>
                <option value="sms">短信通知</option>
              </select>

              <label className="md:col-span-2 flex items-center gap-3 rounded-[1.25rem] bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={form.reminderEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-[color:var(--hairline-strong)] text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
                />
                保存并启用提醒
              </label>

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="事件说明"
                className="md:col-span-2 min-h-[130px] w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <div className="md:col-span-2 flex justify-end border-t border-white/60 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? '提交中...' : editingEventId ? '保存修改' : '保存事件'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed right-4 top-20 z-[60] rounded-full px-4 py-3 text-sm font-medium shadow-[0_16px_34px_rgba(23,32,51,0.12)] ${
            toast.type === 'success'
              ? 'bg-[rgba(47,125,82,0.08)] border border-[rgba(47,125,82,0.20)] text-[color:var(--data-up)]'
              : 'bg-[color:var(--alert-soft)] border border-[color:var(--alert)] text-[color:var(--alert)]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function EventsPageFallback() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />
      <main className="page-frame py-6 pb-16 space-y-6 md:py-8 md:pb-20">
        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3 w-3" />
              事件中心
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              事件 · 提醒 · 验证
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
              不是日历，是把真实反馈接回报告质量。
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
            <EventsSkeleton />
          </div>
        </section>
        <EventsSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-64 bg-[color:var(--hairline-strong)] rounded-lg animate-pulse"></div>
      <div className="h-64 bg-[color:var(--hairline-strong)] rounded-lg animate-pulse"></div>
      <div className="h-64 bg-[color:var(--hairline-strong)] rounded-lg animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-[color:var(--hairline-strong)] rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}

function WorkbenchStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[1.4rem] px-4 py-4 ${tone}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function WorkbenchPanel({
  icon,
  title,
  items,
  empty,
}: {
  icon: ReactNode;
  title: string;
  items: ReactNode[];
  empty: string;
}) {
  return (
    <div className="rounded-[1.75rem] bg-[color:var(--bg-elevated)] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {icon}
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.length > 0 ? items : (
          <div className="rounded-[1.25rem] bg-white px-4 py-4 text-sm text-[color:var(--muted)]">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkbenchQueueItem({
  event,
  reason,
  actionSlot,
}: {
  event: UIEvent;
  reason: string;
  actionSlot: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">
            {formatQueueDate(event.dateKey)} · {mapTypeLabel(event.type)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-[color:var(--muted)]">{reason}</div>
      <div className="mt-3">{actionSlot}</div>
    </div>
  );
}

function formatQueueDate(dateKey: string) {
  return formatEventQueueDateKey(dateKey);
}

function mapTypeLabel(type: EventType) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '感情';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}
