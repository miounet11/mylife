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
import { buildChatHref, buildReportContinueChatHref } from '@/lib/chat-entry';
import { buildTeacherChatHref } from '@/lib/teachers';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import {
  eventsHubCopy,
  isPartialFeedbackNotes,
  type EventFilterKey,
} from '@/lib/i18n/events-copy';
import { toIllustLocale } from '@/lib/page-illustrations/locale';

const FILTER_KEYS: EventFilterKey[] = [
  'all',
  'career',
  'wealth',
  'marriage',
  'health',
  'family',
  'other',
];

const LOCAL_KEY = 'lk_events_cache_v1';

type Transport = Record<string, unknown>;

export default function EventsHub({
  reportId,
  locale = 'zh-CN',
}: {
  reportId?: string;
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => eventsHubCopy(locale), [locale]);
  const illustLocale = toIllustLocale(locale);
  const typeOptions = useMemo(
    () => FILTER_KEYS.map((key) => ({ key, label: copy.types[key] })),
    [copy.types],
  );

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
        if (!local.length) setError(data.error || copy.loadServerFailed);
      }
    } catch {
      const local = readLocal();
      setEvents(local.map((e) => toEventViewModel(e)));
      if (!local.length) setError(copy.networkRetry);
    } finally {
      setLoading(false);
    }
  }, [reportId, copy.loadServerFailed, copy.networkRetry]);

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
        setError(data.error || copy.savedLocalOnServerFail);
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
      setError(copy.networkSavedLocal);
    } finally {
      setSaving(false);
    }
  }

  const hubOpeningHref = reportId
    ? buildReportContinueChatHref({
        reportId,
        teacher: 'practice',
        source: 'events_hub_opening',
        window: copy.hubWindowLabel,
      })
    : buildTeacherChatHref({
        teacherId: 'practice',
        source: 'events_hub_opening_no_report',
      });

  return (
    <div className="space-y-4">
      <PageIllustrationStrip
        surface="events/validation"
        title={copy.stripTitle}
        compact
        limit={1}
        locale={illustLocale}
      />

      {/* Linear-clean：事件 → 顾问开场 */}
      <section className="border-y border-[color:var(--hairline)] py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
              {copy.consultantEyebrow}
            </div>
            <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
              {reportId ? copy.consultantTitleWithReport : copy.consultantTitleWithoutReport}
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              {copy.consultantDesc}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <Link
              href={hubOpeningHref}
              className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {reportId ? copy.openWithReport : copy.practiceTeacher}
            </Link>
            <Link
              href="/teachers?intent=practice"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {copy.allTeachers}
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {typeOptions.map((t) => (
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
          {copy.linkProfileEvents}
        </Link>
        <Link href="/predictions" className="text-[12px] font-semibold text-[#6d28d9] hover:underline">
          {copy.linkPredictions}
        </Link>
      </div>

      {error ? (
        <p className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[12px] text-[#92400e]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={createEvent} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-[#0f172a]">{copy.formTitle}</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">{copy.formHint}</p>
          <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
            {copy.labelTitle}
            <input
              required
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={copy.titlePlaceholder}
            />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block text-[11px] font-semibold text-[#64748b]">
              {copy.labelDate}
              <input
                type="date"
                className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label className="block text-[11px] font-semibold text-[#64748b]">
              {copy.labelType}
              <select
                className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventViewType })}
              >
                {typeOptions
                  .filter((t) => t.key !== 'all')
                  .map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
            {copy.labelImpact}
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value as EventViewImpact })}
            >
              <option value="positive">{copy.impacts.positive}</option>
              <option value="neutral">{copy.impacts.neutral}</option>
              <option value="negative">{copy.impacts.negative}</option>
            </select>
          </label>
          <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
            {copy.labelDescription}
            <textarea
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={copy.descriptionPlaceholder}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 inline-flex h-10 items-center rounded-[8px] bg-[#6d28d9] px-4 text-[13px] font-semibold text-white hover:bg-[#5b21b6] disabled:opacity-60"
          >
            {saving ? copy.saving : copy.saveEvent}
          </button>
        </form>

        <div className="min-h-[320px]">
          {loading ? (
            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-8 text-center text-[13px] text-[#94a3b8]">
              {copy.loading}
            </div>
          ) : (
            <EventCalendar events={filtered} />
          )}
        </div>
      </div>

      <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">{copy.listTitle(filtered.length)}</h2>
        {filtered.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">{copy.emptyList}</p>
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
                      {ev.dateKey} · {copy.types[ev.type] || ev.type} ·{' '}
                      {copy.impacts[ev.impact] || ev.impact}
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
                        {copy.linkedReport}
                      </Link>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      <FeedbackBtn
                        label={copy.feedback.confirmed}
                        active={ev.userFeedback?.wasAccurate === true}
                        onClick={() =>
                          void setFeedback(ev.id, true, copy.feedback.confirmed)
                        }
                        tone="good"
                      />
                      <FeedbackBtn
                        label={copy.feedback.partial}
                        active={
                          ev.userFeedback?.wasAccurate == null &&
                          isPartialFeedbackNotes(ev.userFeedback?.userNotes)
                        }
                        onClick={() =>
                          void setFeedback(ev.id, null, copy.feedback.partialNotes)
                        }
                        tone="mid"
                      />
                      <FeedbackBtn
                        label={copy.feedback.missed}
                        active={ev.userFeedback?.wasAccurate === false}
                        onClick={() =>
                          void setFeedback(ev.id, false, copy.feedback.missed)
                        }
                        tone="bad"
                      />
                    </div>
                    {ev.userFeedback?.userNotes || ev.userFeedback?.wasAccurate != null ? (
                      <span className="text-[10px] text-[#94a3b8]">
                        {copy.feedback.recorded}
                        {ev.userFeedback?.wasAccurate === true
                          ? copy.feedback.confirmed
                          : ev.userFeedback?.wasAccurate === false
                            ? copy.feedback.missed
                            : isPartialFeedbackNotes(ev.userFeedback?.userNotes)
                              ? copy.feedback.partial
                              : ev.userFeedback?.userNotes || copy.feedback.fallbackNote}
                      </span>
                    ) : null}
                    {ev.fortuneAnalysis?.reportId ? (
                      <Link
                        href={buildEventReviewChatHref(ev, copy)}
                        className="mt-1 text-[11px] font-semibold text-[#3b5998] hover:underline"
                      >
                        {ev.userFeedback?.wasAccurate === false
                          ? copy.reviewDrift
                          : ev.userFeedback?.wasAccurate === true
                            ? copy.reviewConfirmed
                            : copy.reviewOpen}
                      </Link>
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
            title: events.find((e) => e.id === id)?.title || copy.defaultEventTitle,
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
        prev && !prev.includes(copy.localCacheMarker)
          ? prev
          : copy.feedbackLocalOnly
      );
    }
  }
}

type HubCopy = ReturnType<typeof eventsHubCopy>;

/** After accurate/drift feedback → consultant-card chat opening for review */
function buildEventReviewChatHref(ev: EventViewModel, copy: HubCopy): string {
  const reportId = ev.fortuneAnalysis?.reportId || undefined;
  const accurate = ev.userFeedback?.wasAccurate;
  const title = ev.title || copy.defaultEventTitle;
  const windowLabel =
    accurate === false
      ? copy.windowDrift(title)
      : accurate === true
        ? copy.windowConfirmed(title)
        : copy.windowOpen(title);

  // Soft opening: land on practice/overview teacher with window context
  return buildChatHref({
    reportId: reportId || null,
    teacher: accurate === false ? 'practice' : 'overview',
    mode: 'opening',
    window: windowLabel,
    eventId: ev.id,
    source:
      accurate === false
        ? `events_feedback:drift:${ev.id}`
        : accurate === true
          ? `events_feedback:accurate:${ev.id}`
          : `events_feedback:open:${ev.id}`,
  });
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
