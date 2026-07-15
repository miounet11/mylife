'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EventCalendar from '@/components/event-calendar';
import {
  toEventViewModel,
  type EventViewModel,
  type EventViewType,
  type EventViewImpact,
} from '@/lib/event-view';
import { trackProductEvent } from '@/lib/product-analytics';

const TYPES: Array<{ key: EventViewType | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财富' },
  { key: 'marriage', label: '关系' },
  { key: 'health', label: '健康' },
  { key: 'family', label: '家庭' },
  { key: 'other', label: '其他' },
];

const LOCAL_KEY = 'lk_events_cache_v1';

type Transport = Record<string, unknown>;

export default function EventsHub({ reportId }: { reportId?: string }) {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [filter, setFilter] = useState<EventViewType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'career' as EventViewType,
    impact: 'neutral' as EventViewImpact,
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (reportId) qs.set('reportId', reportId);
      const res = await fetch(`/api/events?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = (data.data?.events || data.events || []) as Transport[];
        const views = list.map((e) => toEventViewModel(e));
        setEvents(views);
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
      } else {
        // fallback local
        const local = readLocal();
        setEvents(local.map((e) => toEventViewModel(e)));
        if (!local.length) setError(data.error || '暂无法从服务器拉取事件（可先本地记录）');
      }
    } catch {
      const local = readLocal();
      setEvents(local.map((e) => toEventViewModel(e)));
      if (!local.length) setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
    trackProductEvent('events_page_viewed', { reportId: reportId || '' });
  }, [load, reportId]);

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
    [events, filter]
  );

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    setError('');
    const payload = {
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      description: form.description.trim(),
      impact: form.impact,
      reminderEnabled: true,
      reminderAdvanceDays: 7,
      reminderMethod: 'app',
      source: 'events_hub',
      fortuneAnalysis: reportId ? { reportId, source: 'events_hub' } : {},
    };
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // local fallback
        const localItem = {
          id: `local_${Date.now()}`,
          ...payload,
          impact: form.impact,
        };
        const next = [localItem, ...readLocal()];
        writeLocal(next);
        setEvents(next.map((x) => toEventViewModel(x)));
        trackProductEvent('events_created', {
          reportId: reportId || '',
          type: form.type,
          transport: 'local',
        });
        setError(data.error || '已保存到本地缓存（服务器写入失败时）');
      } else {
        setForm((f) => ({ ...f, title: '', description: '' }));
        trackProductEvent('events_created', {
          reportId: reportId || '',
          type: form.type,
          transport: 'server',
        });
        await load();
      }
    } catch {
      const localItem = {
        id: `local_${Date.now()}`,
        ...payload,
      };
      const next = [localItem, ...readLocal()];
      writeLocal(next);
      setEvents(next.map((x) => toEventViewModel(x)));
      trackProductEvent('events_created', {
        reportId: reportId || '',
        type: form.type,
        transport: 'local',
      });
      setError('网络异常，已写入本地缓存');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              filter === t.key
                ? 'bg-[#0f172a] text-white'
                : 'bg-white text-[#64748b] ring-1 ring-[#e2e8f0]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link href="/profile/events" className="ml-auto text-[12px] font-semibold text-[#6d28d9] hover:underline">
          人生事件档案 →
        </Link>
        <Link href="/predictions" className="text-[12px] font-semibold text-[#6d28d9] hover:underline">
          预测回访 →
        </Link>
      </div>

      {error ? (
        <p className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[12px] text-[#92400e]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={createEvent} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-[#0f172a]">记录新事件</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">写入后用于校准报告与回访（与报告避险「记入事件」同源 API）</p>
          <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
            标题
            <input
              required
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如：跳槽入职 / 搬家签约"
            />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block text-[11px] font-semibold text-[#64748b]">
              日期
              <input
                type="date"
                className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label className="block text-[11px] font-semibold text-[#64748b]">
              类型
              <select
                className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventViewType })}
              >
                {TYPES.filter((t) => t.key !== 'all').map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
            影响
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value as EventViewImpact })}
            >
              <option value="positive">偏正面</option>
              <option value="neutral">中性</option>
              <option value="negative">偏压力</option>
            </select>
          </label>
          <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
            说明
            <textarea
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="可选：经过、结果、是否与报告预测对照"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 inline-flex h-10 items-center rounded-[8px] bg-[#6d28d9] px-4 text-[13px] font-semibold text-white hover:bg-[#5b21b6] disabled:opacity-60"
          >
            {saving ? '保存中…' : '保存事件'}
          </button>
        </form>

        <div className="min-h-[320px]">
          {loading ? (
            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-8 text-center text-[13px] text-[#94a3b8]">
              加载事件…
            </div>
          ) : (
            <EventCalendar events={filtered} />
          )}
        </div>
      </div>

      <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">事件列表（{filtered.length}）</h2>
        {filtered.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">还没有事件。从报告避险一键记入，或在上方新建。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {filtered
              .slice()
              .sort((x, y) => y.dateKey.localeCompare(x.dateKey))
              .map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-[8px] border border-[#f1f5f9] px-3 py-2"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-[#0f172a]">{ev.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#64748b]">
                      {ev.dateKey} · {ev.type} · {ev.impact}
                    </div>
                    {ev.description ? (
                      <p className="mt-1 text-[11px] text-[#475569]">{ev.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {ev.fortuneAnalysis?.reportId ? (
                      <Link
                        href={`/result/${ev.fortuneAnalysis.reportId}`}
                        className="text-[11px] font-semibold text-[#6d28d9] hover:underline"
                      >
                        关联报告
                      </Link>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      <FeedbackBtn
                        label="应验"
                        active={ev.userFeedback?.wasAccurate === true}
                        onClick={() => void setFeedback(ev.id, true, '应验')}
                        tone="good"
                      />
                      <FeedbackBtn
                        label="部分"
                        active={
                          ev.userFeedback?.wasAccurate == null &&
                          /部分/.test(ev.userFeedback?.userNotes || '')
                        }
                        onClick={() => void setFeedback(ev.id, null, '部分应验')}
                        tone="mid"
                      />
                      <FeedbackBtn
                        label="未应验"
                        active={ev.userFeedback?.wasAccurate === false}
                        onClick={() => void setFeedback(ev.id, false, '未应验')}
                        tone="bad"
                      />
                    </div>
                    {ev.userFeedback?.userNotes || ev.userFeedback?.wasAccurate != null ? (
                      <span className="text-[10px] text-[#94a3b8]">
                        已记
                        {ev.userFeedback?.wasAccurate === true
                          ? '应验'
                          : ev.userFeedback?.wasAccurate === false
                            ? '未应验'
                            : ev.userFeedback?.userNotes || '反馈'}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );

  async function setFeedback(id: string, wasAccurate: boolean | null, notes?: string) {
    const feedback = {
      wasAccurate: wasAccurate === null ? undefined : wasAccurate,
      userNotes: notes || '',
      answeredAt: new Date().toISOString(),
    };

    // optimistic UI
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, userFeedback: feedback } : ev))
    );

    // always mirror to local cache (server may be unavailable or local-only id)
    const baseLocal = readLocal();
    const inLocal = baseLocal.some((item) => item.id === id);
    const nextLocal = inLocal
      ? baseLocal.map((item) => (item.id === id ? { ...item, userFeedback: feedback } : item))
      : [
          {
            id,
            type: 'other',
            title: events.find((e) => e.id === id)?.title || '事件',
            date: events.find((e) => e.id === id)?.dateKey || new Date().toISOString().slice(0, 10),
            impact: events.find((e) => e.id === id)?.impact || 'neutral',
            description: events.find((e) => e.id === id)?.description || '',
            userFeedback: feedback,
          },
          ...baseLocal,
        ];
    writeLocal(nextLocal);

    trackProductEvent('events_feedback', {
      id,
      wasAccurate: wasAccurate === null ? 'partial' : wasAccurate ? 'true' : 'false',
    });

    if (String(id).startsWith('local_')) {
      // pure local events: no server round-trip
      return;
    }

    const body = JSON.stringify({ id, userFeedback: feedback });
    const attempts: Array<{ url: string; method: string; body?: string }> = [
      { url: '/api/events', method: 'PATCH', body },
      { url: `/api/events/${encodeURIComponent(id)}`, method: 'PATCH', body: JSON.stringify({ userFeedback: feedback }) },
      {
        url: '/api/events',
        method: 'PUT',
        body: JSON.stringify({ id, userFeedback: feedback }),
      },
    ];

    let serverOk = false;
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: { 'Content-Type': 'application/json' },
          body: attempt.body,
        });
        if (res.ok) {
          serverOk = true;
          break;
        }
      } catch {
        // try next transport
      }
    }

    if (!serverOk) {
      setError((prev) =>
        prev && !prev.includes('本地')
          ? prev
          : '应验反馈已写入本机缓存；登录且服务器可用时会优先同步服务端。'
      );
    }
  }
}

function FeedbackBtn({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  tone: 'good' | 'mid' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? active
        ? 'bg-[#047857] text-white'
        : 'bg-[#ecfdf5] text-[#047857]'
      : tone === 'bad'
        ? active
          ? 'bg-[#b91c1c] text-white'
          : 'bg-[#fef2f2] text-[#b91c1c]'
        : active
          ? 'bg-[#b45309] text-white'
          : 'bg-[#fffbeb] text-[#b45309]';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClass}`}
    >
      {label}
    </button>
  );
}

function readLocal(): Transport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: Transport[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
