'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/profile';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRequired, setAdminRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '发送失败');
      setAdminRequired(!!data.adminPasswordRequired);
      setStep('code');
      const devHint = data.devCode ? ` 开发验证码：${data.devCode}` : '';
      setMessage(`${data.message || '验证码已发送'}${devHint}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, adminPassword: adminRequired ? adminPassword : undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '验证失败');
      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setLoading(false);
    }
  }

  const isMembershipNext =
    nextPath.includes('/membership') || nextPath.includes('membership');

  return (
    <div className="border-y border-[color:var(--hairline)] py-5">
      {isMembershipNext ? (
        <p className="mb-4 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          限时免费会员：登录成功后将回到会员页，可 0 元领取季度/年度（无需支付）。
        </p>
      ) : null}
      {message ? <AlertBanner tone="success" className="mb-3 text-xs">{message}</AlertBanner> : null}
      {error ? <AlertBanner className="mb-3 text-xs">{error}</AlertBanner> : null}

      {step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void requestCode();
          }}
          className="space-y-3"
        >
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[color:var(--ink-2)]">邮箱</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="fb-input h-10 w-full px-3 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '发送验证码'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
          className="space-y-3"
        >
          <p className="text-[13px] text-[color:var(--ink-5)]">
            验证码已发送至 <span className="font-medium text-[color:var(--ink-1)]">{email}</span>
          </p>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[color:var(--ink-2)]">6 位验证码</span>
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="fb-input h-10 w-full px-3 text-sm tracking-[0.3em]"
            />
          </label>
          {adminRequired ? (
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[color:var(--ink-2)]">管理员二次密码</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="fb-input h-10 w-full px-3 text-sm"
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录并继续'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-center text-[13px] text-[color:var(--ink-3)] underline-offset-2 hover:underline"
          >
            更换邮箱
          </button>
        </form>
      )}
    </div>
  );
}
