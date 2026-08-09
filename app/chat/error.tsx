'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { reportPageError } from '@/components/client-error-boundary';

/** Route-level error UI for /chat — logs + recovery without full app shell collapse. */
export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportPageError(error, '/chat');
    console.error('[chat/error]', error);
  }, [error]);

  return (
    <div className="page-frame flex min-h-[50vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6">
        <AlertTriangle className="h-7 w-7 text-[color:var(--alert)]" />
        <h1 className="mt-3 text-lg font-black text-[color:var(--ink-1)]">对话页暂时无法打开</h1>
        <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">
          错误已自动上报。常见原因：旧部署缓存、老师参数异常、或浏览器扩展干扰。请重试；仍失败可从报告页进入（自动带 reportId）。
        </p>
        {error.message ? (
          <p className="mt-2 font-mono text-[11px] text-[color:var(--ink-5)]">
            {error.name}: {error.message.slice(0, 180)}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--ink-1)] px-4 py-2 text-[13px] font-semibold text-white"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            重试
          </button>
          <Link
            href="/analyze"
            className="inline-flex items-center rounded-[var(--radius)] border border-[color:var(--hairline)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink-2)]"
          >
            先生成报告
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center rounded-[var(--radius)] border border-[color:var(--hairline)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink-2)]"
          >
            我的档案
          </Link>
        </div>
      </div>
    </div>
  );
}
