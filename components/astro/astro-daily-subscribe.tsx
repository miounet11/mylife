'use client';

import { useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { fetchJsonWithTimeout } from '@/lib/utils';

/** Opt-in for public 星座日运简报 (tag astro:daily). */
export default function AstroDailySubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
      }>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'astro_daily_subscribe',
          tags: ['astro:daily'],
          appendTags: true,
        }),
        timeoutMs: 12_000,
        timeoutReason: 'astro-subscribe',
      });
      if (!response.ok || data.success === false) {
        setStatus('err');
        setMessage(data.error || data.message || '订阅失败，请稍后重试');
        return;
      }
      setStatus('ok');
      setMessage('已登记星座日运简报（astro:daily）。请查收确认邮件（若已开启）。');
      void trackClientEvent({
        eventName: 'astro_daily_subscribed',
        page: '/astro',
        meta: { source: 'astro_hub' },
      });
    } catch {
      setStatus('err');
      setMessage('网络超时，请稍后重试');
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4 shadow-sm md:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
        Email · 可选
      </p>
      <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">订阅「星座日运简报」</h2>
      <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        每天一条公共层简报：通书宜忌 + 十二星座引擎排名，可点进证据页。
        <strong className="text-[color:var(--ink-3)]">不含个人命盘</strong>
        ；需要「我的日运」请用生日查询。随时可在邮件偏好关闭。
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-[220px] flex-1 rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--ink-3)]"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-[color:var(--brand)] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {status === 'loading' ? '提交中…' : '订阅简报'}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-2 text-[12px] ${status === 'err' ? 'text-amber-800' : 'text-emerald-800'}`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
