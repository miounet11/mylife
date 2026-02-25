// 事件页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Plus, Filter, Search, Calendar, Grid } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  reminder: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
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
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<UIEvent[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | EventType>('all');
  const [keyword, setKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  const loadEvents = async () => {
    try {
      setError('');
      const res = await fetch('/api/events', { cache: 'no-store' });
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
            enabled: !!item.reminder_enabled,
            advanceDays: item.reminder_advance_days || 0,
            method: (item.reminder_method || 'app') as 'app' | 'email' | 'sms',
          },
        };
      });

      setEvents(mapped);
    } catch {
      showError('网络异常，无法加载事件');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadEvents();
      setLoading(false);
    };

    init();
  }, []);

  const filteredEvents = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    return events.filter((event) => {
      const typeMatched = selectedType === 'all' ? true : event.type === selectedType;
      const searchMatched = keywordLower
        ? event.title.toLowerCase().includes(keywordLower) || event.description.toLowerCase().includes(keywordLower)
        : true;
      return typeMatched && searchMatched;
    });
  }, [events, keyword, selectedType]);

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
          reminderEnabled: !target.reminder.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || '更新提醒失败');
        return;
      }
      showSuccess(target.reminder.enabled ? '提醒已关闭' : '提醒已开启');
      await loadEvents();
    } catch {
      showError('网络异常，提醒更新失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo和标题 */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-indigo-700 flex items-center justify-center text-white font-bold font-serif">
                K
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                人生K线
              </div>
            </Link>

            {/* 标题 */}
            <h1 className="hidden md:block text-xl font-bold text-slate-900 font-serif">
              命理事件
            </h1>

            {/* 返回按钮 */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">返回首页</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900">
              {view === 'calendar' ? '事件日历' : '事件列表'}
            </h2>
            <div className="flex items-center border border-slate-200 rounded px-3 py-1">
              <span className="text-sm text-slate-600">{filteredEvents.length}个事件</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-md transition ${view === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={openCreateForm}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">添加事件</span>
            </button>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | EventType)}
              className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索事件标题或描述..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
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
          />
        )}
      </main>

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 p-4 flex items-center justify-center"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitForm} className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEventId ? '编辑事件' : '添加事件'}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  取消
                </button>
              </div>

              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="事件标题"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as EventType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <select
                value={form.impact}
                onChange={(e) => setForm((prev) => ({ ...prev, impact: e.target.value as ImpactType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                disabled={!form.reminderEnabled}
              />
              <select
                value={form.reminderMethod}
                onChange={(e) => setForm((prev) => ({ ...prev, reminderMethod: e.target.value as 'app' | 'email' | 'sms' }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                disabled={!form.reminderEnabled}
              >
                <option value="app">应用通知</option>
                <option value="email">邮件通知</option>
                <option value="sms">短信通知</option>
              </select>

              <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.reminderEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                保存并启用提醒
              </label>

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="事件说明"
                className="md:col-span-2 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 min-h-[110px]"
              />
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60"
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
          className={`fixed right-4 top-20 z-[60] px-4 py-3 rounded border text-sm font-medium ${
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
