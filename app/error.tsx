'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleServerActionError = (
    error.message.includes('Failed to find Server Action')
    || `${error.digest || ''}`.includes('Failed to find Server Action')
  );

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  useEffect(() => {
    if (!isStaleServerActionError || typeof window === 'undefined') {
      return;
    }

    const markerKey = 'life-kline:server-action-reloaded';
    if (window.sessionStorage.getItem(markerKey) === '1') {
      return;
    }

    window.sessionStorage.setItem(markerKey, '1');
    window.location.reload();
  }, [isStaleServerActionError]);

  useEffect(() => {
    if (!isStaleServerActionError || typeof window === 'undefined') {
      return;
    }

    const markerKey = 'life-kline:server-action-reloaded';
    const timer = window.setTimeout(() => {
      window.sessionStorage.removeItem(markerKey);
    }, 15000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isStaleServerActionError]);

  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-2xl rounded-[2rem] p-8 md:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-3xl font-black text-[color:var(--ink)]">页面临时出错了</h2>
        <p className="mt-3 max-w-xl text-xs leading-6 text-[color:var(--muted)]">
          {isStaleServerActionError
            ? '当前页面可能来自旧部署版本，系统会自动刷新一次以恢复到最新版本。'
            : '这通常是临时请求异常或页面状态中断。我们把错误页也做成明确可恢复的动作面板，而不是让用户被动退出。'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            重新加载
          </button>
          <Link
            href="/"
            className="action-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
