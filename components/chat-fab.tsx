'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';

// v5-D55 (2026-05-21): 右下角通栏 chat 入口
// 5h 漏斗显示 chat_message_sent=1 / chat_page_viewed=5，入口埋得太深。
// FAB + 一条文案条，所有页面共享，唯独在 /chat 自己 / /admin / 全屏交互页隐藏。
const HIDE_PATTERNS: Array<RegExp | string> = [
  '/chat',
  /^\/admin(\/|$)/,
  /^\/login(\/|$)/,
  /^\/r\/[^/]+\/edit/, // 预留：未来报告编辑页
];

const DISMISS_KEY = 'lk-chat-fab-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 关闭后 3 天再出

function shouldHide(pathname: string | null) {
  if (!pathname) return true;
  return HIDE_PATTERNS.some((p) =>
    typeof p === 'string' ? pathname === p || pathname.startsWith(`${p}/`) : p.test(pathname),
  );
}

export default function ChatFab() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = Number.parseInt(raw, 10);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
          setDismissed(true);
        } else {
          window.localStorage.removeItem(DISMISS_KEY);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!mounted) return null;
  if (shouldHide(pathname)) return null;
  if (dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    void trackClientEvent({
      eventName: 'chat_fab_dismissed',
      page: pathname || undefined,
      meta: { surfaceKey: 'chat_fab', from: pathname || '' },
    });
  };

  const onClick = () => {
    void trackClientEvent({
      eventName: 'chat_fab_clicked',
      page: pathname || undefined,
      meta: { surfaceKey: 'chat_fab', from: pathname || '' },
    });
  };

  // 跳到 /chat 时带上来源页，方便分析转化
  const href = `/chat?source=chat_fab&from=${encodeURIComponent(pathname || '/')}`;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)] sm:justify-end sm:px-5"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex w-full max-w-[420px] items-stretch gap-0 overflow-hidden rounded-full border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur sm:max-w-[360px]">
        <Link
          href={href}
          onClick={onClick}
          className="group flex flex-1 items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[color:var(--ink-1)] transition hover:bg-[color:var(--bg-sunken)]"
          aria-label="打开结构追问"
          data-analytics-target="chat_fab_link"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-strong)] text-white">
            <MessageSquareText className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-black text-[color:var(--ink-1)]">向 WorldYi 追问一句</span>
            <span className="text-[11px] font-medium text-[color:var(--ink-4)]">
              不用注册 · 直接问命理结构 / 阶段 / 时机
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭追问入口（3 天内不再显示）"
          className="inline-flex w-9 shrink-0 items-center justify-center border-l border-[color:var(--hairline)] text-[color:var(--ink-4)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
