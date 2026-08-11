'use client';

/**
 * Sticky + inline “一键测算” for knowledge / cases / dimensions content pages.
 * Always lands on /analyze with stable source attribution.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  source: string;
  page?: string;
  intent?: string;
  title?: string;
  description?: string;
  /** show sticky bottom bar after scroll */
  sticky?: boolean;
  className?: string;
};

export default function QuickAnalyzeCta({
  source,
  page,
  intent = 'career',
  title = '一键测算 · 把阅读变成你的报告',
  description = '免费填生辰即可出人生K线结构判断；不必先注册。',
  sticky = true,
  className = '',
}: Props) {
  const [showSticky, setShowSticky] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const analyzeHref = `/analyze?intent=${encodeURIComponent(intent)}&source=${encodeURIComponent(source)}&from=${encodeURIComponent(page || source)}`;

  useEffect(() => {
    if (!sticky || dismissed) return;
    const onScroll = () => {
      setShowSticky(window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [sticky, dismissed]);

  useEffect(() => {
    void trackClientEvent({
      eventName: 'content_quick_analyze_impression',
      page: page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      meta: { source, intent },
    });
  }, [page, source, intent]);

  return (
    <>
      <section
        className={`scroll-mt-header overflow-hidden rounded-[12px] border border-t-2 border-t-[color:var(--brand)] border-[color:var(--hairline)] bg-white p-4 md:p-5 ${className}`}
        id="quick-analyze"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              一键测算
            </p>
            <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{title}</h2>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
              {description}
            </p>
          </div>
          <Link
            href={analyzeHref}
            onClick={() =>
              void trackClientEvent({
                eventName: 'content_quick_analyze_click',
                page: page || undefined,
                meta: { source, intent, target: 'primary_link' },
              })
            }
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-[color:var(--ink-1)] px-4 text-[13px] font-semibold text-white no-underline hover:no-underline"
          >
            免费开始排盘
          </Link>
        </div>
        <div className="mt-3">
          <LightBirthBridge
            source={source}
            page={page}
            intent={intent}
            compact
            title="填出生日期，直接生成"
            description="可只填日期；时辰未知也能出结构报告（会标注可信度）。"
          />
        </div>
      </section>

      {sticky && showSticky && !dismissed ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--hairline)] bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur md:px-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[color:var(--ink-1)]">
                读到这里 · 生成你的结构报告
              </p>
              <p className="truncate text-[11px] text-[color:var(--ink-5)]">免费 · 约 1 分钟 · 无需先注册</p>
            </div>
            <Link
              href={analyzeHref}
              onClick={() =>
                void trackClientEvent({
                  eventName: 'content_quick_analyze_click',
                  page: page || undefined,
                  meta: { source, intent, target: 'sticky_bar' },
                })
              }
              className="inline-flex h-9 shrink-0 items-center rounded-full bg-[color:var(--brand-strong)] px-3.5 text-[12px] font-semibold text-white no-underline hover:no-underline"
            >
              一键测算
            </Link>
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setDismissed(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
