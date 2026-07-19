'use client';

/**
 * Lightweight "Add to Home Screen" chip for mobile browsers.
 * - Mobile-only (coarse pointer / narrow viewport)
 * - Hidden when already running as standalone PWA
 * - Dismiss stored in localStorage
 * Mount on quiet hubs only (e.g. /updates), not full-screen chat.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DISMISS_KEY = 'lk-pwa-install-hint-dismissed';

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari legacy
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  } catch {
    // ignore
  }
  return false;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(max-width: 768px)').matches) return true;
    if (window.matchMedia('(pointer: coarse)').matches) return true;
  } catch {
    // ignore
  }
  return false;
}

export default function PwaInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandaloneDisplay()) return;
    if (!isMobileViewport()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // private mode — still show
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[min(100%-2rem,22rem)] -translate-x-1/2 items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 shadow-[var(--shadow-card)]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[color:var(--ink-1)]">可添加到主屏幕</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--ink-4)]">
          浏览器菜单选择「添加到主屏幕」或「安装应用」，打开更快捷。
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="关闭提示"
        className="shrink-0 rounded p-1 text-[color:var(--ink-4)] transition hover:bg-[color:var(--brand-soft)] hover:text-[color:var(--ink-2)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
