'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';

// v5-D55 (2026-05-21): 右下角通栏 chat 入口
// v5-D60 (2026-05-21): FB Messenger 2017 风圆形 FAB + Messenger 弹层
const HIDE_PATTERNS: Array<RegExp | string> = [
  '/chat',
  '/analyze',          // analyze 页有移动端 sticky 主 CTA，避免撞车
  /^\/admin(\/|$)/,
  /^\/login(\/|$)/,
  /^\/r\/[^/]+\/edit/, // 预留：未来报告编辑页
];

const DISMISS_KEY = 'lk-chat-fab-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 关闭后 3 天再出
const FB_BLUE = '#3b5998';

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
  const [popoverOpen, setPopoverOpen] = useState(false);

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
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', fontFamily: 'Helvetica, Arial, sans-serif' }}
      aria-live="polite"
    >
      {popoverOpen ? (
        <div className="w-[280px] overflow-hidden rounded-[3px] border border-[#dddfe2] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
          <div
            className="flex items-center justify-between px-3 py-2 text-[13px] font-bold text-white"
            style={{ background: FB_BLUE }}
          >
            <span>WorldYi 追问</span>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              aria-label="收起"
              className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] text-white/90 hover:bg-white/15"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-3 py-3 text-[13px] leading-5 text-[#1d2129]">
            <p className="font-semibold">向 WorldYi 追问一句</p>
            <p className="mt-1 text-[12px] text-[#606770]">
              不用注册 · 直接问命理结构 / 阶段 / 时机
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={href}
                onClick={onClick}
                data-analytics-target="chat_fab_link"
                className="fb-btn fb-btn-primary inline-flex flex-1 items-center justify-center px-3 py-1.5 text-[13px] font-bold"
              >
                打开对话
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="fb-btn px-3 py-1.5 text-[12px] text-[#606770]"
                aria-label="3 天内不再显示"
              >
                以后再说
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setPopoverOpen((v) => !v)}
        aria-label={popoverOpen ? '收起追问入口' : '打开追问入口'}
        aria-expanded={popoverOpen}
        data-analytics-target="chat_fab_toggle"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        style={{ background: FB_BLUE }}
      >
        {popoverOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>
    </div>
  );
}
