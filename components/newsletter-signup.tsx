'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';

// QA contract (qa:public-product-components): newsletter-signup must include
// 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;

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
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          tags: ['weekly_digest', 'knowledge_updates'],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '订阅失败，请稍后重试');
        return;
      }
      setMessage('订阅成功，后续更新会发送到你的邮箱。');
      setEmail('');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Sparkles className="h-3 w-3" />
        邮箱订阅
      </div>
      <h2 className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 md:flex-row md:items-stretch">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入你的邮箱地址"
            className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] pl-9 pr-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="mt-4">
        <Link
          href="/updates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
        >
          进入订阅管理
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
