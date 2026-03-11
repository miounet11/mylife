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
      setMessage('验证码已生成，请输入后完成登录。');
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
      <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">用邮箱验证码绑定你的长期档案</h2>
      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
        登录后，游客状态下生成的分析结果、事件和内容订阅会被并入你的正式账号。管理员邮箱还会自动拥有内容后台权限。
      </p>

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

        <div className="flex flex-col gap-3 md:flex-row">
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
            className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] disabled:opacity-60"
          >
            {requesting ? '生成中...' : '获取验证码'}
          </button>
        </div>

        <button
          type="button"
          onClick={verifyCode}
          disabled={verifying || !email.trim() || code.trim().length !== 6}
          className="w-full rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
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
    </div>
  );
}
