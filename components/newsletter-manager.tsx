'use client';

import { useState } from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

interface LookupResult {
  exists: boolean;
  subscription?: {
    email: string;
    status: string;
    source: string;
    tags: string[];
    updated_at?: string;
  };
}

export default function NewsletterManager() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'subscribe' | 'unsubscribe' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const resetNotice = () => {
    setError('');
    setMessage('');
  };

  const loadSubscription = async (preserveNotice = false) => {
    if (!preserveNotice) {
      resetNotice();
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/newsletter?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setLookup(null);
        setError(data.error || '查询失败，请稍后重试');
        return;
      }

      setLookup({
        exists: data.exists,
        subscription: data.subscription,
      });
      if (!data.exists) {
        setMessage('这个邮箱当前没有订阅记录，可以直接重新订阅。');
      }
    } catch {
      setLookup(null);
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (mode: 'subscribe' | 'unsubscribe') => {
    resetNotice();
    setActionLoading(mode);

    try {
      const response = await fetch('/api/newsletter', {
        method: mode === 'subscribe' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'newsletter_manager',
          tags: ['weekly_digest', 'knowledge_updates'],
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || '操作失败，请稍后重试');
        return;
      }

      await loadSubscription(true);
      setMessage(mode === 'subscribe' ? '邮箱已恢复订阅。' : '邮箱已退订，你不会再收到后续更新。');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setActionLoading(null);
    }
  };

  const normalizedEmail = email.trim();
  const subscription = lookup?.subscription;
  const isActive = subscription?.status === 'active';

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="section-label">
          <ShieldCheck className="h-3.5 w-3.5" />
          订阅管理
        </div>
        <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">查询、恢复或退订邮箱更新</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          适合管理知识文章、公开案例、产品更新等邮件通知。这里不做积分或复杂奖励，只保留最必要的控制能力。
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入订阅邮箱"
              className="w-full rounded-full border border-[color:var(--line)] bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void loadSubscription();
            }}
            disabled={loading || !normalizedEmail}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '查询状态'}
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="soft-card rounded-[1.75rem] p-6">
          <div className="text-sm font-semibold text-[color:var(--muted)]">当前状态</div>
          {subscription ? (
            <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--ink)]">
              <p>邮箱：{subscription.email}</p>
              <p>状态：{isActive ? '已订阅' : '已退订'}</p>
              <p>来源：{subscription.source || 'site'}</p>
              <p>标签：{subscription.tags.length > 0 ? subscription.tags.join(' / ') : '默认更新'}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
              输入邮箱后可查看当前订阅状态。如果没有记录，也可以直接恢复订阅。
            </p>
          )}
        </div>

        <div className="soft-card rounded-[1.75rem] p-6">
          <div className="text-sm font-semibold text-[color:var(--muted)]">可执行操作</div>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => updateSubscription('subscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionLoading === 'subscribe' ? '处理中...' : '恢复 / 开启订阅'}
            </button>
            <button
              type="button"
              onClick={() => updateSubscription('unsubscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] disabled:opacity-60"
            >
              {actionLoading === 'unsubscribe' ? '处理中...' : '退订所有更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
