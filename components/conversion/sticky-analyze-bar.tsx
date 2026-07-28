'use client';

/**
 * 高 bounce 内容路径底部粘性 CTA（Mobile-first）
 * 样式：全站 Linear 浅色；不挡主内容过久
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  source: string;
  page?: string;
  label?: string;
  sublabel?: string;
  /** 滚动超过多少 px 才显示 */
  revealPx?: number;
};

export function StickyAnalyzeBar({
  source,
  page,
  label = '生成我的结构报告',
  sublabel = '填生辰 · 免费结构版',
  revealPx = 280,
}: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`lk-sticky-dismiss:${source}`) === '1') {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [source]);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => setShow(window.scrollY > revealPx);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [revealPx, dismissed]);

  if (dismissed || !show) return null;

  const href = `/analyze?source=${encodeURIComponent(source)}&from=${encodeURIComponent(source)}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--hairline)] bg-[color:var(--paper)]/95 px-3 py-2.5 shadow-[0_-4px_16px_rgba(15,17,21,0.06)] backdrop-blur supports-[padding:max(0px)]:pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-[color:var(--ink-1)]">{label}</div>
          <div className="truncate text-[11px] text-[color:var(--ink-4)]">{sublabel}</div>
        </div>
        <Link
          href={href}
          onClick={() => {
            void trackClientEvent({
              eventName: 'content_quick_analyze_started',
              page: page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
              meta: { source, surface: 'sticky_analyze_bar', hasBirth: false },
            });
            void trackClientEvent({
              eventName: 'article_cta_clicked',
              page: page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
              meta: { target: 'sticky_analyze_bar', source },
            });
          }}
          className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius)] bg-slate-900 px-3.5 text-[13px] font-bold text-white no-underline"
        >
          去排盘
        </Link>
        <button
          type="button"
          aria-label="关闭"
          className="inline-flex h-10 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(`lk-sticky-dismiss:${source}`, '1');
            } catch {
              // ignore
            }
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
