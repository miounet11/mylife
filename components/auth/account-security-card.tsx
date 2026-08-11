'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, Mail } from 'lucide-react';

/**
 * Profile: set password + bind email prompts for growth retention.
 */
export default function AccountSecurityCard() {
  const [session, setSession] = useState<{
    authenticated?: boolean;
    user?: {
      email?: string | null;
      username?: string | null;
      hasPassword?: boolean;
      needsEmailBind?: boolean;
    } | null;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) setSession({ authenticated: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session?.authenticated || !session.user) {
    return (
      <section className="rounded-[12px] border border-[color:var(--hairline)] bg-white p-4">
        <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">登录后保存更多判断</p>
        <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
          账号密码 / Google / 邮箱均可 · 报告不丢
        </p>
        <Link
          href="/login?source=profile_security&next=%2Fprofile"
          className="fb-btn fb-btn-primary mt-3 inline-flex h-9 px-4 text-[13px] hover:no-underline"
        >
          去登录 / 注册
        </Link>
      </section>
    );
  }

  const hasPassword = !!session.user.hasPassword;
  const needsEmail = !session.user.email || session.user.needsEmailBind;

  async function setPw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/password/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          currentPassword: hasPassword ? currentPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '设置失败');
      setMsg(data.message || '密码已保存');
      setPassword('');
      setCurrentPassword('');
      setSession((s) =>
        s
          ? {
              ...s,
              user: s.user ? { ...s.user, hasPassword: true } : s.user,
            }
          : s,
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : '设置失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-[12px] border border-[color:var(--hairline)] bg-white p-4">
      <div>
        <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">账号与登录</p>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
          {session.user.username ? `用户名 ${session.user.username}` : '已登录'}
          {session.user.email ? ` · ${session.user.email}` : ' · 未绑邮箱'}
        </p>
      </div>

      {needsEmail ? (
        <div className="rounded-[8px] border border-dashed border-[color:var(--brand)]/40 bg-[color:var(--brand-soft)]/30 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-2)]">
            <Mail className="h-3.5 w-3.5" />
            推荐绑定邮箱
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
            方便接收节点提醒、订阅内容与跨设备找回报告。
          </p>
          <Link
            href="/login?source=profile_bind_email&next=%2Fprofile"
            className="mt-2 inline-block text-[12px] font-semibold text-[color:var(--brand-strong)] underline-offset-2 hover:underline"
          >
            去绑定邮箱 →
          </Link>
        </div>
      ) : null}

      <form onSubmit={setPw} className="space-y-2 border-t border-[color:var(--hairline)] pt-3">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-2)]">
          <KeyRound className="h-3.5 w-3.5" />
          {hasPassword ? '修改密码' : '设置密码（下次免验证码）'}
        </p>
        {hasPassword ? (
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="当前密码"
            className="fb-input h-9 w-full px-3 text-sm"
          />
        ) : null}
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="新密码（至少 6 位）"
          autoComplete="new-password"
          className="fb-input h-9 w-full px-3 text-sm"
        />
        {err ? <p className="text-[11px] text-red-600">{err}</p> : null}
        {msg ? <p className="text-[11px] text-[color:var(--success)]">{msg}</p> : null}
        <button
          type="submit"
          disabled={loading || password.length < 6}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-3 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          保存密码
        </button>
      </form>
    </section>
  );
}
