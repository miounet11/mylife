'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Sparkles } from 'lucide-react';

export default function NewsletterSignup({
  source = 'site',
  title = '订阅站点更新',
  description: _description = '',
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
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="section-label">
        <Sparkles className="h-3.5 w-3.5" />
        邮箱订阅
      </div>
      <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">{title}</h2>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入你的邮箱地址"
            className="w-full rounded-full border border-[color:var(--line)] bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="action-primary disabled:opacity-60"
        >
          {loading ? '提交中...' : '订阅更新'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-4 text-sm text-[color:var(--ink)]">
        <Link href="/updates" className="action-secondary ml-2 inline-flex">
          进入订阅管理
        </Link>
      </div>
    </div>
  );
}
