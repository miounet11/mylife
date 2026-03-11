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
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-2xl rounded-[2rem] p-8 md:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-3xl font-black text-[color:var(--ink)]">页面临时出错了</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
          这通常是临时请求异常或页面状态中断。我们把错误页也做成明确可恢复的动作面板，而不是让用户被动退出。
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
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
