'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck } from 'lucide-react';

export default function LoginFlow({ nextHref = '/profile' }: { nextHref?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
        body: JSON.stringify({ email, code }),
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
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="section-label">
        <ShieldCheck className="h-3.5 w-3.5" />
        邮箱登录
      </div>
      <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">邮箱验证码登录</h2>
      <div className="intro-copy mt-3 max-w-2xl">
        登录后可以继续查看报告、订阅更新、管理事件和复访历史判断记录。
      </div>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入登录邮箱"
            className="w-full rounded-full border border-[color:var(--line)] bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
          />
        </div>

        <div className="intro-panel space-y-2">
          <div className="action-guide">操作按钮</div>
          <div className="action-strip flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="输入 6 位验证码"
              className="flex-1 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
            />
            <button
              type="button"
              onClick={requestCode}
              disabled={requesting || !email.trim()}
              className="action-secondary px-5 py-3 disabled:opacity-60"
            >
              {requesting ? '生成中...' : '获取验证码'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={verifyCode}
          disabled={verifying || !email.trim() || code.trim().length !== 6}
          className="action-primary action-main w-full px-5 py-3 disabled:opacity-60"
        >
          {verifying ? '登录中...' : '验证并登录'}
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      {previewCode && (
        <div className="mt-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
          <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">开发环境验证码</div>
          <div className="mt-2 text-2xl font-black tracking-[0.2em] text-[color:var(--ink)]">{previewCode}</div>
        </div>
      )}

      {deliveryConfigured ? <div className="mt-4 text-sm text-[color:var(--muted)]">验证后订阅更新</div> : null}
    </div>
  );
}
