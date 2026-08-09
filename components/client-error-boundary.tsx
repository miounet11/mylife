'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  /** Optional route label for logs */
  route?: string;
  /** Compact inline recovery vs full page card */
  variant?: 'page' | 'inline';
};

type State = {
  error: Error | null;
  errorId: string | null;
};

function reportClientError(payload: Record<string, unknown>) {
  try {
    const json = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        '/api/client-error',
        new Blob([json], { type: 'application/json' }),
      );
      if (ok) return;
    }
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Client-side error boundary with server logging.
 * Use around high-risk islands (chat) and inside app/error.tsx reporting path.
 */
export class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, errorId: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const route =
      this.props.route ||
      (typeof window !== 'undefined' ? window.location.pathname : null);
    reportClientError({
      message: error.message || String(error),
      name: error.name,
      stack: error.stack,
      componentStack: info.componentStack,
      route,
      href: typeof window !== 'undefined' ? window.location.href : undefined,
      source: 'ClientErrorBoundary',
    });
    console.error('[ClientErrorBoundary]', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.variant === 'inline') {
      return (
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--alert)]" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                对话模块暂时中断
              </div>
              <p className="mt-1 text-[12px] leading-5 text-[color:var(--ink-3)]">
                已记录错误。请重试；若仍失败，可从报告页「继续深问」重新进入（会带上 reportId）。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => this.setState({ error: null })}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-3 py-1.5 text-[12px] font-semibold text-white"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  重试模块
                </button>
                <Link
                  href="/analyze"
                  className="inline-flex items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink-2)]"
                >
                  去排盘
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--ink-2)]"
                >
                  我的档案
                </Link>
              </div>
              <p className="mt-2 font-mono text-[10px] text-[color:var(--ink-5)]">
                {error.name}: {error.message.slice(0, 120)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6">
          <AlertTriangle className="h-8 w-8 text-[color:var(--alert)]" />
          <h2 className="mt-3 text-xl font-black text-[color:var(--ink-1)]">页面临时出错了</h2>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">
            错误已上报运维。可重新加载，或返回首页继续。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ink-1)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              重新加载
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[color:var(--hairline-strong)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink-2)]"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export function reportPageError(error: Error & { digest?: string }, route?: string) {
  reportClientError({
    message: error.message || String(error),
    name: error.name,
    digest: error.digest,
    stack: error.stack,
    route: route || (typeof window !== 'undefined' ? window.location.pathname : null),
    href: typeof window !== 'undefined' ? window.location.href : undefined,
    source: 'app/error',
  });
}
