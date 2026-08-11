'use client';

/**
 * Growth capture: save progress without requiring email OTP first.
 * Paths: password register → Google → email code (link out).
 */

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  reportId?: string | null;
  source?: string;
  nextHref?: string;
  className?: string;
  compact?: boolean;
};

export default function AccountSavePanel({
  reportId,
  source = 'account_save_panel',
  nextHref,
  className = '',
  compact = false,
}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);

  const googleHref = useMemo(() => {
    const q = new URLSearchParams();
    q.set('source', source);
    if (reportId) q.set('reportId', reportId);
    if (nextHref) q.set('next', nextHref);
    else if (reportId) q.set('next', `/result/${reportId}`);
    else q.set('next', '/profile');
    return `/api/auth/google?${q.toString()}`;
  }, [nextHref, reportId, source]);

  const emailLoginHref = useMemo(() => {
    const q = new URLSearchParams();
    q.set('source', source);
    if (reportId) q.set('reportId', reportId);
    if (nextHref) q.set('next', nextHref);
    else if (reportId) q.set('next', `/result/${reportId}`);
    return `/login?${q.toString()}`;
  }, [nextHref, reportId, source]);

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: { target: 'password_register_save', source, reportId: reportId || null },
      });
      const res = await fetch('/api/auth/password/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          email: email.trim() || undefined,
          rememberMe: true,
          source,
          reportId: reportId || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '注册失败');
      }
      try {
        localStorage.setItem('life-kline:last-account', username.trim());
        localStorage.setItem('lk-email-bound', data.user?.email ? '1' : '0');
        if (data.user?.email) {
          localStorage.setItem('life-kline:lead-email', String(data.user.email));
        }
        localStorage.setItem('newsletter-subscribed', 'done');
      } catch {
        /* ignore */
      }
      setNeedsEmail(!!data.needsEmailBind);
      setDone(true);
      void trackClientEvent({
        eventName: 'auth_password_register',
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        meta: {
          source,
          reportId: reportId || null,
          reportClaimed: !!data.reportClaimed,
          hasEmail: !data.needsEmailBind,
          surface: 'account_save_panel',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section
        className={`rounded-[12px] border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)]/40 p-4 ${className}`}
      >
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--success)]" />
          <div>
            <p className="text-[14px] font-semibold text-[color:var(--ink-1)]">
              账号已创建 · 报告可跨设备找回
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
              下次用同一用户名和密码即可登录
              {needsEmail ? '。建议再绑定邮箱，方便订阅提醒与找回。' : '。'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={reportId ? `/result/${reportId}` : '/profile'}
                className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline"
              >
                继续看报告
              </Link>
              <Link
                href="/profile"
                className="fb-btn h-8 px-3 text-[12px] hover:no-underline"
              >
                我的资料
              </Link>
              {needsEmail ? (
                <Link
                  href={`/login?source=${encodeURIComponent(source)}_bind_email`}
                  className="fb-btn h-8 px-3 text-[12px] hover:no-underline"
                >
                  绑定邮箱
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[12px] border border-t-2 border-t-[color:var(--brand)] border-[color:var(--hairline)] bg-white p-4 md:p-5 ${className}`}
      id="account-save"
    >
      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
        <Sparkles className="h-3.5 w-3.5" />
        免费保存 · 30 秒
      </div>
      <h3 className="mt-1.5 text-[15px] font-semibold text-[color:var(--ink-1)] md:text-[16px]">
        {compact ? '创建账号，报告不丢' : '关掉页面前，先保存这次判断'}
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        用户名 + 密码即可 · 长期登录 · 邮箱可选（推荐，方便订阅提醒）
      </p>

      <a
        href={googleHref}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-white text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
      >
        <GoogleMark />
        使用 Google 一键保存
      </a>

      <div className="my-3 flex items-center gap-2 text-[11px] text-[color:var(--ink-5)]">
        <span className="h-px flex-1 bg-[color:var(--hairline)]" />
        或设账号密码
        <span className="h-px flex-1 bg-[color:var(--hairline)]" />
      </div>

      <form onSubmit={onRegister} className="space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名（3–32 位）"
            autoComplete="username"
            className="fb-input h-10 w-full px-3 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            autoComplete="new-password"
            className="fb-input h-10 w-full px-3 text-sm"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱（可选，推荐）"
          autoComplete="email"
          className="fb-input h-10 w-full px-3 text-sm"
        />
        {error ? (
          <p className="text-[12px] text-red-600">{error}</p>
        ) : (
          <p className="text-[11px] text-[color:var(--ink-5)]">
            注册即登录并尽量关联本报告 · 可随时在资料页绑定邮箱
          </p>
        )}
        <button
          type="submit"
          disabled={loading || username.trim().length < 3 || password.length < 6}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          创建账号并保存
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] text-[color:var(--ink-5)]">
        已有账号？
        <Link
          href={emailLoginHref.replace('/login?', '/login?').includes('login') ? emailLoginHref : `/login?source=${source}`}
          className="ml-1 font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          去登录
        </Link>
        <span className="mx-1.5 text-[color:var(--hairline-strong)]">·</span>
        <Link
          href={emailLoginHref}
          className="font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          邮箱验证码
        </Link>
      </p>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
