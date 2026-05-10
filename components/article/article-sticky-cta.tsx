'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ARTICLE_CTA_COPY, type ArticleContentType } from '@/lib/article-cta';

interface ArticleStickyCTAProps {
  surfaceKey: string;
  slug: string;
  contentType: ArticleContentType;
}

const DISMISSED_KEY_PREFIX = 'article-sticky-dismissed:';
const SHOW_AFTER_SCROLL_PX = 200;

export default function ArticleStickyCTA({ surfaceKey, slug, contentType }: ArticleStickyCTAProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const impressed = useRef<boolean>(false);
  const copy = ARTICLE_CTA_COPY[contentType];

  useEffect(() => {
    const dismissedKey = `${DISMISSED_KEY_PREFIX}${slug}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dismissedKey) === '1') {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      if (window.scrollY >= SHOW_AFTER_SCROLL_PX && !visible) {
        setVisible(true);
        if (!impressed.current) {
          impressed.current = true;
          void trackClientEvent({
            eventName: 'article_cta_impressed',
            page: window.location.pathname,
            meta: { surfaceKey, slug, contentType, position: 'sticky' },
          });
        }
      }
    };

    const onInlineImpressed = () => setFadingOut(true);
    const onScrollToBottom = () => {
      const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining < 100) setFadingOut(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScrollToBottom, { passive: true });
    window.addEventListener('article-cta-impressed', onInlineImpressed);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScrollToBottom);
      window.removeEventListener('article-cta-impressed', onInlineImpressed);
    };
  }, [surfaceKey, slug, contentType, visible]);

  if (dismissed || !visible) return null;

  const handleClick = () => {
    void trackClientEvent({
      eventName: 'article_cta_clicked',
      page: window.location.pathname,
      meta: { surfaceKey, slug, contentType, position: 'sticky' },
    });
    void trackClientEvent({
      eventName: 'content_quick_analyze_started',
      page: window.location.pathname,
      meta: {
        surfaceKey,
        sourceKey: surfaceKey,
        sourceLabel: '文章页 Sticky 快速分析',
        contentType,
        slug,
        position: 'sticky',
      },
    });
    window.dispatchEvent(
      new CustomEvent('article-cta-clicked', {
        detail: { surfaceKey, position: 'sticky' },
      })
    );
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`${DISMISSED_KEY_PREFIX}${slug}`, '1');
    }
  };

  const href = `/analyze?from=${encodeURIComponent(surfaceKey)}&surface=sticky`;

  return (
    <div
      className={`fixed z-40 transition-opacity duration-200 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:w-[260px]`}
    >
      <div className="relative bg-[color:var(--paper)] border-t border-[color:var(--brand-soft-2)] md:rounded-[var(--radius-md)] md:border md:shadow-lg p-3 md:p-4 flex md:flex-col items-center md:items-start gap-3 md:gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭"
          className="absolute top-1 right-1 md:top-2 md:right-2 p-1 text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="flex-1 md:flex-initial text-sm md:text-base font-bold text-[color:var(--ink-1)] pr-6 md:pr-0">
          {copy.sticky.headline}
        </p>
        <Link
          href={href}
          onClick={handleClick}
          className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-strong)] px-4 py-2 text-sm font-bold text-white whitespace-nowrap"
        >
          {copy.sticky.button}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
