'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import {
  ARTICLE_CTA_COPY,
  buildArticleAnalyzeHref,
  buildArticleAnalyzeStartMeta,
  type ArticleContentType,
} from '@/lib/article-cta';

interface ArticleInlineCTAProps {
  surfaceKey: string;
  slug: string;
  contentType: ArticleContentType;
}

export default function ArticleInlineCTA({ surfaceKey, slug, contentType }: ArticleInlineCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const impressed = useRef<boolean>(false);
  const copy = ARTICLE_CTA_COPY[contentType];

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressed.current) {
            impressed.current = true;
            void trackClientEvent({
              eventName: 'article_cta_impressed',
              page: window.location.pathname,
              meta: { surfaceKey, slug, contentType, position: 'inline' },
            });
            window.dispatchEvent(
              new CustomEvent('article-cta-impressed', {
                detail: { surfaceKey, position: 'inline' },
              })
            );
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [surfaceKey, slug, contentType]);

  const handleClick = () => {
    void trackClientEvent({
      eventName: 'article_cta_clicked',
      page: window.location.pathname,
      meta: { surfaceKey, slug, contentType, position: 'inline' },
    });
    void trackClientEvent({
      eventName: 'content_quick_analyze_started',
      page: window.location.pathname,
      meta: buildArticleAnalyzeStartMeta({
        surfaceKey,
        slug,
        contentType,
        position: 'inline',
        sourceLabel: '文章页内联快速分析',
      }),
    });
    window.dispatchEvent(
      new CustomEvent('article-cta-clicked', {
        detail: { surfaceKey, position: 'inline' },
      })
    );
  };

  const href = buildArticleAnalyzeHref(surfaceKey, 'inline-card');

  return (
    <div
      ref={ref}
      data-article-inline-cta
      className="my-8 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-5 md:p-6"
    >
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Sparkles className="h-3 w-3" />
        亲身验证
      </div>
      <h3 className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
        {copy.inline.headline}
      </h3>
      <p className="mt-1 text-sm text-[color:var(--ink-2)]">{copy.inline.subline}</p>
      <Link
        href={href}
        onClick={handleClick}
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-strong)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        {copy.inline.button}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
