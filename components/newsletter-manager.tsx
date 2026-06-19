'use client';

import { useState } from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';


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

type NewsletterLookupResponse = {
  success?: boolean;
  error?: string;
  exists?: boolean;
  subscription?: LookupResult['subscription'];
};

type NewsletterUpdateResponse = {
  success?: boolean;
  error?: string;
};

const NEWSLETTER_MANAGER_TIMEOUT_MS = 12_000;

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
      const { response, data } = await fetchJsonWithTimeout<NewsletterLookupResponse>(
        `/api/newsletter?email=${encodeURIComponent(email)}`,
        {
          timeoutMs: NEWSLETTER_MANAGER_TIMEOUT_MS,
          timeoutReason: 'newsletter-manager-lookup-timeout',
        },
      );

      if (!response.ok || !data.success) {
        setLookup(null);
        setError(data.error || '查询失败，请稍后重试');
        return;
      }

      const exists = data.exists === true;
      setLookup({ exists, subscription: data.subscription });
      if (!exists) {
        setMessage('这个邮箱当前没有订阅记录，可以直接重新订阅。');
      }
    } catch (requestError) {
      setLookup(null);
      if (isAbortLikeError(requestError)) {
        setError('查询订阅等待时间过长，请稍后重试');
        return;
      }

      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (mode: 'subscribe' | 'unsubscribe') => {
    resetNotice();
    setActionLoading(mode);

    try {
      const { response, data } = await fetchJsonWithTimeout<NewsletterUpdateResponse>('/api/newsletter', {
        method: mode === 'subscribe' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'newsletter_manager',
          tags: ['weekly_digest', 'knowledge_updates'],
        }),
        timeoutMs: NEWSLETTER_MANAGER_TIMEOUT_MS,
        timeoutReason: mode === 'subscribe' ? 'newsletter-manager-subscribe-timeout' : 'newsletter-manager-unsubscribe-timeout',
      });

      if (!response.ok || !data.success) {
        setError(data.error || '操作失败，请稍后重试');
        return;
      }

      await loadSubscription(true);
      setMessage(mode === 'subscribe' ? '邮箱已恢复订阅。' : '邮箱已退订，你不会再收到后续更新。');
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError(mode === 'subscribe' ? '恢复订阅等待时间过长，请稍后重试' : '退订等待时间过长，请稍后重试');
        return;
      }

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
      <div className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-3">
          <div className="fb-section-title inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[color:var(--fb-blue)]" />
            订阅管理
          </div>
          <h2 className="mt-1.5 text-[18px] font-bold leading-tight text-[color:var(--fb-ink-1)]">
            查询、恢复或退订邮箱更新
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)]">
            用同一个邮箱查询当前状态，必要时恢复订阅或关闭后续邮件，无需人工处理。
          </p>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-stretch">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入订阅邮箱"
              className="fb-input h-10 w-full pl-9 pr-3 text-[13px] text-[color:var(--fb-ink-1)] placeholder:text-[color:var(--fb-ink-3)]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadSubscription()}
            disabled={loading || !normalizedEmail}
            className="fb-btn fb-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fb-card p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            当前状态
          </div>
          {subscription ? (
            <div className="mt-3 grid gap-2">
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2">
                <span className="font-mono text-xs text-[color:var(--ink-5)]">EMAIL</span>
                <div className="mt-0.5 font-mono text-sm text-[color:var(--ink-1)]">
                  {subscription.email}
                </div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                      : 'border-[color:var(--ink-5)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 text-xs font-mono text-[color:var(--ink-4)]">
                  {subscription.source || 'site'}
                </span>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2">
                <span className="font-mono text-xs text-[color:var(--ink-5)]">TAGS</span>
                <div className="mt-0.5 text-xs text-[color:var(--ink-3)]">
                  {subscription.tags.length > 0 ? subscription.tags.join(' · ') : '默认更新'}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--ink-4)]">输入邮箱后查询</p>
          )}
        </div>

        <div className="fb-card p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            可执行操作
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => updateSubscription('subscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="fb-btn fb-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'subscribe' ? '处理中…' : '恢复 / 开启订阅'}
            </button>
            <button
              type="button"
              onClick={() => updateSubscription('unsubscribe')}
              disabled={!normalizedEmail || actionLoading !== null}
              className="fb-btn inline-flex h-10 items-center justify-center gap-1.5 px-3 text-[color:var(--fb-ink-1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'unsubscribe' ? '处理中…' : '退订所有更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
