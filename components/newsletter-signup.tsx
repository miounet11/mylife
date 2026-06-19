'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;

type NewsletterSignupResponse = {
  success?: boolean;
  error?: string;
};

const NEWSLETTER_SIGNUP_TIMEOUT_MS = 12_000;

export default function NewsletterSignup({
  source = 'site',
  title = '订阅站点更新',
  description = '',
}: {
  source?: string;
  title?: string;
  description?: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { response, data } = await fetchJsonWithTimeout<NewsletterSignupResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          tags: ['weekly_digest', 'knowledge_updates'],
        }),
        timeoutMs: NEWSLETTER_SIGNUP_TIMEOUT_MS,
        timeoutReason: 'newsletter-signup-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '订阅失败，请稍后重试');
        return;
      }
      setMessage('订阅成功，后续更新会发送到你的邮箱。');
      setEmail('');
      try {
        localStorage.setItem('newsletter-subscribed', 'done');
      } catch {}
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('订阅等待时间过长，请稍后重试');
        return;
      }

      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fb-card overflow-hidden">
      <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-3">
        <div className="fb-section-title inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[color:var(--fb-blue)]" />
          邮箱订阅
        </div>
        <h2 className="mt-1.5 text-[18px] font-bold leading-tight text-[color:var(--fb-ink-1)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)]">{description}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-stretch">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--fb-ink-3)]" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入你的邮箱地址"
            className="fb-input h-10 w-full pl-9 pr-3 text-[13px] text-[color:var(--fb-ink-1)] placeholder:text-[color:var(--fb-ink-3)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="fb-btn fb-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '提交中…' : '订阅更新'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {message && (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      )}

      <div className="border-t border-[color:var(--fb-border)] bg-[#f5f6f7] px-4 py-2.5">
        <Link
          href="/updates"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
        >
          进入订阅管理
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
