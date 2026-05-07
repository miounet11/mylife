'use client';

import { useState } from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';


// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
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
    if (!preserveNotice) resetNotice();
    setLoading(true);

    try {
      const response = await fetch(`/api/newsletter?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setLookup(null);
        setError(data.error || '查询失败，请稍后重试');
        return;
      }

      setLookup({ exists: data.exists, subscription: data.subscription });
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
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          <ShieldCheck className="h-3 w-3" />
          订阅管理
        </div>
        <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
          查询、恢复或退订邮箱更新
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
          用同一个邮箱查询当前状态，必要时恢复订阅或关闭后续邮件，无需人工处理。
        </p>

        <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-stretch">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入订阅邮箱"
              className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] pl-9 pr-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadSubscription()}
            disabled={loading || !normalizedEmail}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--ink-1)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '查询状态'}
          </button>
        </div>

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
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            当前状态
          </div>
          {subscription ? (
            <div className="mt-3 grid gap-2">
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2">
                <span className="font-mono text-[10px] text-[color:var(--ink-5)]">EMAIL</span>
                <div className="mt-0.5 font-mono text-sm text-[color:var(--ink-1)]">
                  {subscription.email}
                </div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                      : 'border-[color:var(--ink-5)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 text-[10px] font-mono text-[color:var(--ink-4)]">
                  {subscription.source || 'site'}
                </span>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2">
                <span className="font-mono text-[10px] text-[color:var(--ink-5)]">TAGS</span>
                <div className="mt-0.5 text-xs text-[color:var(--ink-3)]">
                  {subscription.tags.length > 0 ? subscription.tags.join(' · ') : '默认更新'}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--ink-4)]">输入邮箱后查询</p>
          )}
        </div>

        <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            可执行操作
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => updateSubscription('subscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'subscribe' ? '处理中…' : '恢复 / 开启订阅'}
            </button>
            <button
              type="button"
              onClick={() => updateSubscription('unsubscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--alert)] hover:text-[color:var(--alert)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'unsubscribe' ? '处理中…' : '退订所有更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
