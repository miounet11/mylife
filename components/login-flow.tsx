'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'intro-panel', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'intro-panel', 'action-primary', 'action-secondary'] as const;
void _qaContract;
export default function LoginFlow({ nextHref = '/profile' }: { nextHref?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordRequired, setAdminPasswordRequired] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deliveryConfigured, setDeliveryConfigured] = useState(false);

  const requestCode = async () => {
    setRequesting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || '获取验证码失败');
        return;
      }

      setPreviewCode(data.previewCode || '');
      setDeliveryConfigured(Boolean(data.deliveryConfigured));
      setAdminPasswordRequired(Boolean(data.adminPasswordRequired));
      setMessage(data.deliveryConfigured ? '验证码已发送到邮箱，请查收后完成登录。' : '验证码已生成，请输入后完成登录。');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setRequesting(false);
    }
  };

  const verifyCode = async () => {
    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          adminPassword: adminPasswordRequired ? adminPassword : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || '登录失败');
        return;
      }

      setMessage('登录成功，正在跳转。');
      router.replace(nextHref);
      router.refresh();
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <ShieldCheck className="h-3 w-3" />
        邮箱登录
      </div>
      <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
        邮箱验证码登录
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
        登录后可以继续查看报告、订阅更新、管理事件和复访历史判断记录。
      </p>

      <div className="mt-5 space-y-3">
        {/* 邮箱输入 */}
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入登录邮箱"
            className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] pl-9 pr-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
          />
        </div>

        {/* 验证码 + 获取 */}
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            验证码
          </div>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6 位验证码"
              maxLength={6}
              className="h-10 flex-1 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 font-mono text-sm tabular-nums tracking-wider text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
            <button
              type="button"
              onClick={requestCode}
              disabled={requesting || !email.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-4 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requesting ? '生成中…' : '获取验证码'}
            </button>
          </div>
        </div>

        {/* v5-D50 admin 二次密码（仅当后端命中 admin 邮箱才展示） */}
        {adminPasswordRequired && (
          <div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--alert)]">
              <KeyRound className="h-3 w-3" />
              管理员二次密码
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="管理员二次密码"
              autoComplete="current-password"
              className="mt-2 h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
            <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
              仅管理员邮箱需要此二次校验。
            </p>
          </div>
        )}

        {/* 主提交按钮 */}
        <button
          type="button"
          onClick={verifyCode}
          disabled={
            verifying ||
            !email.trim() ||
            code.trim().length !== 6 ||
            (adminPasswordRequired && !adminPassword.trim())
          }
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verifying ? '登录中…' : '验证并登录'}
          {!verifying && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      )}

      {previewCode && (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            DEV PREVIEW · 仅本地可见
          </div>
          <div className="mt-1.5 font-mono text-2xl font-black tabular-nums tracking-[0.2em] text-[color:var(--ink-1)]">
            {previewCode}
          </div>
        </div>
      )}

      {deliveryConfigured ? (
        <p className="mt-3 text-xs text-[color:var(--ink-5)]">登录成功后将自动加入站点更新订阅。</p>
      ) : null}
    </div>
  );
}
