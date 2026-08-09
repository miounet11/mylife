'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { reportPageError } from '@/components/client-error-boundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleServerActionError =
    error.message.includes('Failed to find Server Action') ||
    `${error.digest || ''}`.includes('Failed to find Server Action');

  useEffect(() => {
    console.error('Application error:', error);
    reportPageError(error);
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
      <div className="w-full max-w-2xl rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-8 backdrop-blur-md md:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--alert-soft)] text-[color:var(--alert)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-3xl font-black text-[color:var(--ink)]">页面临时出错了</h2>
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-4 py-3 text-sm leading-7 text-[color:var(--ink-4)]">
          <div className="text-sm font-semibold text-[color:var(--ink)]">恢复方式</div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">
            {isStaleServerActionError
              ? '当前页面可能来自旧部署版本，系统会自动刷新一次以恢复到最新版本。'
              : '这通常是临时请求异常或页面状态中断。优先重新加载；对话页建议从报告「继续深问」带 reportId 进入。'}
          </div>
          {error.digest || error.message ? (
            <div className="mt-2 font-mono text-[11px] text-[color:var(--ink-5)]">
              {error.digest ? `digest ${error.digest}` : null}
              {error.message ? ` · ${error.message.slice(0, 160)}` : null}
            </div>
          ) : null}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            重新加载
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <Link
            href="/chat?teacher=overview&mode=opening&source=error_recovery"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
          >
            重开对话
          </Link>
        </div>
      </div>
    </div>
  );
}
