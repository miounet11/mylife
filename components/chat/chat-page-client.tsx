'use client';

/**
 * Chat client boundary.
 * Avoid next/dynamic infinite "loading" when chunk load hangs (CDN / Rocket Loader / network).
 * Manual import + timeout + retry so soft-nav to /profile never leaves a stuck full-viewport shell.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/analytics-client';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

const CHAT_LOAD_TIMEOUT_MS = 12_000;

type ChatProps = { uiLocale?: SiteLocale | string };

function ChatShellLoading({ en = false }: { en?: boolean }) {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
      data-chat-shell="loading"
    >
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
        {en ? 'Consultant' : '顾问开场'}
      </div>
      <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">
        {en ? 'Preparing your chat workspace' : '顾问对话准备中'}
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        {en
          ? 'Loading report anchors, foundation signals, and suggested starters…'
          : '正在载入报告锚点、数据底座信号与建议开场。'}
      </p>
      <div className="mt-3 space-y-2">
        {(en
          ? ['Structure first', 'Next action', 'What to verify']
          : ['先抓主线', '下一步动作', '如何回访验证']
        ).map((label) => (
          <div
            key={label}
            className="h-9 animate-pulse rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-[12px] text-[color:var(--ink-3)]"
          >
            {label}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-[color:var(--ink-5)]">
        {en ? 'Opening consultant chat…' : '正在打开顾问对话…'}
      </p>
    </div>
  );
}

function ChatShellError({
  en,
  onRetry,
}: {
  en: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-stretch gap-3 rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-sm"
      role="alert"
      data-chat-shell="error"
    >
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
        {en ? 'Consultant' : '顾问开场'}
      </div>
      <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">
        {en ? 'Chat failed to load' : '对话加载失败'}
      </h2>
      <p className="text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        {en
          ? 'The chat bundle timed out or was blocked. Retry, or continue from your profile / report.'
          : '聊天模块超时或被拦截。可重试，或先从档案 / 报告继续。'}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-slate-900 px-3 py-2 text-[12px] font-medium text-white hover:bg-slate-800"
        >
          {en ? 'Retry' : '重试'}
        </button>
        <Link
          href="/profile"
          className="rounded-md border border-[color:var(--hairline)] px-3 py-2 text-[12px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
        >
          {en ? 'My profile' : '我的档案'}
        </Link>
        <Link
          href="/analyze?source=chat_load_fallback"
          className="rounded-md border border-[color:var(--hairline)] px-3 py-2 text-[12px] font-medium text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
        >
          {en ? 'Create report' : '生成报告'}
        </Link>
      </div>
    </div>
  );
}

/** Client boundary for /chat — mounts full AI assistant with consultant opening. */
export default function ChatPageClient({
  uiLocale = 'zh-CN',
}: {
  uiLocale?: SiteLocale | string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const trackedKeyRef = useRef('');
  const en = isEnglishUiLocale(uiLocale);

  const [ChatComp, setChatComp] = useState<ComponentType<ChatProps> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => {
    setLoadError(false);
    setChatComp(null);
    setRetryToken((n) => n + 1);
  }, []);

  // Load chat bundle with timeout (never hang forever on dynamic import)
  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setChatComp(null);

    const load = async () => {
      try {
        const mod = await Promise.race([
          import('@/components/ai-assistant-chat'),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('CHAT_LOAD_TIMEOUT')), CHAT_LOAD_TIMEOUT_MS);
          }),
        ]);
        if (cancelled) return;
        if (mod?.default) {
          setChatComp(() => mod.default as ComponentType<ChatProps>);
        } else {
          setLoadError(true);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // Analytics (once per query key)
  useEffect(() => {
    const teacher = (searchParams.get('teacher') || '').trim();
    const mode = (searchParams.get('mode') || 'opening').trim() || 'opening';
    const source = (searchParams.get('source') || '').trim();
    const reportId = (searchParams.get('reportId') || searchParams.get('id') || '').trim();
    const intent = (searchParams.get('intent') || '').trim();
    const key = `${pathname}|${teacher}|${mode}|${source}|${reportId}|${intent}|${uiLocale}`;
    if (trackedKeyRef.current === key) return;
    trackedKeyRef.current = key;
    void trackClientEvent({
      eventName: 'chat_page_viewed',
      page: '/chat',
      meta: {
        surfaceKey: 'assistant',
        teacher: teacher || null,
        mode,
        source: source || null,
        reportId: reportId || null,
        intent: intent || null,
        hasReport: Boolean(reportId),
        locale: uiLocale || null,
      },
    });
  }, [searchParams, uiLocale, pathname]);

  // Leave chat route cleanly: drop heavy component reference on unmount
  useEffect(() => {
    return () => {
      setChatComp(null);
    };
  }, []);

  if (loadError) {
    return (
      <div
        className="flex min-h-[240px] w-full flex-1 items-center justify-center p-4"
        data-route="chat"
        data-ui-locale={uiLocale}
      >
        <ChatShellError en={en} onRetry={retry} />
      </div>
    );
  }

  if (!ChatComp) {
    return (
      <div
        className="flex min-h-[240px] w-full flex-1 items-center justify-center p-4"
        data-route="chat"
        data-ui-locale={uiLocale}
      >
        <ChatShellLoading en={en} />
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col"
      data-route="chat"
      data-ui-locale={uiLocale}
    >
      <ChatComp uiLocale={uiLocale} />
    </div>
  );
}
