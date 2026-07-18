'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

export type ConclusionShareCardProps = {
  /** Short brand line */
  eyebrow?: string;
  /** Main line, e.g. 日主甲木 · 当前宜稳 */
  title: string;
  /** 1–3 supporting lines (no superstition slogans) */
  lines?: string[];
  /** Absolute or path URL to share */
  url?: string;
  /** Compact = single row actions under card */
  compact?: boolean;
  className?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Shareable “one-screen conclusion” card for viral / ASO-style distribution.
 * No fake stats, no destiny threats — structure + rhythm language only.
 */
export function ConclusionShareCard({
  eyebrow = '人生K线 · 结构参考',
  title,
  lines = [],
  url,
  compact = false,
  className = '',
}: ConclusionShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const pageUrl = useMemo(() => {
    if (url) {
      if (url.startsWith('http')) return url;
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
      }
      return `https://www.life-kline.com${url.startsWith('/') ? url : `/${url}`}`;
    }
    if (typeof window !== 'undefined') return window.location.href;
    return 'https://www.life-kline.com/';
  }, [url]);

  const shareBody = useMemo(() => {
    const parts = [eyebrow, title, ...lines.filter(Boolean), pageUrl].filter(Boolean);
    return parts.join('\n');
  }, [eyebrow, title, lines, pageUrl]);

  const onCopy = async () => {
    const ok = await copyText(shareBody);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const onShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${eyebrow} · ${title}`.slice(0, 80),
          text: [title, ...lines].filter(Boolean).join('\n'),
          url: pageUrl,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
        return;
      } catch {
        // fall through to copy
      }
    }
    await onCopy();
  };

  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] ${className}`}
    >
      <div
        className={`relative ${compact ? 'p-3.5' : 'p-4 md:p-5'}`}
        style={{
          background:
            'linear-gradient(165deg, color-mix(in srgb, var(--bg-sunken) 70%, white) 0%, var(--paper) 55%)',
        }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-5)]">
          {eyebrow}
        </div>
        <h3 className="mt-1.5 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[17px]">
          {title}
        </h3>
        {lines.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {lines.slice(0, 3).map((line) => (
              <li
                key={line}
                className="text-[12px] leading-[1.5] text-[color:var(--ink-3)]"
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-2.5 text-[10px] leading-[1.4] text-[color:var(--ink-5)]">
          结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--hairline)] px-3 py-2">
        <button
          type="button"
          onClick={() => void onShare()}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[color:var(--brand-strong)] px-3 text-[12px] font-semibold text-white hover:opacity-90"
        >
          <Share2 className="h-3.5 w-3.5" />
          {shared ? '已唤起分享' : '分享结论'}
        </button>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-[12px] font-medium text-[color:var(--ink-2)] hover:border-[color:var(--brand)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[color:var(--data-up)]" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              复制文案
            </>
          )}
        </button>
      </div>
    </div>
  );
}
