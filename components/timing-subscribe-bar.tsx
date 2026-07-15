'use client';

import { useEffect, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { REPORT_SUBSCRIPTION_TAGS } from '@/lib/email-subscription-focus';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

interface Props {
  surfaceKey: string;
  reportId: string;
}

const GLOBAL_SUBSCRIBED_KEY = 'newsletter-subscribed';
const LEGACY_STORAGE_KEY = 'timing-subscribe-state:';

const VISIT_KEY = 'lk-report-visited-ids';
const VISIT_THRESHOLD = 3;
const DISMISS_KEY = 'lk-timing-subscribe-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const TIMING_SUBSCRIBE_TIMEOUT_MS = 12_000;

type TimingSubscribeResponse = {
  success?: boolean;
  error?: string;
};

function recordVisitAndCount(reportId: string): number {
  try {
    const raw = window.localStorage.getItem(VISIT_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return VISIT_THRESHOLD;
    if (!ids.includes(reportId)) {
      ids.push(reportId);
      const trimmed = ids.slice(-50);
      window.localStorage.setItem(VISIT_KEY, JSON.stringify(trimmed));
      return trimmed.length;
    }
    return ids.length;
  } catch {
    return VISIT_THRESHOLD;
  }
}

export default function TimingSubscribeBar({ surfaceKey, reportId }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hidden, setHidden] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const globalDone =
      localStorage.getItem(GLOBAL_SUBSCRIBED_KEY) === 'done' ||
      sessionStorage.getItem(LEGACY_STORAGE_KEY + reportId) === 'done';
    if (globalDone) {
      setDismissed(true);
      return;
    }
    const dismissedAtRaw = localStorage.getItem(DISMISS_KEY);
    if (dismissedAtRaw) {
      const ts = Number.parseInt(dismissedAtRaw, 10);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
        setDismissed(true);
        return;
      }
      localStorage.removeItem(DISMISS_KEY);
    }
    const visitCount = recordVisitAndCount(reportId);
    if (visitCount < VISIT_THRESHOLD) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY >= 200) setHidden(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [reportId]);

  if (dismissed) return null;

  if (hidden) return null;

  if (status === 'done') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-200 bg-emerald-50 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] md:bottom-6 md:right-6 md:left-auto md:w-[320px] md:rounded-[var(--radius-md)] md:border">
        <p className="text-sm font-semibold text-emerald-900">
          ✓ 已记下你的邮箱。我们会定期发送运势提醒和日常细节提示。
        </p>
      </div>
    );
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    void trackClientEvent({
      eventName: 'newsletter_bar_dismissed',
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      meta: { surfaceKey, reportId, source: 'timing_subscribe_bar' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { response, data } = await fetchJsonWithTimeout<TimingSubscribeResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: surfaceKey,
          reportId,
          tags: [...REPORT_SUBSCRIPTION_TAGS],
        }),
        timeoutMs: TIMING_SUBSCRIBE_TIMEOUT_MS,
        timeoutReason: 'timing-subscribe-timeout',
      });
      if (!response.ok || data.success === false) {
        throw new Error(data.error || '提交失败');
      }
      setStatus('done');
      localStorage.setItem(GLOBAL_SUBSCRIBED_KEY, 'done');
      void trackClientEvent({
        eventName: 'newsletter_subscribed',
        page: window.location.pathname,
        meta: { surfaceKey, reportId, source: 'timing_subscribe_bar' },
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(isAbortLikeError(err) ? '订阅等待时间过长，请稍后重试' : err instanceof Error ? err.message : '提交失败');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-4 shadow-[0_-14px_34px_rgba(0,0,0,0.10)] md:bottom-6 md:right-6 md:left-auto md:w-[360px] md:rounded-[var(--radius-md)] md:border md:shadow-xl">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="关闭订阅入口（7 天内不再显示）"
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--ink-4)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
      >
        ×
      </button>
      <p className="text-sm font-bold text-[color:var(--ink-1)] mb-1">
        留邮箱，日常运势细节我们会主动提醒你
      </p>
      <p className="text-xs text-[color:var(--ink-3)] mb-3 leading-5">
        每月窗口、节气切换、命理大事和日常注意事项都会发到你邮箱；报告页还可勾选最多 3 项重点关注。
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          className="flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--bg)] px-3 py-2 text-sm transition focus:outline-none focus:border-[color:var(--brand-strong)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)]"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || !email.trim()}
          className="rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-bold text-white whitespace-nowrap transition hover:bg-[color:var(--brand-strong)] disabled:opacity-50"
        >
          {status === 'submitting' ? '...' : '开始'}
        </button>
      </form>
      {errorMsg && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
      <p className="mt-2 text-xs text-[color:var(--ink-3)]">
        完全免费 · 随时可退订
      </p>
    </div>
  );
}