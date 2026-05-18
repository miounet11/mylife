'use client';

import { useEffect, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';

interface Props {
  surfaceKey: string;
  reportId: string;
}

// 全局订阅状态键：任意入口订阅成功后所有报告都视为已订阅
// 旧的 per-report sessionStorage 键保留读取兼容，不再写入
const GLOBAL_SUBSCRIBED_KEY = 'newsletter-subscribed';
const LEGACY_STORAGE_KEY = 'timing-subscribe-state:';

export default function TimingSubscribeBar({ surfaceKey, reportId }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hidden, setHidden] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 已订阅过（任何入口）→ 整个 bar 不再显示
    if (typeof window === 'undefined') return;
    const globalDone =
      localStorage.getItem(GLOBAL_SUBSCRIBED_KEY) === 'done' ||
      sessionStorage.getItem(LEGACY_STORAGE_KEY + reportId) === 'done';
    if (globalDone) {
      setDismissed(true);
      return;
    }
    // 滚动 200px 后显示
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
          ✓ 已记下你的邮箱。我们会在每个关键时点之前提醒你。
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: surfaceKey,
          tags: ['timing:monthly', 'timing:solar_terms', 'timing:major_events'],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
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
      setErrorMsg(err instanceof Error ? err.message : '提交失败');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-4 shadow-[0_-14px_34px_rgba(0,0,0,0.10)] md:bottom-6 md:right-6 md:left-auto md:w-[360px] md:rounded-[var(--radius-md)] md:border md:shadow-xl">
      <p className="text-sm font-bold text-[color:var(--ink-1)] mb-1">
        留邮箱，我们怕你错过这些时点
      </p>
      <p className="text-xs text-[color:var(--ink-3)] mb-3 leading-5">
        每月 1 号给你下个月的提醒；立春立夏立秋立冬前 7 天告诉你节气怎么过；本命年、换大运这种命理大事会单独告诉你。
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
      <p className="mt-2 text-[10px] text-[color:var(--ink-3)]">
        完全免费 · 随时可退订
      </p>
    </div>
  );
}
