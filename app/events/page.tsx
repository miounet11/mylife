// 事件页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock3, Filter, Grid, Plus, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

// 动态导入
const EventCalendar = dynamic(() => import('@/components/event-calendar'), {
  loading: () => <CalendarSkeleton />,
});

const ImportantEvents = dynamic(() => import('@/components/important-events'), {
  loading: () => <EventsSkeleton />,
});

type EventType = 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
type ImpactType = 'positive' | 'negative' | 'neutral';

interface UIEvent {
  id: string;
  type: EventType;
  title: string;
  date: Date;
  time?: string;
  description: string;
  impact: ImpactType;
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
  fortuneAnalysis?: {
    source?: string;
    reportId?: string;
    suggestionKey?: string;
    reason?: string;
    title?: string;
  };
  followUpAdvice?: {
    shortTerm?: string;
    longTerm?: string;
  };
  userFeedback?: {
    wasAccurate?: boolean;
    userNotes?: string;
  };
}

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

const EVENT_TYPES: EventType[] = ['career', 'wealth', 'marriage', 'health', 'family', 'other'];

const parseEventDate = (date: string, time?: string) => {
  const dateTime = `${date}${time ? `T${time}` : 'T00:00:00'}`;
  const parsed = new Date(dateTime);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateForInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const createDefaultForm = (): EventFormState => ({
  type: 'career',
  title: '',
  date: formatDateForInput(new Date()),
  time: '09:00',
  description: '',
  impact: 'neutral',
  reminderEnabled: true,
  reminderAdvanceDays: 7,
  reminderMethod: 'app',
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

  const loadEvents = useCallback(async () => {
    try {
      setError('');
      const query = focusedReportId ? `?reportId=${encodeURIComponent(focusedReportId)}` : '';
      const res = await fetch(`/api/events${query}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || '加载事件失败');
        return;
      }

      const mapped: UIEvent[] = (data.data?.events || []).map((item: any) => {
        const eventType = EVENT_TYPES.includes(item.type) ? item.type : 'other';
        const impact: ImpactType = ['positive', 'negative', 'neutral'].includes(item.impact)
          ? item.impact
          : 'neutral';

        return {
          id: item.id,
          type: eventType,
          title: item.title,
          date: parseEventDate(item.date, item.time),
          time: item.time || undefined,
          description: item.description || '',
          impact,
          reminder: {
            enabled: !!(item.reminderEnabled ?? item.reminder_enabled),
            advanceDays: item.reminderAdvanceDays ?? item.reminder_advance_days ?? 0,
            method: (item.reminderMethod || item.reminder_method || 'app') as 'app' | 'email' | 'sms',
          },
          fortuneAnalysis: item.fortuneAnalysis || undefined,
          followUpAdvice: item.followUpAdvice || undefined,
          userFeedback: item.userFeedback || undefined,
        };
      });

      setEvents(mapped);
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
    const now = new Date();
    const overduePending = workbenchEvents
      .filter((event) => event.userFeedback?.wasAccurate === undefined && event.date.getTime() < now.getTime())
      .sort((left, right) => left.date.getTime() - right.date.getTime());
    const driftEvents = workbenchEvents
      .filter((event) => event.userFeedback?.wasAccurate === false)
      .sort((left, right) => right.date.getTime() - left.date.getTime());
    const upcomingValidation = workbenchEvents
      .filter((event) => event.userFeedback?.wasAccurate === undefined && event.date.getTime() >= now.getTime())
      .sort((left, right) => left.date.getTime() - right.date.getTime())
      .slice(0, 4);

    return {
      overduePending,
      driftEvents,
      upcomingValidation,
      accurateCount: workbenchEvents.filter((event) => event.userFeedback?.wasAccurate === true).length,
      pendingCount: workbenchEvents.filter((event) => event.userFeedback?.wasAccurate === undefined).length,
    };
  }, [workbenchEvents]);

  const openCreateForm = () => {
    setEditingEventId(null);
    setForm(createDefaultForm());
    setError('');
    setShowForm(true);
  };

  const openEditForm = (event: UIEvent) => {
    setEditingEventId(event.id);
    setForm({
      type: event.type,
      title: event.title,
      date: formatDateForInput(event.date),
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

      closeForm();
      showSuccess(isEditMode ? '事件已更新' : '事件已创建');
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
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-8 pb-16 space-y-6 md:py-12 md:pb-20">
        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              结果后的复访场景
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              一页管理关键节点，
              <span className="font-serif text-[color:var(--accent-strong)]">减少错过窗口。</span>
            </h1>
            <p className="intro-copy">把关键事件、提醒和验证放在同一处，复盘会更快。</p>
            <div className="intro-panel">先创建事件，再回到报告或追问页做验证闭环。</div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="action-guide">快速操作</div>
            <div className="action-strip mt-3 flex flex-wrap gap-3">
              <button onClick={openCreateForm} className="action-primary action-main" type="button">
                创建事件
              </button>
              <Link href={focusedReportId ? `/result/${encodeURIComponent(focusedReportId)}` : '/analyze'} className="action-secondary">
                {focusedReportId ? '返回关联报告' : '去生成一份报告'}
              </Link>
              <Link href={focusedReportId ? `/chat?reportId=${encodeURIComponent(focusedReportId)}` : '/chat'} className="action-secondary">
                进入结构追问
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {focusedReportId && (
          <section className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="section-label">报告联动模式</div>
                <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">当前正在处理这份报告关联的事件与验证结果</div>
                <div className="intro-copy mt-2">新建事件会自动绑定当前报告，便于后续验证。</div>
              </div>
              <div className="space-y-2">
                <div className="action-guide">快速操作</div>
                <div className="action-strip flex flex-wrap gap-3">
                <Link
                  href={`/result/${encodeURIComponent(focusedReportId)}`}
                  className="action-secondary"
                >
                  返回关联报告
                </Link>
                <Link
                  href="/events"
                  className="action-secondary"
                >
                  查看全部事件
                </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading && (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-label">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  验证工作台
                </div>
                <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)] md:text-3xl">
                  先验证，再纠偏，再追问。
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <WorkbenchStat label="已过期待验证" value={validationWorkbench.overduePending.length} tone="bg-rose-50 text-rose-700" />
                <WorkbenchStat label="已记录偏差" value={validationWorkbench.driftEvents.length} tone="bg-amber-50 text-amber-700" />
                <WorkbenchStat label="未来待验证" value={validationWorkbench.upcomingValidation.length} tone="bg-slate-50 text-slate-700" />
                <WorkbenchStat label="已验证准确" value={validationWorkbench.accurateCount} tone="bg-emerald-50 text-emerald-700" />
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
                          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          记为准确
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMarkAccuracy(event.id, false)}
                          className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
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
                          <Link
                            href={`/chat?reportId=${encodeURIComponent(event.fortuneAnalysis.reportId)}&eventId=${encodeURIComponent(event.id)}`}
                            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)]"
                          >
                            进入纠偏分析
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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
                          <Link
                            href={`/result/${encodeURIComponent(event.fortuneAnalysis.reportId)}`}
                            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]"
                          >
                            查看关联报告
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={openCreateForm}
                          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
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
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
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
          />
        )}
      </main>

      <SiteFooter />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm" onClick={closeForm}>
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
                  className="h-4 w-4 rounded border-slate-300 text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
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
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
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
      <main className="page-frame py-8 pb-16 space-y-6 md:py-12 md:pb-20">
        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              结果后的复访场景
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              一页管理关键节点，
              <span className="font-serif text-[color:var(--accent-strong)]">减少错过窗口。</span>
            </h1>
          </div>
          <div className="glass-panel rounded-[2rem] p-6">
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
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
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
    <div className="rounded-[1.75rem] bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {icon}
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.length > 0 ? items : (
          <div className="rounded-[1.25rem] bg-white px-4 py-4 intro-copy">
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
            {formatQueueDate(event.date)} · {mapTypeLabel(event.type)}
          </div>
        </div>
      </div>
      <div className="intro-copy mt-2">{reason}</div>
      <div className="mt-3">{actionSlot}</div>
    </div>
  );
}

function formatQueueDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
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
